const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create build directory
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

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

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([len, typeBuf, data, crc]);
}

function generateIconPng(size = 256) {
  const width = size;
  const height = size;

  // Raw pixel scanlines (1 filter byte per row + RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Distance from center for rounded icon
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Card boundary (squircle)
      const nx = Math.abs(x - center) / (size * 0.44);
      const ny = Math.abs(y - center) / (size * 0.44);
      const isInsideCard = Math.pow(nx, 4) + Math.pow(ny, 4) <= 1.0;

      if (isInsideCard) {
        // Gradient from vibrant Red/Crimson to Deep Blue/Indigo
        const t = (x + y) / (width * 2);
        
        // PDF emblem: document fold in top-right
        const isFold = (x > size * 0.65 && y < size * 0.35 && (x - size * 0.65) > (size * 0.35 - y));

        // Draw central "P" / PDF compression badge
        const isInnerFold = (x > size * 0.63 && y < size * 0.37 && (x - size * 0.63) < (size * 0.37 - y) && (x > size * 0.60 && y < size * 0.40));

        if (isFold) {
          // Transparent cut corner
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        } else if (isInnerFold) {
          // Fold flap shade
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 200;
          rawData[pxOffset + 2] = 200;
          rawData[pxOffset + 3] = 255;
        } else {
          // Card gradient
          const r = Math.round(220 * (1 - t) + 20 * t);
          const g = Math.round(38 * (1 - t) + 90 * t);
          const b = Math.round(38 * (1 - t) + 220 * t);

          // Center badge: down-arrow compression icon
          const cx = Math.abs(x - center);
          const cy = y - center;

          const isArrowStem = cx < size * 0.07 && cy >= -size * 0.18 && cy <= size * 0.12;
          const isArrowHead = cy >= size * 0.08 && cy <= size * 0.24 && cx <= (size * 0.24 - cy) * 1.3;

          if (isArrowStem || isArrowHead) {
            // White compression arrow
            rawData[pxOffset] = 255;
            rawData[pxOffset + 1] = 255;
            rawData[pxOffset + 2] = 255;
            rawData[pxOffset + 3] = 255;
          } else {
            rawData[pxOffset] = r;
            rawData[pxOffset + 1] = g;
            rawData[pxOffset + 2] = b;
            rawData[pxOffset + 3] = 255;
          }
        }
      } else {
        // Outside squircle: transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createIcoFromPng(pngBuffer) {
  // ICO Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = Icon
  header.writeUInt16LE(1, 4); // 1 Image

  // Directory Entry: 16 bytes
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0); // Width 256
  dirEntry.writeUInt8(0, 1); // Height 256
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of PNG data
  dirEntry.writeUInt32LE(6 + 16, 12); // Offset of PNG data

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

const pngData = generateIconPng(256);
fs.writeFileSync(path.join(buildDir, 'icon.png'), pngData);
console.log('Generated build/icon.png');

const icoData = createIcoFromPng(pngData);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoData);
console.log('Generated build/icon.ico');
