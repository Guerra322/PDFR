/**
 * Extracts app.asar, replaces dist-electron and dist files with
 * the freshly compiled ones, then repacks to app.asar
 */
const asar = require('@electron/asar');
const fs = require('fs');
const path = require('path');

const asarPath = path.join(__dirname, '..', 'release', 'win-unpacked', 'resources', 'app.asar');
const extractDir = path.join(__dirname, '..', 'release', 'win-unpacked', 'resources', 'app.asar.extracted');
const srcDistElectron = path.join(__dirname, '..', 'dist-electron');
const srcDist = path.join(__dirname, '..', 'dist');

async function main() {
  console.log('[1/4] Extracting app.asar...');
  if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
  asar.extractAll(asarPath, extractDir);

  console.log('[2/4] Updating dist-electron files...');
  const destElectron = path.join(extractDir, 'dist-electron');
  fs.mkdirSync(destElectron, { recursive: true });
  for (const f of fs.readdirSync(srcDistElectron)) {
    fs.copyFileSync(path.join(srcDistElectron, f), path.join(destElectron, f));
    console.log('  copied:', f);
  }

  console.log('[3/4] Updating dist (React build)...');
  const destDist = path.join(extractDir, 'dist');
  fs.mkdirSync(destDist, { recursive: true });
  for (const f of fs.readdirSync(srcDist)) {
    const src = path.join(srcDist, f);
    const dst = path.join(destDist, f);
    if (fs.statSync(src).isDirectory()) {
      if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
      for (const sub of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, sub), path.join(dst, sub));
      }
    } else {
      fs.copyFileSync(src, dst);
    }
    console.log('  copied:', f);
  }

  console.log('[4/4] Repacking app.asar...');
  // Backup original
  fs.copyFileSync(asarPath, asarPath + '.bak');
  await asar.createPackage(extractDir, asarPath);

  // Cleanup
  fs.rmSync(extractDir, { recursive: true });
  console.log('Done! app.asar updated successfully.');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
