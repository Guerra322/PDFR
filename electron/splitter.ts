import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

export interface SplitOptions {
  filePath: string;
  pages: number[];          // 0-indexed page numbers to include
  outputFolder: string | null;
  outputFileName: string;
}

export interface SplitResult {
  success: boolean;
  outputPath?: string;
  pageCount?: number;
  fileSize?: number;
  error?: string;
}

export interface PageThumbnailResult {
  success: boolean;
  base64?: string;
  error?: string;
}

export async function splitPdfPages(options: SplitOptions): Promise<SplitResult> {
  const { filePath, pages, outputFolder, outputFileName } = options;

  if (!fs.existsSync(filePath)) {
    return { success: false, error: `El archivo no existe: ${filePath}` };
  }
  if (!pages || pages.length === 0) {
    return { success: false, error: 'No se seleccionaron páginas para extraer.' };
  }

  try {
    const fileBytes = await fs.promises.readFile(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();

    // Validate page indices
    const validPages = pages.filter(p => p >= 0 && p < totalPages);
    if (validPages.length === 0) {
      return { success: false, error: 'Ninguna de las páginas seleccionadas es válida.' };
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, validPages);
    copiedPages.forEach((page: any) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save({ useObjectStreams: true });

    const dir = outputFolder && fs.existsSync(outputFolder)
      ? outputFolder
      : path.dirname(filePath);

    // Build safe filename
    const safeName = outputFileName.endsWith('.pdf')
      ? outputFileName
      : `${outputFileName}.pdf`;

    let outPath = path.join(dir, safeName);
    let counter = 1;
    while (fs.existsSync(outPath)) {
      const base = safeName.replace(/\.pdf$/i, '');
      outPath = path.join(dir, `${base}_${counter}.pdf`);
      counter++;
    }

    await fs.promises.writeFile(outPath, pdfBytes);

    return {
      success: true,
      outputPath: outPath,
      pageCount: validPages.length,
      fileSize: pdfBytes.length,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al dividir el PDF.' };
  }
}
