import React from 'react';
import { CompressionLevel, CompressionSettings } from '../types';
import { ShieldCheck, Zap, Flame, Sliders, Play, Trash2, FolderOpen, Loader2 } from 'lucide-react';

interface CompressionControlsProps {
  settings: CompressionSettings;
  onSettingsChange: (newSettings: Partial<CompressionSettings>) => void;
  fileCount: number;
  isProcessing: boolean;
  onStartCompression: () => void;
  onClearFiles: () => void;
  onChangeOutputFolder: () => void;
}

export const CompressionControls: React.FC<CompressionControlsProps> = ({
  settings,
  onSettingsChange,
  fileCount,
  isProcessing,
  onStartCompression,
  onClearFiles,
  onChangeOutputFolder,
}) => {
  const levels: {
    id: CompressionLevel;
    title: string;
    badge?: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'light',
      title: 'Ligera',
      description: 'Calidad intacta. Limpia metadatos y optimiza estructura interna.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      color: 'hover:border-emerald-500/60 dark:hover:border-emerald-500/60',
    },
    {
      id: 'medium',
      title: 'Media',
      badge: 'Recomendada',
      description: 'Equilibrio perfecto. Imágenes a 150 DPI y fuentes optimizadas.',
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      color: 'hover:border-blue-500/60 dark:hover:border-blue-500/60',
    },
    {
      id: 'high',
      title: 'Alta',
      description: 'Máximo ahorro. Imágenes a 96 DPI y JPEG re-comprimido.',
      icon: <Flame className="w-5 h-5 text-amber-500" />,
      color: 'hover:border-amber-500/60 dark:hover:border-amber-500/60',
    },
    {
      id: 'custom',
      title: 'Personalizado',
      description: 'Indica un tamaño objetivo deseado para cada documento.',
      icon: <Sliders className="w-5 h-5 text-purple-500" />,
      color: 'hover:border-purple-500/60 dark:hover:border-purple-500/60',
    },
  ];

  return (
    <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header and Level selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Nivel de compresión
          </h4>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {fileCount} {fileCount === 1 ? 'archivo listo' : 'archivos listos'}
          </span>
        </div>

        {/* Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {levels.map((lvl) => {
            const isSelected = settings.level === lvl.id;
            return (
              <div
                key={lvl.id}
                onClick={() => onSettingsChange({ level: lvl.id })}
                className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between select-none ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white/50 dark:bg-slate-800/40 ' +
                      lvl.color
                }`}
              >
                {lvl.badge && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-sm">
                    {lvl.badge}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90">
                    {lvl.icon}
                  </div>
                  <h5 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {lvl.title}
                  </h5>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {lvl.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* If custom is selected: Target size input */}
      {settings.level === 'custom' && (
        <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div>
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-200 block">
              Tamaño objetivo por archivo:
            </span>
            <span className="text-[11px] text-purple-700/80 dark:text-purple-300/70">
              La aplicación calculará los algoritmos necesarios para aproximarse a este peso.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={settings.customTargetMB}
              onChange={(e) =>
                onSettingsChange({ customTargetMB: Math.max(0.1, parseFloat(e.target.value) || 1) })
              }
              className="w-24 px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-center text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-xs font-bold text-purple-900 dark:text-purple-200">MB</span>
          </div>
        </div>
      )}

      {/* Destination folder row & action buttons */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Output folder indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <FolderOpen className="w-4 h-4 text-amber-500" />
          <span>Destino:</span>
          <span
            className="font-medium text-slate-800 dark:text-slate-200 max-w-[260px] truncate"
            title={settings.outputFolder || 'Misma carpeta del archivo original'}
          >
            {settings.outputFolder || 'Misma carpeta de origen'}
          </span>
          <button
            onClick={onChangeOutputFolder}
            className="text-blue-600 dark:text-blue-400 hover:underline text-xs ml-1 font-medium"
          >
            Cambiar
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClearFiles}
            disabled={fileCount === 0 || isProcessing}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar lista
          </button>

          <button
            onClick={onStartCompression}
            disabled={fileCount === 0 || isProcessing}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Comprimiendo...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Comprimir {fileCount > 0 ? `(${fileCount})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
