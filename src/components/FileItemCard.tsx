import React from 'react';
import { PdfFileItem } from '../types';
import { formatBytes } from '../utils/format';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  FolderOpen,
  Info,
  X,
  TrendingDown,
} from 'lucide-react';

interface FileItemCardProps {
  item: PdfFileItem;
  onRemove: (id: string) => void;
  onShowInfo: (item: PdfFileItem) => void;
}

export const FileItemCard: React.FC<FileItemCardProps> = ({ item, onRemove, onShowInfo }) => {
  const handleOpenPdf = () => {
    const target = item.outputPath || item.path;
    if (window.electronAPI) {
      window.electronAPI.openPath(target);
    }
  };

  const handleShowInFolder = () => {
    const target = item.outputPath || item.path;
    if (window.electronAPI) {
      window.electronAPI.showItemInFolder(target);
    }
  };

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        {/* Left: PDF Icon & Names */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <h4
              className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-sm md:max-w-md lg:max-w-lg"
              title={item.name}
            >
              {item.name}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Original: <strong className="text-slate-700 dark:text-slate-300">{formatBytes(item.originalSize)}</strong></span>
              {item.metadata?.pageCount && (
                <>
                  <span>•</span>
                  <span>{item.metadata.pageCount} {item.metadata.pageCount === 1 ? 'página' : 'páginas'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status Badge & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {item.status === 'idle' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Listo
            </span>
          )}

          {item.status === 'compressing' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center gap-1.5 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              {item.progress}%
            </span>
          )}

          {item.status === 'completed' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Comprimido (-{item.reductionPercentage}%)
            </span>
          )}

          {item.status === 'error' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Error
            </span>
          )}

          {/* Quick buttons */}
          <button
            onClick={() => onShowInfo(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Ver detalles del PDF"
          >
            <Info className="w-4 h-4" />
          </button>

          {item.status !== 'compressing' && (
            <button
              onClick={() => onRemove(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Quitar de la lista"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (Visible while compressing) */}
      {item.status === 'compressing' && (
        <div className="mt-3">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, item.progress)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Optimizando páginas y reorganizando flujos... ({item.progress}%)
          </p>
        </div>
      )}

      {/* Completed Visual Comparison Box */}
      {item.status === 'completed' && item.compressedSize !== undefined && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Original</span>
              <span className="font-semibold">{formatBytes(item.originalSize)}</span>
            </div>
            <div className="text-slate-400">→</div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Final</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(item.compressedSize)}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-1 rounded-md font-bold">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Ahorro: {formatBytes(item.savedBytes || 0)} ({item.reductionPercentage}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenPdf}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
              title="Abrir archivo comprimido"
            >
              <ExternalLink className="w-3 h-3 text-blue-500" />
              Abrir PDF
            </button>
            <button
              onClick={handleShowInFolder}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
              title="Abrir carpeta contenedora"
            >
              <FolderOpen className="w-3 h-3 text-amber-500" />
              En carpeta
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {item.status === 'error' && (
        <div className="mt-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/40 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{item.error || 'Ocurrió un error al procesar este documento.'}</span>
        </div>
      )}
    </div>
  );
};
