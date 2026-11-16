const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const zlib = require('zlib');

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function createPngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Generate a high-resolution PNG image with complex patterns
function generateHighResPng(width = 1600, height = 1200, seed = 1) {
  const rowSize = 1 + width * 3; // RGB
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3;
      const angle = Math.atan2(y - height / 2, x - width / 2);
      const dist = Math.sqrt((x - width / 2) ** 2 + (y - height / 2) ** 2);

      // Generate colorful texture and noise
      const r = Math.floor(Math.sin(x * 0.02 + seed) * 127 + 128) ^ (x % 37);
      const g = Math.floor(Math.cos(y * 0.02 + seed) * 127 + 128) ^ (y % 43);
      const b = Math.floor(Math.sin(dist * 0.05 + angle) * 127 + 128) ^ ((x + y) % 29);

      rawData[px] = (r + seed * 20) % 256;
      rawData[px + 1] = (g + seed * 30) % 256;
      rawData[px + 2] = (b + seed * 40) % 256;
    }
  }

  // Compress with fast level to keep uncompressed density high
  const compressed = zlib.deflateSync(rawData, { level: 1 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = createPngChunk('IHDR', ihdrData);
  const idat = createPngChunk('IDAT', compressed);
  const iend = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

async function createHeavyPdf() {
  console.log('Generando documento PDF pesado de prueba...');
  const pdfDoc = await PDFDocument.create();

  pdfDoc.setTitle('Reporte Gráfico de Alta Densidad - Documento Pesado de Prueba');
  pdfDoc.setAuthor('PDF Compressor Pro Test Lab');
  pdfDoc.setSubject('Prueba de Rendimiento y Compresión');
  pdfDoc.setProducer('Adobe PDF Library 2026 Compatible');

  // Create 12 pages with high-res images and extensive text
  const totalPages = 10;
  for (let i = 1; i <= totalPages; i++) {
    console.log(`- Creando e incrustando imagen de alta resolución para página ${i} de ${totalPages}...`);
    const pngBytes = generateHighResPng(1600, 1100, i);
    const embeddedImage = await pdfDoc.embedPng(pngBytes);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Header
    page.drawText(`PDF COMPRESSOR PRO — INFORME DE PRUEBA #${i}`, {
      x: 40,
      y: height - 50,
      size: 14,
      color: rgb(0.1, 0.3, 0.8),
    });

    page.drawText(`Página ${i} de ${totalPages} • Documento con imágenes sin comprimir`, {
      x: 40,
      y: height - 70,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Image
    const imgWidth = width - 80;
    const imgHeight = (imgWidth / 1600) * 1100;
    page.drawImage(embeddedImage, {
      x: 40,
      y: height - 90 - imgHeight,
      width: imgWidth,
      height: imgHeight,
    });

    // Body text
    for (let j = 0; j < 12; j++) {
      page.drawText(
        `Sección ${i}.${j + 1}: Este es un bloque de contenido enriquecido generado para validar la reducción profunda de flujos, imágenes a 150 DPI / 96 DPI y optimización de objetos.`,
        {
          x: 40,
          y: height - 110 - imgHeight - j * 16,
          size: 9,
          color: rgb(0.2, 0.2, 0.2),
        }
      );
    }
  }

  console.log('Guardando archivo PDF...');
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });

  // Save to PDFR project folder
  const outputPath = path.join(__dirname, '..', 'Documento_Pesado_Prueba.pdf');
  fs.writeFileSync(outputPath, pdfBytes);

  // Also save a copy on Desktop for easy drag & drop
  const desktopPath = path.join('C:', 'Users', 'Usuario', 'Desktop', 'Documento_Pesado_Prueba.pdf');
  try {
    fs.writeFileSync(desktopPath, pdfBytes);
  } catch (e) {}

  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n¡PDF pesado creado con éxito!`);
  console.log(`Ruta local: ${outputPath}`);
  console.log(`Ruta en Escritorio: ${desktopPath}`);
  console.log(`Tamaño total generado: ${sizeMB} MB (${stats.size} bytes)`);
}

createHeavyPdf().catch((err) => {
  console.error('Error al generar PDF pesado:', err);
  process.exit(1);
});
