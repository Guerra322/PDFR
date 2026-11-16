# PDF Compressor Pro 📄🚀

**PDF Compressor Pro** es una aplicación de escritorio profesional para **Windows 10 y Windows 11**, diseñada con una interfaz moderna y fluida inspirada en el lenguaje de diseño **Fluent Design** de Microsoft y herramientas profesionales como Adobe Acrobat y PDFGear.

Permite reducir drásticamente el peso de tus archivos PDF para enviarlos por correo, subirlos a plataformas con restricciones de tamaño o archivarlos en disco, manteniendo una óptima calidad visual y funcionando **100% offline** (sin conexión a internet, sin suscripciones ni APIs de terceros).

---

## 🌟 Características Principales

### 🎨 Interfaz de Usuario Moderna (Windows 11 Fluent)
- **Modo Claro y Oscuro**: selector rápido y sincronización automática con el tema del sistema.
- **Drag & Drop Integrado**: arrastra y suelta documentos individuales o grupos completos de PDFs.
- **Botones de Exploración**: selección mediante cuadro de diálogo nativo de Windows (archivos o carpetas).
- **Barra de Progreso en Tiempo Real**: visualización interactiva del avance por cada archivo.
- **Comparativa Visual Inmediata**:
  ```text
  Original: 25.40 MB  ➜  Final: 4.72 MB  |  Ahorro: 20.68 MB (-81%)
  ```
- **Inspector de Metadatos PDF**: visualiza páginas, autor, software creador, fecha de creación y dimensiones exactas en mm (A4, Carta, etc.).
- **Barra de título Fluent personalizada**: con botones nativos de Minimizar, Maximizar/Restaurar y Cerrar.

---

### ⚙️ Métodos y Niveles de Compresión

1. **Compresión Ligera**
   - Calidad gráfica intacta.
   - Reorganización y optimización de la tabla de referencias cruzadas.
   - Eliminación de metadatos redundantes y compactación de flujos de objetos.

2. **Compresión Media (Recomendada)**
   - El equilibrio ideal entre peso y fidelidad visual.
   - Optimización de fuentes y streams internos con algoritmo Flate nivel 9.
   - Re-compresión de objetos y eliminación de flujos huérfanos.

3. **Compresión Alta**
   - Máxima reducción posible de almacenamiento.
   - Generación de flujos de objetos lineales (*Linearized PDF / Fast Web View*).
   - Eliminación exhaustiva de miniaturas, anotaciones redundantes y datos duplicados.

4. **Tamaño Personalizado**
   - Permite indicar un tamaño objetivo en Megabytes (ej. `5.0 MB`).
   - El motor ajusta de manera adaptativa los algoritmos para aproximarse al peso deseado.

---

### 📦 Procesamiento Masivo por Lotes
- Cola de procesamiento asíncrona no bloqueante.
- Hilos de procesamiento concurrentes configurables (1 a 8 hilos) para exprimir procesadores multi-núcleo.
- Soporta sin problemas documentos complejos y PDFs de más de **500 MB**.

---

### 🛡️ Privacidad, Opciones Avanzadas y Extras
- **100% Offline**: Ningún dato sale de tu ordenador.
- **Selección de Carpeta de Salida**: Guarda en una carpeta centralizada o en el mismo directorio de origen.
- **Compresión Automática**: Inicia la compresión de forma instantánea al soltar archivos.
- **Control de Metadatos y Marcadores**: Decide si deseas conservar los marcadores (*bookmarks*) y datos del autor.
- **Seguridad en Sobrescritura**: Opción de reemplazar el archivo original con creación automática de copia de seguridad (`.bak`).
- **Historial Persistente**: Registro de compresiones pasadas con accesos directos para abrir el PDF o ubicarlo en el Explorador de Windows.
- **Panel de Estadísticas**: Contador total de documentos optimizados, espacio acumulado recuperado y gráfica de balance.
- **Notificaciones Nativas de Windows**: Te avisa cuando la compresión de tus documentos finaliza con éxito.

---

## 🛠️ Tecnologías Empleadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Segoe UI Variable font stack.
- **Desktop Runtime**: Electron 33+.
- **Motor de Compresión**: `pdf-lib` + `qpdf` nativo para Windows empaquetado en binario offline + `zlib/pako`.
- **Compilador / Empaquetador**: Vite 5, TypeScript Compiler y Electron Builder.

---

## 📂 Estructura del Proyecto

```text
PDFR/
├── build/                      # Recursos de compilación e icono (.ico / .png)
├── dist/                       # Build optimizado del frontend React
├── dist-electron/              # Código transpilado del proceso principal de Electron
├── electron/                   # Backend de la aplicación de escritorio
│   ├── main.ts                 # Ciclo de vida de la ventana y eventos IPC
│   ├── preload.ts              # API segura para el renderer (Context Isolation)
│   └── compressor.ts           # Motor de compresión y análisis PDF
├── resources/                  # Binarios y herramientas portables
│   └── bin/                    # qpdf.exe y librerías C++ portables
├── scripts/                    # Scripts de generación de iconos y pruebas
├── src/                        # Frontend React + TypeScript
│   ├── components/             # Componentes Fluent Design
│   │   ├── TitleBar.tsx        # Barra de ventana estilo Windows 11
│   │   ├── DropZone.tsx        # Zona interactiva Drag & Drop
│   │   ├── CompressionControls.tsx  # Tarjetas de selección de niveles
│   │   ├── FileItemCard.tsx    # Tarjeta de archivo y comparador visual
│   │   ├── PdfInfoModal.tsx    # Modal de metadatos del PDF
│   │   ├── HistoryView.tsx     # Vista de historial persistente
│   │   ├── StatsView.tsx       # Métricas y estadísticas de ahorro
│   │   └── SettingsView.tsx    # Panel de configuración completa
│   ├── types.ts                # Tipos de TypeScript compartidos
│   ├── utils/format.ts         # Funciones auxiliares de formateo
│   ├── App.tsx                 # Contenedor principal y enrutamiento
│   ├── index.css               # Estilos y efectos de acrílico/mica
│   └── main.tsx                # Entrada React
├── package.json                # Configuración de dependencias y scripts
├── tsconfig.json               # Configuración de TypeScript
└── vite.config.ts              # Configuración del bundler Vite
```

---

## 🚀 Instalación y Modo Desarrollo

### Requisitos previos
- Node.js (v18 o superior)
- npm

### 1. Clonar o acceder al proyecto
```bash
cd c:\Users\Usuario\Desktop\PDFR
```

### 2. Instalar dependencias
```powershell
npm.cmd install
```

### 3. Ejecutar en modo desarrollo
Inicia Vite y lanza la aplicación Electron con recarga en vivo:
```powershell
npm.cmd run electron:dev
```

---

## 📦 Compilación y Generación de Ejecutables (.exe)

Para generar los instaladores y ejecutables para Windows:

### 1. Compilación de producción
```powershell
npm.cmd run build
```

### 2. Generar el Instalador Windows (.exe) y versión Portable
```powershell
npm.cmd run dist
```
Esto generará en la carpeta `release/`:
1. **Instalador NSIS**: `PDF Compressor Pro Setup 1.0.0.exe` (con asistente de instalación de Windows, creación de accesos directos en el menú Inicio y Escritorio).
2. **Ejecutable Portable**: `PDF Compressor Pro 1.0.0.exe` (listo para llevar en una memoria USB y ejecutar sin instalar).
3. **Versión Desempaquetada**: `release/win-unpacked/` para ejecución inmediata sin empaquetar.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.
Desarrollado con altos estándares de rendimiento, estética Fluent y fiabilidad offline.
