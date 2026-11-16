import React, { useState, useCallback } from 'react';
import {
  Scissors, FileUp, FolderOpen, ChevronRight,
  CheckSquare, ArrowRight, AlertCircle, CheckCircle2,
  Loader2, FileText,
} from 'lucide-react';

type SelectionMode = 'range' | 'manual';

export const SplitView: React.FC = () => {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [fileSize, setFileSize] = useState<number>(0);
  const [loadingFile, setLoadingFile] = useState(false);

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('range');
  const [rangeFrom, setRangeFrom] = useState<number>(1);
  const [rangeTo, setRangeTo] = useState<number>(1);
  const [manualPages, setManualPages] = useState<Set<number>>(new Set());

  const [outputFolder, setOutputFolder] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [resultPath, setResultPath] = useState<string>('');
  const [resultSize, setResultSize] = useState<number>(0);
  const [resultPageCount, setResultPageCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadFile = useCallback(async (fp: string) => {
    setLoadingFile(true);
    setStatus('idle');
    setManualPages(new Set());
    setResultPath('');
    try {
      const name = fp.split(/[/\\]/).pop() || fp;
      setFilePath(fp);
      setFileName(name);
      setOutputFileName(name.replace(/\.pdf$/i, '') + '_extraido');

      if (window.electronAPI) {
        const info = await window.electronAPI.getPdfInfo(fp);
        const pc = info.pageCount || 1;
        setPageCount(pc);
        setFileSize(info.fileSize || 0);
        setRangeFrom(1);
        setRangeTo(pc);
      }
    } catch {
      setErrorMsg('Error al leer el archivo PDF.');
      setStatus('error');
    } finally {
      setLoadingFile(false);
    }
  }, []);

  const handleSelectFile = async () => {
    if (!window.electronAPI) return;
    const fp = await (window.electronAPI as any).selectSingleFile();
    if (fp) loadFile(fp);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const pdf = files.find(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdf && window.electronAPI) {
      const fp = window.electronAPI.getPathForFile(pdf);
      if (fp) loadFile(fp);
    }
  };

  const togglePage = (p: number) => {
    setManualPages(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<number>();
    for (let i = 1; i <= pageCount; i++) all.add(i);
    setManualPages(all);
  };

  const deselectAll = () => setManualPages(new Set());

  const getSelectedPages = (): number[] => {
    if (selectionMode === 'range') {
      const from = Math.max(1, Math.min(rangeFrom, rangeTo));
      const to = Math.min(pageCount, Math.max(rangeFrom, rangeTo));
      const pages: number[] = [];
      for (let i = from; i <= to; i++) pages.push(i - 1);
      return pages;
    }
    return Array.from(manualPages).sort((a, b) => a - b).map(p => p - 1);
  };

  const selectedCount = selectionMode === 'range'
    ? Math.max(0, Math.min(pageCount, Math.max(rangeFrom, rangeTo)) - Math.max(1, Math.min(rangeFrom, rangeTo)) + 1)
    : manualPages.size;

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.selectFolder();
    if (folder) setOutputFolder(folder);
  };

  const handleSplit = async () => {
    if (!filePath || !window.electronAPI) return;
    const pages = getSelectedPages();
    if (pages.length === 0) {
      setStatus('error');
      setErrorMsg('No hay páginas seleccionadas.');
      return;
    }
    setStatus('processing');
    setErrorMsg('');
    try {
      const result = await (window.electronAPI as any).splitPdf({
        filePath,
        pages,
        outputFolder,
        outputFileName: outputFileName || 'documento_extraido',
      });
      if (result.success) {
        setStatus('success');
        setResultPath(result.outputPath || '');
        setResultSize(result.fileSize || 0);
        setResultPageCount(result.pageCount || pages.length);
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'Error al dividir el PDF.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Error inesperado.');
    }
  };

  const fmt = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const cols = pageCount <= 20 ? 5 : pageCount <= 50 ? 8 : 10;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Scissors className="w-5 h-5 text-violet-500" />
          Separar páginas de PDF
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Extrae páginas específicas de un PDF para crear un nuevo documento.
        </p>
      </div>

      {/* Drop Zone */}
      {!filePath ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectFile}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
            isDragging
              ? 'border-violet-400 bg-violet-50/60 dark:bg-violet-900/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-600 bg-slate-50/50 dark:bg-slate-800/30'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Scissors className="w-8 h-8 text-violet-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Arrastra un PDF aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-slate-400 mt-1">Solo archivos PDF</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleSelectFile(); }}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <FileUp className="w-3.5 h-3.5" />
            Seleccionar archivo
          </button>
        </div>
      ) : (
        <>
          {/* File Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{fileName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{pageCount} páginas · {fmt(fileSize)}</p>
            </div>
            <button
              onClick={() => { setFilePath(null); setStatus('idle'); }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cambiar
            </button>
          </div>

          {loadingFile ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
              <span className="text-sm text-slate-500">Leyendo documento...</span>
            </div>
          ) : (
            <>
              {/* Selection Mode */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Modo de selección</h3>
                  <div className="flex gap-2">
                    {(['range', 'manual'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setSelectionMode(mode)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                          selectionMode === mode
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-violet-300 dark:hover:border-violet-700'
                        }`}
                      >
                        {mode === 'range' ? 'Rango de páginas' : 'Selección manual'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Range Mode */}
                {selectionMode === 'range' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      El PDF tiene <strong>{pageCount}</strong> páginas. Selecciona el rango a extraer.
                    </p>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                          Desde la página
                        </label>
                        <input
                          type="number" min={1} max={pageCount} value={rangeFrom}
                          onChange={e => setRangeFrom(Math.max(1, Math.min(pageCount, Number(e.target.value))))}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div className="pb-2.5 shrink-0">
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                          Hasta la página
                        </label>
                        <input
                          type="number" min={1} max={pageCount} value={rangeTo}
                          onChange={e => setRangeTo(Math.max(1, Math.min(pageCount, Number(e.target.value))))}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                    {selectedCount > 0 && (
                      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-violet-500 shrink-0" />
                        <span className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                          Se extraerán <strong>{selectedCount}</strong> página{selectedCount !== 1 ? 's' : ''}{' '}
                          (de la {Math.min(rangeFrom, rangeTo)} a la {Math.min(pageCount, Math.max(rangeFrom, rangeTo))})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Grid */}
                {selectionMode === 'manual' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={selectAll} className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium transition-colors">
                        Seleccionar todo
                      </button>
                      <button onClick={deselectAll} className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors">
                        Deseleccionar todo
                      </button>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                        {manualPages.size} de {pageCount} seleccionadas
                      </span>
                    </div>
                    <div className="grid gap-2 max-h-72 overflow-y-auto pr-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                      {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => {
                        const sel = manualPages.has(p);
                        return (
                          <button
                            key={p}
                            onClick={() => togglePage(p)}
                            className={`aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-all select-none ${
                              sel
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-400 hover:border-violet-300 dark:hover:border-violet-700'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 opacity-50" />
                            <span className="text-[10px]">{p}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Output Options */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Archivo de salida</h3>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Nombre del archivo resultante</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text" value={outputFileName}
                      onChange={e => setOutputFileName(e.target.value)}
                      placeholder="nombre_del_archivo"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <span className="text-xs text-slate-400 font-mono shrink-0">.pdf</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Carpeta de destino</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400 truncate min-w-0">
                      {outputFolder || 'Misma carpeta que el archivo original'}
                    </div>
                    <button
                      onClick={handleSelectFolder}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      Elegir
                    </button>
                  </div>
                </div>
              </div>

              {/* Result */}
              {status === 'success' && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">¡Páginas extraídas correctamente!</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{resultPageCount} página{resultPageCount !== 1 ? 's' : ''} · {fmt(resultSize)}</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 truncate font-mono">{resultPath}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => window.electronAPI?.openPath(resultPath)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors">Abrir</button>
                    <button onClick={() => window.electronAPI?.showItemInFolder(resultPath)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-700 font-medium transition-colors">Mostrar</button>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">Error al extraer las páginas</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSplit}
                  disabled={status === 'processing' || selectedCount === 0}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${
                    status === 'processing' || selectedCount === 0
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-700 text-white active:scale-95'
                  }`}
                >
                  {status === 'processing' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Extrayendo páginas...</>
                  ) : (
                    <><Scissors className="w-4 h-4" />Extraer {selectedCount > 0 ? `${selectedCount} página${selectedCount !== 1 ? 's' : ''}` : 'páginas'}<ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
