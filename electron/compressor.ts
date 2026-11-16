import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { PDFDocument } from 'pdf-lib';

export interface CompressionOptions {
  id: string;
  filePath: string;
  level: 'light' | 'medium' | 'high' | 'custom';
  customTargetMB: number;
  outputFolder: string | null;
  overwriteOriginal: boolean;
  createBackup: boolean;
  preserveMetadata: boolean;
  preserveBookmarks: boolean;
  onProgress: (progress: number, message: string) => void;
}

export interface CompressionResult {
  success: boolean;
  outputPath?: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  reductionPercentage: number;
  error?: string;
  method?: string;
}

export interface PdfMetadataInfo {
  pageCount: number;
  fileSize: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pageSize?: string;
}

function getMutoolPath(): string | null {
  if ((process as any).resourcesPath) {
    const prodPath = path.join((process as any).resourcesPath, 'bin', 'mutool.exe');
    if (fs.existsSync(prodPath)) return prodPath;
  }
  const devPath = path.join(__dirname, '..', 'resources', 'bin', 'mutool.exe');
  if (fs.existsSync(devPath)) return devPath;
  return null;
}

function getQpdfPath(): string | null {
  if ((process as any).resourcesPath) {
    const prodPath = path.join((process as any).resourcesPath, 'bin', 'qpdf.exe');
    if (fs.existsSync(prodPath)) return prodPath;
  }
  const devPath = path.join(__dirname, '..', 'resources', 'bin', 'qpdf.exe');
  if (fs.existsSync(devPath)) return devPath;
  return null;
}

export async function getPdfDetails(filePath: string): Promise<PdfMetadataInfo> {
  const stat = await fs.promises.stat(filePath);
  const fileSize = stat.size;

  const fileBytes = await fs.promises.readFile(filePath);
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

  const pageCount = pdfDoc.getPageCount();
  let pageSize = 'A4';
  if (pageCount > 0) {
    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();
    const widthMm = Math.round(width * 0.352778);
    const heightMm = Math.round(height * 0.352778);
    if (Math.abs(widthMm - 210) < 5 && Math.abs(heightMm - 297) < 5) {
      pageSize = 'A4 (210 × 297 mm)';
    } else if (Math.abs(widthMm - 216) < 5 && Math.abs(heightMm - 279) < 5) {
      pageSize = 'Carta (Letter 216 × 279 mm)';
    } else {
      pageSize = `${widthMm} × ${heightMm} mm`;
    }
  }

  return {
    pageCount,
    fileSize,
    title: pdfDoc.getTitle() || undefined,
    author: pdfDoc.getAuthor() || undefined,
    subject: pdfDoc.getSubject() || undefined,
    creator: pdfDoc.getCreator() || undefined,
    producer: pdfDoc.getProducer() || undefined,
    creationDate: pdfDoc.getCreationDate() ? pdfDoc.getCreationDate()!.toLocaleDateString() : undefined,
    modificationDate: pdfDoc.getModificationDate() ? pdfDoc.getModificationDate()!.toLocaleDateString() : undefined,
    pageSize,
  };
}

/**
 * Render-and-repack: uses mutool draw to rasterize every page to JPEG,
 * then rebuilds the PDF with pdf-lib embedding those images.
 * Works on ANY PDF regardless of content type.
 */
