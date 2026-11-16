import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X, FileText } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = async () => {
    window.electronAPI?.maximizeWindow();
    const max = await window.electronAPI?.isMaximized();
    setIsMaximized(!!max);
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <div className="h-9 w-full bg-slate-100/90 dark:bg-[#181d24]/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between select-none titlebar-drag z-50">
      {/* Left: App Logo & Title */}
      <div className="flex items-center gap-2 pl-3">
        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white shadow-sm">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-200">
          PDF Compressor Pro
        </span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center h-full titlebar-nodrag">
        <button
          onClick={handleMinimize}
          className="h-full px-3.5 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-3.5 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-600 hover:text-white text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
