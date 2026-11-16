import React from 'react';
import { CompressionHistoryItem } from '../types';
import { formatBytes, formatDate } from '../utils/format';
import { History, Trash2, ExternalLink, FolderOpen, FileText, CheckCircle2 } from 'lucide-react';

interface HistoryViewProps {
  history: CompressionHistoryItem[];
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onClearHistory }) => {
  const handleOpenPdf = (filePath: string) => {
    window.electronAPI?.openPath(filePath);
  };

  const handleShowInFolder = (filePath: string) => {
    window.electronAPI?.showItemInFolder(filePath);
  };

  if (history.length === 0) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
          <History className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
          Sin historial de compresiones
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Los archivos que comprimas aparecerán registrados aquí para que puedas abrirlos o consultar el espacio ahorrado.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Historial de compresiones recientes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {history.length} {history.length === 1 ? 'registro guardado' : 'registros guardados'}
          </p>
        </div>

        <button
          onClick={onClearHistory}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 text-slate-500 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Borrar historial
        </button>
      </div>

      <div className="space-y-2.5">
        {history.map((item) => (
          <div
            key={item.id}
            className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4
                  className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs md:max-w-md"
                  title={item.name}
                >
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{formatDate(item.date)}</span>
                  <span>•</span>
                  <span>Nivel: <strong className="capitalize">{item.level}</strong></span>
                </div>
              </div>
            </div>

            {/* Savings & Metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatBytes(item.compressedSize)}
                  <span className="text-[11px] text-slate-400 ml-1">
                    (de {formatBytes(item.originalSize)})
                  </span>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  -{item.reductionPercentage}% ({formatBytes(item.savedBytes)})
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                <button
                  onClick={() => handleOpenPdf(item.outputPath)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                  title="Abrir PDF"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShowInFolder(item.outputPath)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                  title="Mostrar en carpeta"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