async function renderAndRepackPdf(
  inputPath: string,
  outputPath: string,
  dpi: number,
  mutoolPath: string,
  onProgress: (pct: number, msg: string) => void
): Promise<void> {
  const tmpDir = path.join(
    os.tmpdir(),
    `pdfcomp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  await fs.promises.mkdir(tmpDir, { recursive: true });

  try {
    onProgress(15, `Renderizando páginas a ${dpi} DPI...`);

    // Render all pages to JPEG via mutool draw
    const jpegPattern = path.join(tmpDir, 'page_%04d.jpg');
    await runProcess(mutoolPath, [
      'draw',
      '-F', 'jpeg',
      '-r', String(dpi),
      '-o', jpegPattern,
      inputPath,
    ]);

    onProgress(55, 'Empaquetando imágenes en PDF...');

    const files = (await fs.promises.readdir(tmpDir))
      .filter(f => /page_\d+\.jpg$/.test(f))
      .sort()
      .map(f => path.join(tmpDir, f));

    if (files.length === 0) {
      throw new Error('mutool draw no produjo páginas. El PDF puede estar protegido o corrupto.');
    }

    // Load original to get page dimensions (in points)
    const originalBytes = await fs.promises.readFile(inputPath);
    const originalPdf = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
    const origPageCount = originalPdf.getPageCount();

    const newPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const pct = 55 + Math.round(((i + 1) / files.length) * 30);
      onProgress(pct, `Procesando página ${i + 1} de ${files.length}...`);

      const jpegBytes = await fs.promises.readFile(files[i]);
      const jpegImage = await newPdf.embedJpg(jpegBytes);

      // Preserve original paper size (in PDF points = 1/72 inch)
      let pageWidth = jpegImage.width * (72 / dpi);
      let pageHeight = jpegImage.height * (72 / dpi);
      if (i < origPageCount) {
        const origPage = originalPdf.getPage(i);
        pageWidth = origPage.getWidth();
        pageHeight = origPage.getHeight();
      }

      const page = newPdf.addPage([pageWidth, pageHeight]);
      page.drawImage(jpegImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });
    }

    onProgress(87, 'Guardando PDF...');
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    await fs.promises.writeFile(outputPath, pdfBytes);
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Structural-only pass: mutool clean + qpdf. Good for PDFs with
 * uncompressed or high-res images. Preserves text searchability.
 */
async function structuralCleanPdf(
  inputPath: string,
  outputPath: string,
  level: 'light' | 'medium' | 'high',
  mutoolPath: string,
  qpdfPath: string | null,
  preserveMetadata: boolean,
  onProgress: (pct: number, msg: string) => void
): Promise<void> {
  const dir = path.dirname(outputPath);
  const basename = path.basename(outputPath, path.extname(outputPath));
  const tempMutool = path.join(dir, `${basename}.mut_${Date.now()}.tmp`);

  try {
    onProgress(25, 'Optimizando estructura e imágenes...');

    const args: string[] = ['clean', '-gggg', '-z', '-i', '-c', '-s', '-Z'];
    if (preserveMetadata) args.push('-m');

    if (level === 'medium') {
      args.push(
        '--color-image-subsample-method=bicubic',
        '--color-image-subsample-dpi=150',
        '--color-image-recompress-method=jpeg:80'
      );
    } else if (level === 'high') {
      args.push(
        '--color-image-subsample-method=bicubic',
        '--color-image-subsample-dpi=96',
        '--color-image-recompress-method=jpeg:60'
      );
    }

    args.push(inputPath, tempMutool);
    await runProcess(mutoolPath, args);

    onProgress(70, 'Linealizando con qpdf...');

    if (qpdfPath && fs.existsSync(qpdfPath)) {
      try {
        await runProcess(qpdfPath, [
          '--linearize',
          '--object-streams=generate',
          '--recompress-flate',
          '--compression-level=9',
          tempMutool,
          outputPath,
        ]);
        await fs.promises.unlink(tempMutool).catch(() => {});
        return;
      } catch {
        // If qpdf fails, use mutool output directly
      }
    }

    await fs.promises.rename(tempMutool, outputPath);
  } catch (err) {
    await fs.promises.unlink(tempMutool).catch(() => {});
    throw err;
  }
}

export async function compressPdfFile(options: CompressionOptions): Promise<CompressionResult> {
  const {
    filePath,
    level,
    customTargetMB,
    outputFolder,
    overwriteOriginal,
    createBackup,
    preserveMetadata,
    onProgress,
  } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error(`El archivo no existe: ${filePath}`);
  }

  const stat = await fs.promises.stat(filePath);
  const originalSize = stat.size;

  onProgress(5, 'Analizando documento...');

  const dir = outputFolder && fs.existsSync(outputFolder) ? outputFolder : path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);

  let finalOutputPath = '';
  if (overwriteOriginal) {
    finalOutputPath = filePath;
  } else {
    let suffix = '_reducido';
    if (level === 'light') suffix = '_ligero';
    if (level === 'high') suffix = '_max';
    finalOutputPath = path.join(dir, `${basename}${suffix}${ext}`);
    let counter = 1;
    while (fs.existsSync(finalOutputPath) && finalOutputPath !== filePath) {
      finalOutputPath = path.join(dir, `${basename}${suffix}_${counter}${ext}`);
      counter++;
    }
  }

  const tempOutputPath = path.join(dir, `${basename}.tmp_${Date.now()}${ext}`);

  try {
    const mutoolPath = getMutoolPath();
    const qpdfPath = getQpdfPath();

    if (!mutoolPath) {
      throw new Error('No se encontró el motor de compresión (mutool.exe). Reinstala la aplicación.');
    }

    let usedMethod = 'structural';

    if (level === 'light') {
      // Light: structural only, preserve text search
      await structuralCleanPdf(filePath, tempOutputPath, 'light', mutoolPath, qpdfPath, preserveMetadata, onProgress);
    } else if (level === 'medium') {
      // Medium: try structural first; if < 20% reduction, use render at 150 DPI
      onProgress(10, 'Intentando optimización estructural...');
      const structTemp = path.join(dir, `${basename}.struct_${Date.now()}${ext}`);
      try {
        await structuralCleanPdf(filePath, structTemp, 'medium', mutoolPath, qpdfPath, preserveMetadata, onProgress);
        const structStat = await fs.promises.stat(structTemp);
        const structReduction = (originalSize - structStat.size) / originalSize;

        if (structReduction >= 0.20) {
          // Structural was good enough
          await fs.promises.rename(structTemp, tempOutputPath);
          usedMethod = 'structural';
        } else {
          // Fall back to render-and-repack at 150 DPI
          await fs.promises.unlink(structTemp).catch(() => {});
          onProgress(12, 'Poca reducción estructural, aplicando re-renderizado...');
          await renderAndRepackPdf(filePath, tempOutputPath, 150, mutoolPath, onProgress);
          usedMethod = 'render-150dpi';
        }
      } catch {
        await fs.promises.unlink(structTemp).catch(() => {});
        await renderAndRepackPdf(filePath, tempOutputPath, 150, mutoolPath, onProgress);
        usedMethod = 'render-150dpi';
      }
    } else if (level === 'high') {
      // High: always render at 96 DPI for maximum reduction
      await renderAndRepackPdf(filePath, tempOutputPath, 96, mutoolPath, onProgress);
      usedMethod = 'render-96dpi';
    } else if (level === 'custom') {
      // Custom: pick DPI based on target size ratio
      const targetBytes = customTargetMB * 1024 * 1024;
      const ratio = originalSize > 0 ? targetBytes / originalSize : 1;
      let dpi = 150;
      if (ratio < 0.08) dpi = 60;
      else if (ratio < 0.15) dpi = 72;
      else if (ratio < 0.25) dpi = 80;
      else if (ratio < 0.40) dpi = 96;
      else if (ratio < 0.60) dpi = 120;
      else if (ratio < 0.80) dpi = 150;
      else dpi = 180;

      onProgress(10, `Calculando parámetros para objetivo de ${customTargetMB} MB (${dpi} DPI)...`);
      await renderAndRepackPdf(filePath, tempOutputPath, dpi, mutoolPath, onProgress);
      usedMethod = `render-${dpi}dpi`;
    }

    onProgress(90, 'Verificando resultado...');
    const compStat = await fs.promises.stat(tempOutputPath);
    const finalSize = compStat.size;

    // If the "compressed" file is bigger than original (edge case), keep original structure
    if (finalSize >= originalSize && level !== 'custom') {
      await fs.promises.unlink(tempOutputPath).catch(() => {});
      return {
        success: false,
        originalSize,
        compressedSize: originalSize,
        savedBytes: 0,
        reductionPercentage: 0,
        error: 'El archivo ya está optimizado al máximo. No es posible reducirlo más sin pérdida significativa.',
      };
    }

    if (overwriteOriginal && createBackup) {
      await fs.promises.copyFile(filePath, `${filePath}.bak`);
    }

    if (overwriteOriginal) {
      await fs.promises.unlink(filePath).catch(() => {});
      await fs.promises.rename(tempOutputPath, filePath);
      finalOutputPath = filePath;
    } else {
      await fs.promises.rename(tempOutputPath, finalOutputPath);
    }

    const savedBytes = Math.max(0, originalSize - finalSize);
    const reductionPercentage = originalSize > 0
      ? Math.max(0, Math.round(((originalSize - finalSize) / originalSize) * 100))
      : 0;

    onProgress(100, '¡Compresión completada!');

    return {
      success: true,
      outputPath: finalOutputPath,
      originalSize,
      compressedSize: finalSize,
      savedBytes,
      reductionPercentage,
      method: usedMethod,
    };
  } catch (err: any) {
    await fs.promises.unlink(tempOutputPath).catch(() => {});
    return {
      success: false,
      originalSize,
      compressedSize: originalSize,
      savedBytes: 0,
      reductionPercentage: 0,
      error: err.message || 'Error desconocido al procesar el PDF',
    };
  }
}

function runProcess(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0 || code === 3) resolve();
      else reject(new Error(`Error en motor de compresión (código ${code}): ${stderr.slice(0, 300)}`));
    });

    proc.on('error', (err) => reject(err));
  });
}
