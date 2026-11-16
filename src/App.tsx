import React, { useState, useEffect, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { DropZone } from './components/DropZone';
import { CompressionControls } from './components/CompressionControls';
import { FileItemCard } from './components/FileItemCard';
import { PdfInfoModal } from './components/PdfInfoModal';
import { HistoryView } from './components/HistoryView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { SplitView } from './components/SplitView';
import {
  PdfFileItem,
  CompressionSettings,
  CompressionHistoryItem,
  GlobalStats,
} from './types';
import {
  Layers,
  History,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Laptop,
  Scissors,
  Sparkles,
  X,
} from 'lucide-react';

const DEFAULT_SETTINGS: CompressionSettings = {
  level: 'medium',
  customTargetMB: 5,
  outputFolder: null,
  overwriteOriginal: false,
  createBackup: true,
  preserveMetadata: true,
  preserveBookmarks: true,
  autoCompressOnDrop: false,
  theme: 'dark',
  maxConcurrency: 4,
};

const DEFAULT_STATS: GlobalStats = {
  totalFiles: 0,
  totalOriginalBytes: 0,
  totalCompressedBytes: 0,
  totalSavedBytes: 0,
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compress' | 'split' | 'history' | 'stats' | 'settings'>('compress');
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInfoItem, setSelectedInfoItem] = useState<PdfFileItem | null>(null);
  const [readyUpdateVersion, setReadyUpdateVersion] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<CompressionSettings>(() => {
    const saved = localStorage.getItem('pdf_compressor_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  // History
  const [history, setHistory] = useState<CompressionHistoryItem[]>(() => {
    const saved = localStorage.getItem('pdf_compressor_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Stats
  const [stats, setStats] = useState<GlobalStats>(() => {
    const saved = localStorage.getItem('pdf_compressor_stats');
    if (saved) {
      try {
        return { ...DEFAULT_STATS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_STATS;
  });

  // Save settings on update
  useEffect(() => {
    localStorage.setItem('pdf_compressor_settings', JSON.stringify(settings));
  }, [settings]);

  // Save history on update
  useEffect(() => {
    localStorage.setItem('pdf_compressor_history', JSON.stringify(history));
  }, [history]);

  // Save stats on update
  useEffect(() => {
    localStorage.setItem('pdf_compressor_stats', JSON.stringify(stats));
  }, [stats]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Listen for real-time progress events from Electron
  useEffect(() => {
    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onCompressProgress((data) => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === data.id) {
              return {
                ...f,
                progress: data.progress,
                status: 'compressing',
              };
            }
            return f;
          })
        );
      });
      return () => unsubscribe();
    }
  }, []);

  // Escuchar notificaciones de actualización lista
  useEffect(() => {
    if (window.electronAPI?.onUpdateStatus) {
      const unsub = window.electronAPI.onUpdateStatus((data) => {
        if (data.status === 'downloaded' && data.version) {
          setReadyUpdateVersion(data.version);
        }
      });
      return () => unsub();
    }
  }, []);

  // Add files
  const handleFilesAdded = async (filePaths: string[]) => {
    const newItems: PdfFileItem[] = [];

    for (const filePath of filePaths) {
      // Deduplicate
      if (files.some((f) => f.path === filePath)) continue;

      const name = filePath.split(/[/\\]/).pop() || filePath;
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const item: PdfFileItem = {
        id,
        path: filePath,
        name,
        originalSize: 0,
        status: 'idle',
        progress: 0,
      };

      // Get metadata & original size
      if (window.electronAPI) {
        try {
          const info = await window.electronAPI.getPdfInfo(filePath);
          item.metadata = info;
          if (info.fileSize) {
            item.originalSize = info.fileSize;
          }
        } catch (e) {}
      }

      newItems.push(item);
    }

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);

      // If auto-compress is on, trigger compression
      if (settings.autoCompressOnDrop) {
        setTimeout(() => {
          startBatchCompression([...files, ...newItems]);
        }, 100);
      }
    }
  };

  // Remove single file
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Clear all files
  const handleClearFiles = () => {
    setFiles([]);
  };

  // Change output folder
  const handleChangeOutputFolder = async () => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setSettings((prev) => ({ ...prev, outputFolder: folder }));
      }
    }
  };

  // Batch compression execution with concurrency queue
  const startBatchCompression = async (currentFiles: PdfFileItem[] = files) => {
    if (isProcessing) return;
    const pending = currentFiles.filter((f) => f.status !== 'completed');
    if (pending.length === 0) return;

    setIsProcessing(true);

    const concurrency = Math.max(1, Math.min(8, settings.maxConcurrency || 4));
    const queue = [...pending];
    let activeWorkers = 0;

    const processNext = async () => {
      if (queue.length === 0) return;
      const item = queue.shift()!;
      activeWorkers++;

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'compressing', progress: 5 } : f))
      );

      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.compressPdf({
            id: item.id,
            filePath: item.path,
            settings,
          });

          if (result.success) {
            const savedBytes = result.savedBytes;
            const reduction = result.reductionPercentage;

            setFiles((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? {
                      ...f,
                      status: 'completed',
                      progress: 100,
                      originalSize: result.originalSize,
                      compressedSize: result.compressedSize,
                      savedBytes,
                      reductionPercentage: reduction,
                      outputPath: result.outputPath,
                    }
                  : f
              )
            );

            // Record in history
            const historyItem: CompressionHistoryItem = {
              id: item.id,
              name: item.name,
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              reductionPercentage: reduction,
              savedBytes,
              level: settings.level,
              date: new Date().toISOString(),
              outputPath: result.outputPath || item.path,
            };

            setHistory((prev) => [historyItem, ...prev.slice(0, 99)]);

            // Record in stats
            setStats((prev) => ({
              totalFiles: prev.totalFiles + 1,
              totalOriginalBytes: prev.totalOriginalBytes + result.originalSize,
              totalCompressedBytes: prev.totalCompressedBytes + result.compressedSize,
              totalSavedBytes: prev.totalSavedBytes + savedBytes,
            }));
          } else {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? {
                      ...f,
                      status: 'error',
                      progress: 0,
                      error: result.error || 'Error al comprimir',
                    }
                  : f
              )
            );
          }
        }
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'error',
                  progress: 0,
                  error: err.message || 'Error inesperado',
                }
              : f
          )
        );
      } finally {
        activeWorkers--;
        if (queue.length > 0) {
          await processNext();
        }
      }
    };

    // Launch worker threads
    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency && i < pending.length; i++) {
      workers.push(processNext());
    }

    await Promise.all(workers);
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-[#191f28] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Fluent Windows Title Bar */}
      <TitleBar />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Windows 11 Fluent Sidebar / Navigation */}
        <aside className="w-56 shrink-0 bg-slate-50/70 dark:bg-[#141820]/80 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between p-3 select-none backdrop-blur-md">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Herramientas
            </div>

            <button
              onClick={() => setActiveTab('compress')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'compress'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Compresor PDF</span>
              {files.length > 0 && (
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'compress' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {files.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('split')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'split'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Separar PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial</span>
              {history.length > 0 && (
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {history.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Estadísticas</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </button>
          </div>

          {/* Quick theme footer */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-2">
            <span className="text-[11px] text-slate-400 font-medium">Tema</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'light' }))}
                className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition-colors ${
                  settings.theme === 'light' ? 'bg-white shadow-xs text-blue-600' : ''
                }`}
                title="Modo claro"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'dark' }))}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${
                  settings.theme === 'dark' ? 'bg-slate-800 text-blue-400' : ''
                }`}
                title="Modo oscuro"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'system' }))}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${
                  settings.theme === 'system' ? 'bg-slate-800 text-blue-400' : ''
                }`}
                title="Sistema"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'compress' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Dropzone */}
              {files.length === 0 ? (
                <DropZone onFilesSelected={handleFilesAdded} />
              ) : (
                <>
                  <DropZone onFilesSelected={handleFilesAdded} isCompact={true} />

                  {/* Level and Actions Controls */}
                  <CompressionControls
                    settings={settings}
                    onSettingsChange={(newS) => setSettings((s) => ({ ...s, ...newS }))}
                    fileCount={files.length}
                    isProcessing={isProcessing}
                    onStartCompression={() => startBatchCompression()}
                    onClearFiles={handleClearFiles}
                    onChangeOutputFolder={handleChangeOutputFolder}
                  />

                  {/* Files List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Archivos cargados ({files.length})
                      </h4>
                      <span className="text-xs text-slate-400">
                        {files.filter((f) => f.status === 'completed').length} de {files.length} completados
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {files.map((file) => (
                        <FileItemCard
                          key={file.id}
                          item={file}
                          onRemove={handleRemoveFile}
                          onShowInfo={setSelectedInfoItem}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'split' && (
            <div className="max-w-4xl mx-auto">
              <SplitView />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto">
              <HistoryView history={history} onClearHistory={() => setHistory([])} />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-4xl mx-auto">
              <StatsView stats={stats} />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSettingsChange={(newS) => setSettings((s) => ({ ...s, ...newS }))}
              onResetSettings={() => setSettings(DEFAULT_SETTINGS)}
            />
          )}
        </main>
      </div>

      {/* PDF Info Details Modal */}
      <PdfInfoModal item={selectedInfoItem} onClose={() => setSelectedInfoItem(null)} />

      {/* Notificación flotante de actualización lista */}
      {readyUpdateVersion && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl animate-fade-in border border-emerald-400/40">
          <Sparkles className="w-5 h-5 shrink-0 animate-spin" />
          <div className="text-xs">
            <p className="font-bold">¡Nueva versión {readyUpdateVersion} lista!</p>
            <p className="text-emerald-100 text-[11px]">Se descargó y está lista para instalar.</p>
          </div>
          <button
            onClick={() => window.electronAPI?.installUpdate()}
            className="ml-2 px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs"
          >
            Reiniciar ahora
          </button>
          <button
            onClick={() => setReadyUpdateVersion(null)}
            className="p-1 text-white/70 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
