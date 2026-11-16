import React from 'react';
import { GlobalStats } from '../types';
import { formatBytes } from '../utils/format';
import { HardDrive, TrendingDown, Files, Sparkles, PieChart, ShieldCheck } from 'lucide-react';

interface StatsViewProps {
  stats: GlobalStats;
}

export const StatsView: React.FC<StatsViewProps> = ({ stats }) => {
  const avgReduction =
    stats.totalOriginalBytes > 0
      ? Math.round(((stats.totalOriginalBytes - stats.totalCompressedBytes) / stats.totalOriginalBytes) * 100)
      : 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Estadísticas acumuladas de ahorro
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Métricas acumuladas desde la instalación de PDF Compressor Pro.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Espacio total ahorrado
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatBytes(stats.totalSavedBytes)}
            </span>
          </div>
        </div>

        {/* Card 2: PDFs processed */}
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-blue-500/20 dark:border-blue-500/30 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
            <Files className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
              PDFs procesados
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.totalFiles}
            </span>
          </div>
        </div>

        {/* Card 3: Average Reduction */}
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-purple-500/10 to-pink-500/10 border border-purple-500/20 dark:border-purple-500/30 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/30">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
              Reducción promedio
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {avgReduction}%
            </span>
          </div>
        </div>
      </div>

      {/* Comparison visual balance */}
      <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Balance de volumen de datos
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            {formatBytes(stats.totalCompressedBytes)} utilizados de {formatBytes(stats.totalOriginalBytes)}
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-500"
            style={{
              width: `${stats.totalOriginalBytes > 0 ? (stats.totalCompressedBytes / stats.totalOriginalBytes) * 100 : 0}%`,
            }}
            title="Espacio final ocupado"
          />
          <div
            className="bg-emerald-500/70 h-full transition-all duration-500"
            style={{
              width: `${avgReduction}%`,
            }}
            title="Espacio libre ahorrado"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span>Tamaño comprimido ({formatBytes(stats.totalCompressedBytes)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Espacio recuperado ({formatBytes(stats.totalSavedBytes)})</span>
          </div>
        </div>
      </div>

      {/* Privacy and Offline banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">
            100% Privado y Offline
          </strong>
          Tus archivos nunca salen de tu ordenador. Todo el cálculo de compresión y reestructuración se realiza en tu procesador local sin enviar datos a servidores externos.
        </div>
      </div>
    </div>
  );
};
