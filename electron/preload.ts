import { contextBridge, ipcRenderer, webUtils } from 'electron';

export interface CompressionSettings {
  level: 'light' | 'medium' | 'high' | 'custom';
  customTargetMB: number;
  outputFolder: string | null;
  overwriteOriginal: boolean;
  createBackup: boolean;
  preserveMetadata: boolean;
  preserveBookmarks: boolean;
  autoCompressOnDrop: boolean;
  theme: 'system' | 'light' | 'dark';
  maxConcurrency: number;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file: File) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return (file as any).path || '';
    }
  },
  selectFiles: () => ipcRenderer.invoke('dialog:selectFiles'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  getPdfInfo: (filePath: string) => ipcRenderer.invoke('pdf:getInfo', filePath),
  compressPdf: (options: {
    id: string;
    filePath: string;
    settings: CompressionSettings;
  }) => ipcRenderer.invoke('pdf:compress', options),
  onCompressProgress: (callback: (data: { id: string; progress: number; message: string }) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('pdf:progress', subscription);
    return () => {
      ipcRenderer.removeListener('pdf:progress', subscription);
    };
  },
  openPath: (filePath: string) => ipcRenderer.invoke('shell:openPath', filePath),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  selectSingleFile: () => ipcRenderer.invoke('dialog:selectSingleFile'),
  splitPdf: (options: {
    filePath: string;
    pages: number[];
    outputFolder: string | null;
    outputFileName: string;
  }) => ipcRenderer.invoke('pdf:split', options),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  onUpdateStatus: (callback: (data: any) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('updater:status', subscription);
    return () => {
      ipcRenderer.removeListener('updater:status', subscription);
    };
  },
});
