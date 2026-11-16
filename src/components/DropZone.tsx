import React, { useState } from 'react';
import { UploadCloud, FilePlus, FolderPlus, Sparkles } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (filePaths: string[]) => void;
  isCompact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isCompact = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        let filePath = '';
        if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
          filePath = window.electronAPI.getPathForFile(file);
        }
        if (!filePath) {
          filePath = (file as any).path || '';
        }

        if (filePath && filePath.toLowerCase().endsWith('.pdf')) {
          paths.push(filePath);
        }
      }
      if (paths.length > 0) {
        onFilesSelected(paths);
      }
    }
  };

  const handleSelectFiles = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectFiles();
      if (selected && selected.length > 0) {
        onFilesSelected(selected);
      }
    }
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        // Can pass folder or inform
      }
    }
  };

  if (isCompact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleSelectFiles}
        className={`w-full py-4 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-all flex items-center justify-between ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-blue-400 bg-white/40 dark:bg-slate-900/40'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Arrastra más archivos PDF aquí
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O haz clic para agregar a la lista
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectFiles();
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FilePlus className="w-3.5 h-3.5" />
            Agregar PDFs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full py-12 px-8 rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center ${
        isDragging
          ? 'border-blue-500 bg-blue-500/10 shadow-xl scale-[1.01]'
          : 'border-slate-300 dark:border-slate-700/70 hover:border-blue-400/80 bg-white/60 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/60 shadow-sm'
      }`}
    >
      {/* Icon with glow */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
          <UploadCloud className="w-10 h-10" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Arrastra tus archivos PDF aquí
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        Reduce el tamaño de tus documentos de forma rápida, segura y 100% offline. Soporta procesamiento masivo por lotes.
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleSelectFiles}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <FilePlus className="w-4 h-4" />
          Seleccionar archivos
        </button>

        <button
          onClick={handleSelectFiles}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm flex items-center gap-2 transition-all"
        >
          <FolderPlus className="w-4 h-4 text-amber-500" />
          Explorar carpeta
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        <span>Sin límites de páginas o archivos • Compatible con PDFs mayores a 500 MB</span>
      </div>
    </div>
  );
};
