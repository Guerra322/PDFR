import { app, BrowserWindow, ipcMain, dialog, shell, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { compressPdfFile, getPdfDetails } from './compressor';
import { splitPdfPages } from './splitter';

let mainWindow: BrowserWindow | null = null;

// Configuración de actualizaciones automáticas
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('updater:status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:status', {
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:status', { status: 'not-available' });
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:status', {
      status: 'error',
      message: err.message || 'Error en el actualizador',
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('updater:status', {
      status: 'downloading',
      percent: Math.round(progressObj.percent),
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('updater:status', {
      status: 'downloaded',
      version: info.version,
    });

    if (Notification.isSupported()) {
      new Notification({
        title: 'Actualización lista',
        body: `La versión ${info.version} se descargó y está lista para instalar.`,
      }).show();
    }
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    frame: false, // Windows 11 custom titlebar
    backgroundColor: '#1f242d',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // Fallback if dev server is not active
      const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        mainWindow?.loadFile(indexPath);
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  // Comprobar actualizaciones automáticamente al iniciar si la aplicación está empaquetada
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.log('[AutoUpdater] Error en búsqueda inicial:', err?.message);
      });
    }, 4000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window controls IPC
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() || false;
});

// Dialog IPC
ipcMain.handle('dialog:selectFiles', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar archivos PDF',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documentos PDF (*.pdf)', extensions: ['pdf'] },
      { name: 'Todos los archivos (*.*)', extensions: ['*'] },
    ],
  });

  if (result.canceled) return [];
  return result.filePaths;
});

ipcMain.handle('dialog:selectFolder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar carpeta de destino',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Shell IPC
ipcMain.handle('shell:openPath', async (_event, targetPath: string) => {
  await shell.openPath(targetPath);
});

ipcMain.handle('shell:showItemInFolder', async (_event, targetPath: string) => {
  shell.showItemInFolder(targetPath);
});

// PDF Info IPC
ipcMain.handle('pdf:getInfo', async (_event, filePath: string) => {
  try {
    return await getPdfDetails(filePath);
  } catch (err: any) {
    return {
      pageCount: 1,
      error: err.message,
    };
  }
});

// PDF Split IPC
ipcMain.handle('pdf:split', async (_event, options) => {
  try {
    return await splitPdfPages(options);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al dividir el PDF' };
  }
});

ipcMain.handle('dialog:selectSingleFile', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar archivo PDF',
    properties: ['openFile'],
    filters: [
      { name: 'Documentos PDF (*.pdf)', extensions: ['pdf'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// PDF Compress IPC
ipcMain.handle('pdf:compress', async (_event, { id, filePath, settings }) => {
  try {
    const result = await compressPdfFile({
      id,
      filePath,
      level: settings.level,
      customTargetMB: settings.customTargetMB,
      outputFolder: settings.outputFolder,
      overwriteOriginal: settings.overwriteOriginal,
      createBackup: settings.createBackup,
      preserveMetadata: settings.preserveMetadata,
      preserveBookmarks: settings.preserveBookmarks,
      onProgress: (progress, message) => {
        mainWindow?.webContents.send('pdf:progress', { id, progress, message });
      },
    });

    if (result.success && Notification.isSupported()) {
      new Notification({
        title: 'PDF Comprimido con Éxito',
        body: `${path.basename(filePath)} reducido un ${result.reductionPercentage}%`,
      }).show();
    }

    return result;
  } catch (err: any) {
    return {
      success: false,
      originalSize: 0,
      compressedSize: 0,
      savedBytes: 0,
      reductionPercentage: 0,
      error: err.message || 'Error desconocido al comprimir el PDF',
    };
  }
});

// Auto-Updater IPC
ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) {
    return {
      status: 'dev-mode',
      message: 'Las actualizaciones automáticas solo funcionan en la aplicación empaquetada e instalada.',
    };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'success', updateInfo: result?.updateInfo };
  } catch (err: any) {
    return { status: 'error', message: err?.message || 'Error al buscar actualizaciones.' };
  }
});

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});
