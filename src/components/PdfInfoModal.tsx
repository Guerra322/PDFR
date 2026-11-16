import React from 'react';
import { PdfFileItem } from '../types';
import { formatBytes } from '../utils/format';
import { FileText, X, Layers, Calendar, User, FileCode, Tag } from 'lucide-react';

interface PdfInfoModalProps {
  item: PdfFileItem | null;
  onClose: () => void;
}

export const PdfInfoModal: React.FC<PdfInfoModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const meta = item.metadata;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Información del Documento
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{item.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Main quick specs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Páginas</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {meta?.pageCount || 1}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Formato</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block max-w-[120px]">
                  {meta?.pageSize || 'A4 estándar'}
                </span>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Tamaño actual
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatBytes(item.compressedSize || item.originalSize)}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Autor
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                {meta?.author || 'No especificado'}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Título
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                {meta?.title || item.name}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Fecha creación
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {meta?.creationDate || 'No disponible'}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-400" /> Creador / Software
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                {meta?.creator || meta?.producer || 'Desconocido'}
              </span>
            </div>
          </div>

          {/* Full path */}
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Ruta en disco
            </span>
            <p className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all select-all">
              {item.path}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
