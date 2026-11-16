!define PRODUCT_NAME "PDF Compressor Pro"
!define PRODUCT_VERSION "1.1.0"
!define PRODUCT_PUBLISHER "PDF Compressor Pro Team"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\PDF Compressor Pro.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

SetCompressor /SOLID lzma
Unicode true
RequestExecutionLevel admin

; MUI 1.67 compatible ------
!include "MUI2.nsh"

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "..\build\icon.ico"
!define MUI_UNICON "..\build\icon.ico"

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Instfiles page
!insertmacro MUI_PAGE_INSTFILES
; Finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\PDF Compressor Pro.exe"
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_INSTFILES

; Language files
!insertmacro MUI_LANGUAGE "Spanish"

; MUI end ------

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\release\PDF Compressor Pro Setup 1.1.0.exe"
InstallDir "$PROGRAMFILES64\PDF Compressor Pro"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Section "Principal" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite try
  File /r "..\release\win-unpacked\*.*"

  CreateDirectory "$SMPROGRAMS\PDF Compressor Pro"
  CreateShortcut "$SMPROGRAMS\PDF Compressor Pro\PDF Compressor Pro.lnk" "$INSTDIR\PDF Compressor Pro.exe"
  CreateShortcut "$DESKTOP\PDF Compressor Pro.lnk" "$INSTDIR\PDF Compressor Pro.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\PDF Compressor Pro.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\PDF Compressor Pro.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) fue desinstalado exitosamente de su equipo."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "¿Está seguro de que desea desinstalar $(^Name)?" IDYES +2
  Abort
FunctionEnd

Section Uninstall
  Delete "$DESKTOP\PDF Compressor Pro.lnk"
  Delete "$SMPROGRAMS\PDF Compressor Pro\PDF Compressor Pro.lnk"
  RMDir "$SMPROGRAMS\PDF Compressor Pro"

  RMDir /r "$INSTDIR"

  DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd

