import React, { useState, useEffect } from 'react';
import { CompressionSettings, UpdateStatusData } from '../types';
import {
  FolderOpen,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  Cpu,
  Bookmark,
  FileCode,
  FileCheck,
  AlertTriangle,
  Zap,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  settings: CompressionSettings;
  onSettingsChange: (newSettings: Partial<CompressionSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsChange,
  onResetSettings,
}) => {
  const [appVersion, setAppVersion] = useState<string>('1.1.0');
  const [updateInfo, setUpdateInfo] = useState<UpdateStatusData>({ status: 'idle' });
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then((v) => {
        if (v) setAppVersion(v);
      });
    }

    if (window.electronAPI?.onUpdateStatus) {
      const unsubscribe = window.electronAPI.onUpdateStatus((data) => {
        setUpdateInfo(data);
        if (data.status !== 'checking') {
          setIsChecking(false);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleCheckUpdates = async () => {
    if (!window.electronAPI?.checkForUpdates) return;
    setIsChecking(true);
    setUpdateInfo({ status: 'checking' });
    try {
      const res = await window.electronAPI.checkForUpdates();
      if (res?.status === 'dev-mode') {
        setUpdateInfo({
          status: 'dev-mode',
          message: res.message || 'Actualizaciones deshabilitadas en modo desarrollo.',
        });
        setIsChecking(false);
      }
    } catch (err: any) {
      setUpdateInfo({
        status: 'error',
        message: err?.message || 'No se pudo conectar al servidor de actualizaciones.',
      });
      setIsChecking(false);
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        onSettingsChange({ outputFolder: folder });
      }
    }
  };

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Configuración de la aplicación
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personaliza el comportamiento del motor de compresión y las preferencias de usuario.
          </p>
        </div>

        <button
          onClick={onResetSettings}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer por defecto
        </button>
      </div>

      <div className="space-y-4">
        {/* Output folder settings */}
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Carpeta de salida predeterminada
              </h4>
              <p className="text-xs text-slate-400">
                Lugar donde se guardarán los archivos PDF optimizados. Si se deja vacío, se guardarán en la misma carpeta del archivo original.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono truncate">
              {settings.outputFolder || 'Misma carpeta del archivo original (por defecto)'}
            </div>
            <button
              onClick={handleSelectFolder}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Examinar
            </button>
            {settings.outputFolder && (
              <button
                onClick={() => onSettingsChange({ outputFolder: null })}
                className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Compression Behaviors */}
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
          {/* Auto compress on drop */}
          <div className="py-3 first:pt-0 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">
                  Compresión automática al arrastrar archivos
                </span>
                <span className="text-[11px] text-slate-400">
                  Inicia automáticamente el proceso tan pronto como se sueltan los archivos en la ventana.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoCompressOnDrop}
                onChange={(e) => onSettingsChange({ autoCompressOnDrop: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Preserve Metadata */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">
                  Conservar metadatos del documento
                </span>
                <span className="text-[11px] text-slate-400">
                  Mantiene el autor, título y fecha de creación. Desactivarlo reduce unos kilobytes adicionales.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preserveMetadata}
                onChange={(e) => onSettingsChange({ preserveMetadata: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Preserve Bookmarks */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mt-0.5">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">
                  Conservar marcadores e índice (Bookmarks)
                </span>
                <span className="text-[11px] text-slate-400">
                  Recomendado para libros, manuales y tesis con tabla de contenidos interactiva.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preserveBookmarks}
                onChange={(e) => onSettingsChange({ preserveBookmarks: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Overwrite Original */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">
                  Sobrescribir archivo original
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Atención: el archivo fuente será reemplazado permanentemente con la versión comprimida.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.overwriteOriginal}
                onChange={(e) => onSettingsChange({ overwriteOriginal: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Create Backup */}
          {settings.overwriteOriginal && (
            <div className="py-3 flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3 pl-4 border-l-2 border-blue-500">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 mt-0.5">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">
                    Crear copia de seguridad (.bak)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Crea un archivo de respaldo con extensión .bak antes de sobrescribir el original.
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.createBackup}
                  onChange={(e) => onSettingsChange({ createBackup: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}
        </div>

        {/* Theme and Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Appearance */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Apariencia del tema
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onSettingsChange({ theme: 'light' })}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  settings.theme === 'light'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                Claro
              </button>
              <button
                onClick={() => onSettingsChange({ theme: 'dark' })}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  settings.theme === 'dark'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                Oscuro
              </button>
              <button
                onClick={() => onSettingsChange({ theme: 'system' })}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  settings.theme === 'system'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Laptop className="w-4 h-4" />
                Sistema
              </button>
            </div>
          </div>

          {/* Performance: Multi-core Concurrency */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-500" />
                Procesamiento paralelo
              </h4>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                {settings.maxConcurrency} hilos concurrentes
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Aprovecha múltiples núcleos del CPU para procesar varios archivos simultáneamente.
            </p>
            <input
              type="range"
              min="1"
              max="8"
              value={settings.maxConcurrency}
              onChange={(e) => onSettingsChange({ maxConcurrency: parseInt(e.target.value) || 4 })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>1 (Menor consumo)</span>
              <span>4 (Equilibrado)</span>
              <span>8 (Máx velocidad)</span>
            </div>
          </div>

          {/* Sistema de Actualizaciones Automáticas vía GitHub */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Actualizaciones y Versión
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Versión actual: <span className="font-semibold text-slate-700 dark:text-slate-200">v{appVersion}</span>
                </p>
              </div>

              <button
                onClick={handleCheckUpdates}
                disabled={isChecking || updateInfo.status === 'downloading'}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Buscando...' : 'Buscar actualizaciones'}
              </button>
            </div>

            {/* Estado de la actualización */}
            {updateInfo.status === 'checking' && (
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Consultando nuevas versiones en GitHub Releases...</span>
              </div>
            )}

            {updateInfo.status === 'available' && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
                <Download className="w-4 h-4 shrink-0" />
                <span>Nueva versión {updateInfo.version || ''} encontrada. Descargando automáticamente...</span>
              </div>
            )}

            {updateInfo.status === 'downloading' && (
              <div className="space-y-2 bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
                <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 animate-bounce" />
                    Descargando actualización...
                  </span>
                  <span>{updateInfo.percent ?? 0}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${updateInfo.percent ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            {updateInfo.status === 'downloaded' && (
              <div className="flex items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Versión {updateInfo.version} descargada y lista para instalar!</span>
                </div>
                <button
                  onClick={handleInstallUpdate}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shrink-0 shadow-xs"
                >
                  Reiniciar e instalar
                </button>
              </div>
            )}

            {updateInfo.status === 'not-available' && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tienes instalada la versión más reciente (v{appVersion}).</span>
              </div>
            )}

            {updateInfo.status === 'error' && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {updateInfo.message?.includes('No published versions on GitHub')
                    ? 'Aún no has publicado ningún Release en GitHub. Sube tu primer Release para activar las actualizaciones.'
                    : updateInfo.message || 'Error al buscar actualizaciones.'}
                </span>
              </div>
            )}

            {updateInfo.status === 'dev-mode' && (
              <div className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800/40 p-2.5 rounded-xl">
                Modo desarrollo activo: las actualizaciones automáticas se activan en las versiones compiladas e instaladas por el cliente.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
