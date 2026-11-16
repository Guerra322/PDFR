const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const { compressPdfFile, getPdfDetails } = require('../dist-electron/compressor');

async function runTest() {
  console.log('--- Creando documento de prueba PDF ---');
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Documento de Prueba de Rendimiento');
  pdfDoc.setAuthor('Antigravity Test Suite');
  pdfDoc.setSubject('Prueba de Compresión');

  // Create 10 pages with various content
  for (let i = 1; i <= 10; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    page.drawText(`Página de prueba número ${i}`, {
      x: 50,
      y: 780,
      size: 24,
      color: rgb(0.1, 0.2, 0.8),
    });

    for (let j = 0; j < 30; j++) {
      page.drawText(`Línea de contenido representativo para prueba de compresión offline ${j}. PDF Compressor Pro para Windows 11.`, {
        x: 50,
        y: 720 - j * 20,
        size: 11,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  const testPdfPath = path.join(__dirname, 'test_sample.pdf');
  const bytes = await pdfDoc.save({ useObjectStreams: false });
  fs.writeFileSync(testPdfPath, bytes);

  const initialStat = fs.statSync(testPdfPath);
  console.log(`PDF de prueba creado: ${testPdfPath}`);
  console.log(`Tamaño original: ${initialStat.size} bytes`);

  // Test getPdfDetails
  console.log('\n--- Probando extracción de metadatos (getPdfDetails) ---');
  const info = await getPdfDetails(testPdfPath);
  console.log('Detalles extraídos:', info);

  // Test compressPdfFile
  console.log('\n--- Probando compresión Media ---');
  const result = await compressPdfFile({
    id: 'test_1',
    filePath: testPdfPath,
    level: 'medium',
    customTargetMB: 2,
    outputFolder: __dirname,
    overwriteOriginal: false,
    createBackup: false,
    preserveMetadata: false,
    preserveBookmarks: true,
    onProgress: (p, msg) => {
      console.log(`[Progreso ${p}%] ${msg}`);
    },
  });

  console.log('\nResultado de compresión:');
  console.log(result);

  if (result.success && fs.existsSync(result.outputPath)) {
    console.log(`Archivo comprimido verificado en: ${result.outputPath}`);
    console.log(`Reducción lograda: ${result.reductionPercentage}%`);
  } else {
    console.error('La compresión falló o no produjo archivo.');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Error durante la prueba:', err);
  process.exit(1);
});
