export type CompressionLevel = 'light' | 'medium' | 'high' | 'custom';

export type FileStatus = 'idle' | 'queued' | 'compressing' | 'completed' | 'error';

export interface PdfMetadataInfo {
  pageCount: number;
  fileSize?: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pageSize?: string;
}

export interface PdfFileItem {
  id: string;
  path: string;
  name: string;
  originalSize: number;
  compressedSize?: number;
  reductionPercentage?: number;
  savedBytes?: number;
  status: FileStatus;
  progress: number;
  outputPath?: string;
  error?: string;
  metadata?: PdfMetadataInfo;
  startedAt?: number;
  completedAt?: number;
}

export interface CompressionSettings {
  level: CompressionLevel;
  customTargetMB: number;
  outputFolder: string | null; // null means same folder as source
  overwriteOriginal: boolean;
  createBackup: boolean;
  preserveMetadata: boolean;
  preserveBookmarks: boolean;
  autoCompressOnDrop: boolean;
  theme: 'system' | 'light' | 'dark';
  maxConcurrency: number;
}

export interface CompressionHistoryItem {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  savedBytes: number;
  level: CompressionLevel;
  date: string;
  outputPath: string;
}

export interface GlobalStats {
  totalFiles: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalSavedBytes: number;
}

export type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error'
  | 'dev-mode';

export interface UpdateStatusData {
  status: UpdateState;
  version?: string;
  percent?: number;
  message?: string;
  bytesPerSecond?: number;
}

export interface ElectronAPI {
  getPathForFile: (file: File) => string;
  selectFiles: () => Promise<string[]>;
  selectFolder: () => Promise<string | null>;
  getPdfInfo: (filePath: string) => Promise<PdfMetadataInfo>;
  compressPdf: (options: {
    id: string;
    filePath: string;
    settings: CompressionSettings;
  }) => Promise<{
    success: boolean;
    outputPath?: string;
    originalSize: number;
    compressedSize: number;
    error?: string;
  }>;
  onCompressProgress: (callback: (data: {
    id: string;
    progress: number;
    message: string;
  }) => void) => () => void;
  openPath: (filePath: string) => Promise<void>;
  showItemInFolder: (filePath: string) => Promise<void>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  selectSingleFile: () => Promise<string | null>;
  splitPdf: (options: {
    filePath: string;
    pages: number[];
    outputFolder: string | null;
    outputFileName: string;
  }) => Promise<{
    success: boolean;
    outputPath?: string;
    pageCount?: number;
    fileSize?: number;
    error?: string;
  }>;
  checkForUpdates: () => Promise<{ status: string; message?: string }>;
  installUpdate: () => Promise<void>;
  getAppVersion: () => Promise<string>;
  onUpdateStatus: (callback: (data: UpdateStatusData) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
