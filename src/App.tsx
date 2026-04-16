import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ChevronRight,
  Download,
  Eye,
  Folder,
  FolderOpen,
  ImageUp,
  Moon,
  Pencil,
  Languages,
  Link2,
  LockKeyhole,
  LogOut,
  Plus,
  Search,
  Settings,
  Shield,
  Sun,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Project = {
  id: string
  name: string
  slug: string
}

type Asset = {
  id: string
  projectId: string
  projectName: string
  folder: string
  name: string
  size: number
  createdAt: string
  url: string
  relativeUrl?: string
}

type SystemStatus = {
  fileCount: number
  totalBytes: number
  health: 'online' | 'offline'
  version: string
  updateAvailable: boolean | null
  latestVersion: string | null
  updateStatus: 'available' | 'current' | 'none' | 'unknown'
}

type FolderGroup = {
  projectId: string
  folder: string
  count: number
}

type User = {
  id: string
  username: string
  createdAt: string
}

type ActivityItem = {
  id: string
  user: string
  action: string
  target: string
  details: string
  createdAt: string
}

type UploadType = 'images' | 'documents' | 'archives'
type ThemeMode = 'light' | 'dark' | 'system'

type UploadSettings = {
  folderMode: 'auto' | 'preserve' | 'prompt'
  autoFolderStrategy: 'strip-number' | 'remove-last-segment' | 'full-name'
  allowedFileTypes: UploadType[]
  maxFileSizeMB: number
}

type ThemeSettings = {
  mode: ThemeMode
  lightAccent: string
  darkAccent: string
}

type ViewMode = 'library' | 'settings'

type ConfirmState = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm?: (() => Promise<void>) | null
}

const defaultSystemStatus: SystemStatus = {
  fileCount: 0,
  totalBytes: 0,
  health: 'online',
  version: '0.1.0',
  updateAvailable: null,
  latestVersion: null,
  updateStatus: 'unknown',
}

const translations = {
  nl: {
    appName: 'Buckett',
    adminArea: 'Admin omgeving',
    loginTitle: 'Admin login',
    loginSubtitle: 'Alleen voor beheerders',
    loginHeading: 'Project bestandsbeheer',
    loginText: 'Log in om projecten, gebruikers en uploads centraal te beheren.',
    secure: 'Beveiligde admin-omgeving',
    navigation: 'Navigatie van projecten naar mappen en bestanden',
    uploadFast: 'Directe upload en snelle URL-kopie',
    username: 'Gebruikersnaam',
    password: 'Wachtwoord',
    signIn: 'Inloggen',
    signingIn: 'Bezig met inloggen...',
    projects: 'Projecten',
    folders: 'Mappen',
    files: 'Bestanden',
    settings: 'Instellingen',
    settingsSubtitle: 'Beheer hier projecten, gebruikers, taal en activiteit.',
    directUpload: 'Direct uploaden',
    uploadHint: 'Sleep bestanden of complete mappen hierheen, of kies ze handmatig. De upload start direct in het geselecteerde project.',
    chooseFiles: 'Bestanden kiezen',
    uploading: 'Uploaden...',
    selectProjectFirst: 'Kies eerst een project.',
    noProjects: 'Nog geen projecten',
    noFolders: 'Nog geen mappen in dit project.',
    noFiles: 'Geen bestanden in deze selectie.',
    exportCsv: 'CSV export',
    logout: 'Uitloggen',
    search: 'Zoeken',
    closeSearch: 'Zoeken sluiten',
    searchPlaceholder: 'Zoek in bestanden en mappen',
    fileManager: 'Bestandsbeheer',
    clickFolderHint: 'Klik op een map links om de inhoud te bekijken.',
    show: 'Toon',
    perPage: 'bestanden per pagina',
    previous: 'Vorige',
    next: 'Volgende',
    page: 'Pagina',
    of: 'van',
    signedInAs: 'Ingelogd als',
    language: 'Taal',
    languageHint: 'Standaard beschikbaar: Nederlands, Engels en Duits. De structuur is uitbreidbaar voor extra talen.',
    projectManagement: 'Projectbeheer',
    projectPlaceholder: 'Nieuwe projectnaam',
    addProject: 'Project toevoegen',
    userManagement: 'Gebruikersbeheer',
    addUser: 'Gebruiker toevoegen',
    userPasswordPlaceholder: 'Nieuw wachtwoord',
    changePasswordAction: 'Wachtwoord wijzigen',
    changePasswordTitle: 'Wachtwoord aanpassen',
    passwordUpdated: 'Wachtwoord bijgewerkt',
    passwordRequired: 'Een nieuw wachtwoord is verplicht',
    statusCardTitle: 'Status',
    uploadedFilesLabel: 'Upload bestanden',
    storageUsedLabel: 'Opslag gebruikt',
    systemStatusLabel: 'Systeemstatus',
    versionLabel: 'Versie',
    updateAvailableLabel: 'Update beschikbaar',
    statusOnline: 'Online',
    statusOffline: 'Offline',
    updateYes: 'Ja',
    updateNo: 'Nee',
    updateUnknown: 'Onbekend',
    updateNoRelease: 'Nog geen release',
    activityLog: 'Activiteitenlog',
    noActivity: 'Nog geen activiteit gelogd.',
    system: 'Systeem',
    library: 'Bibliotheek',
    themeSettings: 'Weergave en thema',
    themeMode: 'Themamodus',
    lightMode: 'Licht',
    darkMode: 'Donker',
    systemMode: 'Systeem',
    lightAccentColor: 'Accentkleur licht',
    darkAccentColor: 'Accentkleur donker',
    saveThemeSettings: 'Thema opslaan',
    themeSettingsSaved: 'Thema bijgewerkt',
    uploadSettings: 'Uploadinstellingen',
    uploadSettingsHint: 'Stel in hoe mapnamen worden bepaald en welke bestandstypes zijn toegestaan.',
    folderBehavior: 'Mapgedrag',
    folderBehaviorAuto: 'Automatisch op basis van bestandsnaam',
    folderBehaviorPreserve: 'Behoud naam van geüploade map',
    folderBehaviorPrompt: 'Vraag eerst om mapnaam',
    autoFolderStrategy: 'Automatische mapstrategie',
    autoStrategyStripNumber: 'Laatste nummer verwijderen',
    autoStrategyRemoveLastSegment: 'Laatste deel verwijderen',
    autoStrategyFullName: 'Volledige bestandsnaam gebruiken',
    allowedFileTypes: 'Toegestane bestandstypes',
    fileTypeImages: 'Afbeeldingen',
    fileTypeDocuments: 'Documenten',
    fileTypeArchives: 'Archieven',
    maxUploadSize: 'Maximale upload per bestand',
    maxUploadSizeHint: 'Stel een limiet in per bestand. Grotere bestanden worden overgeslagen.',
    uploadProgress: 'Uploadvoortgang',
    popupCancel: 'Annuleren',
    popupConfirm: 'Bevestigen',
    popupDelete: 'Verwijderen',
    confirmDeleteTitle: 'Bevestiging',
    folderPromptTitle: 'Kies een mapnaam',
    folderNameLabel: 'Mapnaam',
    folderNamePlaceholder: 'Voer een mapnaam in',
    renameProjectTitle: 'Projectnaam aanpassen',
    renameFolderTitle: 'Mapnaam aanpassen',
    renameFileTitle: 'Bestandsnaam aanpassen',
    renameProjectAction: 'Project hernoemen',
    renameFolderAction: 'Map hernoemen',
    renameFileAction: 'Bestand hernoemen',
    uploadToFolderAction: 'Upload naar map',
    uploadSelectedFolder: 'Upload in huidige map',
    saveUploadSettings: 'Uploadinstellingen opslaan',
    uploadSettingsSaved: 'Uploadinstellingen bijgewerkt',
    folderUpload: 'Map kiezen',
    currentUploadMode: 'Huidige modus',
    allowedTypesLabel: 'Toegestaan',
    folderPrompt: 'Voer een mapnaam in voor deze upload',
    folderNameRequired: 'Een mapnaam is verplicht voor deze uploadmodus',
    selectAtLeastOneType: 'Selecteer minimaal één bestandstype',
    uploadModeAutoDescription: 'Mapnaam wordt automatisch uit de bestandsnaam afgeleid.',
    uploadModePreserveDescription: 'Bij map-upload wordt de bestaande mapnaam aangehouden.',
    uploadModePromptDescription: 'Voor elke upload wordt eerst om een mapnaam gevraagd.',
    downloadProjectAction: 'Download project',
    deleteProjectAction: 'Verwijder project',
    downloadFolderAction: 'Download map',
    deleteFolderAction: 'Verwijder map',
    deleteUserAction: 'Verwijder gebruiker',
    downloadFileAction: 'Download bestand',
    copyUrlAction: 'Kopieer URL',
    previewAction: 'Preview',
    deleteFileAction: 'Verwijder bestand',
    actions: 'Acties',
    allItems: 'Alles',
  },
  en: {
    appName: 'Buckett',
    adminArea: 'Admin area',
    loginTitle: 'Admin login',
    loginSubtitle: 'Authorized users only',
    loginHeading: 'Project file management',
    loginText: 'Sign in to manage projects, users, and uploads in one place.',
    secure: 'Secure admin environment',
    navigation: 'Navigation from projects to folders and files',
    uploadFast: 'Direct upload and quick URL copy',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    projects: 'Projects',
    folders: 'Folders',
    files: 'Files',
    settings: 'Settings',
    settingsSubtitle: 'Manage projects, users, language, and activity here.',
    directUpload: 'Direct upload',
    uploadHint: 'Drop files or full folders here, or choose them manually. Upload starts directly in the selected project.',
    chooseFiles: 'Choose files',
    uploading: 'Uploading...',
    selectProjectFirst: 'Choose a project first.',
    noProjects: 'No projects yet',
    noFolders: 'No folders in this project yet.',
    noFiles: 'No files in this selection.',
    exportCsv: 'CSV export',
    logout: 'Log out',
    search: 'Search',
    closeSearch: 'Close search',
    searchPlaceholder: 'Search files and folders',
    fileManager: 'File manager',
    clickFolderHint: 'Click a folder on the left to view its contents.',
    show: 'Show',
    perPage: 'files per page',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    signedInAs: 'Signed in as',
    language: 'Language',
    languageHint: 'Dutch, English, and German are available by default. The setup is extendable for more languages.',
    projectManagement: 'Project management',
    projectPlaceholder: 'New project name',
    addProject: 'Add project',
    userManagement: 'User management',
    addUser: 'Add user',
    userPasswordPlaceholder: 'New password',
    changePasswordAction: 'Change password',
    changePasswordTitle: 'Update password',
    passwordUpdated: 'Password updated',
    passwordRequired: 'A new password is required',
    statusCardTitle: 'Status',
    uploadedFilesLabel: 'Uploaded files',
    storageUsedLabel: 'Storage used',
    systemStatusLabel: 'System status',
    versionLabel: 'Version',
    updateAvailableLabel: 'Update available',
    statusOnline: 'Online',
    statusOffline: 'Offline',
    updateYes: 'Yes',
    updateNo: 'No',
    updateUnknown: 'Unknown',
    updateNoRelease: 'No release yet',
    activityLog: 'Activity log',
    noActivity: 'No activity logged yet.',
    system: 'System',
    library: 'Library',
    themeSettings: 'Appearance and theme',
    themeMode: 'Theme mode',
    lightMode: 'Light',
    darkMode: 'Dark',
    systemMode: 'System',
    lightAccentColor: 'Light accent color',
    darkAccentColor: 'Dark accent color',
    saveThemeSettings: 'Save theme',
    themeSettingsSaved: 'Theme updated',
    uploadSettings: 'Upload settings',
    uploadSettingsHint: 'Configure how folder names are chosen and which file types are allowed.',
    folderBehavior: 'Folder behavior',
    folderBehaviorAuto: 'Automatic from file name',
    folderBehaviorPreserve: 'Keep uploaded folder name',
    folderBehaviorPrompt: 'Ask for folder name first',
    autoFolderStrategy: 'Automatic folder strategy',
    autoStrategyStripNumber: 'Remove trailing number',
    autoStrategyRemoveLastSegment: 'Remove last segment',
    autoStrategyFullName: 'Use full file name',
    allowedFileTypes: 'Allowed file types',
    fileTypeImages: 'Images',
    fileTypeDocuments: 'Documents',
    fileTypeArchives: 'Archives',
    maxUploadSize: 'Maximum upload per file',
    maxUploadSizeHint: 'Set a limit per file. Larger files will be skipped.',
    uploadProgress: 'Upload progress',
    popupCancel: 'Cancel',
    popupConfirm: 'Confirm',
    popupDelete: 'Delete',
    confirmDeleteTitle: 'Confirmation',
    folderPromptTitle: 'Choose a folder name',
    folderNameLabel: 'Folder name',
    folderNamePlaceholder: 'Enter a folder name',
    renameProjectTitle: 'Rename project',
    renameFolderTitle: 'Rename folder',
    renameFileTitle: 'Rename file',
    renameProjectAction: 'Rename project',
    renameFolderAction: 'Rename folder',
    renameFileAction: 'Rename file',
    uploadToFolderAction: 'Upload to folder',
    uploadSelectedFolder: 'Upload to current folder',
    saveUploadSettings: 'Save upload settings',
    uploadSettingsSaved: 'Upload settings updated',
    folderUpload: 'Choose folder',
    currentUploadMode: 'Current mode',
    allowedTypesLabel: 'Allowed',
    folderPrompt: 'Enter a folder name for this upload',
    folderNameRequired: 'A folder name is required for this upload mode',
    selectAtLeastOneType: 'Select at least one file type',
    uploadModeAutoDescription: 'Folder names are derived automatically from file names.',
    uploadModePreserveDescription: 'Folder uploads keep their existing folder name.',
    uploadModePromptDescription: 'Each upload asks for a folder name first.',
    downloadProjectAction: 'Download project',
    deleteProjectAction: 'Delete project',
    downloadFolderAction: 'Download folder',
    deleteFolderAction: 'Delete folder',
    deleteUserAction: 'Delete user',
    downloadFileAction: 'Download file',
    copyUrlAction: 'Copy URL',
    previewAction: 'Preview',
    deleteFileAction: 'Delete file',
    actions: 'Actions',
    allItems: 'All',
  },
  de: {
    appName: 'Buckett',
    adminArea: 'Adminbereich',
    loginTitle: 'Admin-Anmeldung',
    loginSubtitle: 'Nur für berechtigte Nutzer',
    loginHeading: 'Projekt-Dateiverwaltung',
    loginText: 'Melde dich an, um Projekte, Benutzer und Uploads zentral zu verwalten.',
    secure: 'Geschützte Admin-Umgebung',
    navigation: 'Navigation von Projekten zu Ordnern und Dateien',
    uploadFast: 'Direkter Upload und schnelles Kopieren der URL',
    username: 'Benutzername',
    password: 'Passwort',
    signIn: 'Anmelden',
    signingIn: 'Anmeldung läuft...',
    projects: 'Projekte',
    folders: 'Ordner',
    files: 'Dateien',
    settings: 'Einstellungen',
    settingsSubtitle: 'Hier verwaltest du Projekte, Benutzer, Sprache und Aktivitäten.',
    directUpload: 'Direkt hochladen',
    uploadHint: 'Dateien oder ganze Ordner hierher ziehen oder manuell auswählen. Der Upload startet direkt im ausgewählten Projekt.',
    chooseFiles: 'Dateien wählen',
    uploading: 'Wird hochgeladen...',
    selectProjectFirst: 'Bitte zuerst ein Projekt auswählen.',
    noProjects: 'Noch keine Projekte',
    noFolders: 'Noch keine Ordner in diesem Projekt.',
    noFiles: 'Keine Dateien in dieser Auswahl.',
    exportCsv: 'CSV-Export',
    logout: 'Abmelden',
    search: 'Suchen',
    closeSearch: 'Suche schließen',
    searchPlaceholder: 'Dateien und Ordner suchen',
    fileManager: 'Dateiverwaltung',
    clickFolderHint: 'Klicke links auf einen Ordner, um den Inhalt zu sehen.',
    show: 'Zeige',
    perPage: 'Dateien pro Seite',
    previous: 'Zurück',
    next: 'Weiter',
    page: 'Seite',
    of: 'von',
    signedInAs: 'Angemeldet als',
    language: 'Sprache',
    languageHint: 'Standardmäßig sind Niederländisch, Englisch und Deutsch verfügbar. Weitere Sprachen können später ergänzt werden.',
    projectManagement: 'Projektverwaltung',
    projectPlaceholder: 'Neuer Projektname',
    addProject: 'Projekt hinzufügen',
    userManagement: 'Benutzerverwaltung',
    addUser: 'Benutzer hinzufügen',
    userPasswordPlaceholder: 'Neues Passwort',
    changePasswordAction: 'Passwort ändern',
    changePasswordTitle: 'Passwort anpassen',
    passwordUpdated: 'Passwort aktualisiert',
    passwordRequired: 'Ein neues Passwort ist erforderlich',
    statusCardTitle: 'Status',
    uploadedFilesLabel: 'Hochgeladene Dateien',
    storageUsedLabel: 'Speicherverbrauch',
    systemStatusLabel: 'Systemstatus',
    versionLabel: 'Version',
    updateAvailableLabel: 'Update verfügbar',
    statusOnline: 'Online',
    statusOffline: 'Offline',
    updateYes: 'Ja',
    updateNo: 'Nein',
    updateUnknown: 'Unbekannt',
    updateNoRelease: 'Noch kein Release',
    activityLog: 'Aktivitätsprotokoll',
    noActivity: 'Noch keine Aktivitäten vorhanden.',
    system: 'System',
    library: 'Bibliothek',
    themeSettings: 'Ansicht und Thema',
    themeMode: 'Themenmodus',
    lightMode: 'Hell',
    darkMode: 'Dunkel',
    systemMode: 'System',
    lightAccentColor: 'Akzentfarbe hell',
    darkAccentColor: 'Akzentfarbe dunkel',
    saveThemeSettings: 'Thema speichern',
    themeSettingsSaved: 'Thema aktualisiert',
    uploadSettings: 'Upload-Einstellungen',
    uploadSettingsHint: 'Lege fest, wie Ordnernamen bestimmt werden und welche Dateitypen erlaubt sind.',
    folderBehavior: 'Ordnerverhalten',
    folderBehaviorAuto: 'Automatisch aus dem Dateinamen',
    folderBehaviorPreserve: 'Hochgeladenen Ordnernamen beibehalten',
    folderBehaviorPrompt: 'Vorher nach Ordnernamen fragen',
    autoFolderStrategy: 'Automatische Ordnerstrategie',
    autoStrategyStripNumber: 'Letzte Nummer entfernen',
    autoStrategyRemoveLastSegment: 'Letzten Abschnitt entfernen',
    autoStrategyFullName: 'Vollen Dateinamen verwenden',
    allowedFileTypes: 'Erlaubte Dateitypen',
    fileTypeImages: 'Bilder',
    fileTypeDocuments: 'Dokumente',
    fileTypeArchives: 'Archive',
    maxUploadSize: 'Maximale Uploadgröße pro Datei',
    maxUploadSizeHint: 'Lege ein Limit pro Datei fest. Größere Dateien werden übersprungen.',
    uploadProgress: 'Upload-Fortschritt',
    popupCancel: 'Abbrechen',
    popupConfirm: 'Bestätigen',
    popupDelete: 'Löschen',
    confirmDeleteTitle: 'Bestätigung',
    folderPromptTitle: 'Ordnernamen wählen',
    folderNameLabel: 'Ordnername',
    folderNamePlaceholder: 'Ordnernamen eingeben',
    renameProjectTitle: 'Projekt umbenennen',
    renameFolderTitle: 'Ordner umbenennen',
    renameFileTitle: 'Datei umbenennen',
    renameProjectAction: 'Projekt umbenennen',
    renameFolderAction: 'Ordner umbenennen',
    renameFileAction: 'Datei umbenennen',
    uploadToFolderAction: 'In Ordner hochladen',
    uploadSelectedFolder: 'In aktuellen Ordner hochladen',
    saveUploadSettings: 'Upload-Einstellungen speichern',
    uploadSettingsSaved: 'Upload-Einstellungen aktualisiert',
    folderUpload: 'Ordner wählen',
    currentUploadMode: 'Aktueller Modus',
    allowedTypesLabel: 'Erlaubt',
    folderPrompt: 'Gib einen Ordnernamen für diesen Upload ein',
    folderNameRequired: 'Für diesen Uploadmodus ist ein Ordnername erforderlich',
    selectAtLeastOneType: 'Wähle mindestens einen Dateityp aus',
    uploadModeAutoDescription: 'Ordnernamen werden automatisch aus Dateinamen abgeleitet.',
    uploadModePreserveDescription: 'Beim Ordner-Upload bleibt der vorhandene Ordnername erhalten.',
    uploadModePromptDescription: 'Vor jedem Upload wird erst nach einem Ordnernamen gefragt.',
    downloadProjectAction: 'Projekt herunterladen',
    deleteProjectAction: 'Projekt löschen',
    downloadFolderAction: 'Ordner herunterladen',
    deleteFolderAction: 'Ordner löschen',
    deleteUserAction: 'Benutzer löschen',
    downloadFileAction: 'Datei herunterladen',
    copyUrlAction: 'URL kopieren',
    previewAction: 'Vorschau',
    deleteFileAction: 'Datei löschen',
    actions: 'Aktionen',
    allItems: 'Alle',
  },
} as const

type Messages = (typeof translations)[keyof typeof translations]

const defaultUploadSettings: UploadSettings = {
  folderMode: 'auto',
  autoFolderStrategy: 'strip-number',
  allowedFileTypes: ['images'],
  maxFileSizeMB: 50,
}

const defaultThemeSettings: ThemeSettings = {
  mode: 'system',
  lightAccent: '#0f172a',
  darkAccent: '#60a5fa',
}

const languageLabels: Record<string, string> = {
  nl: 'Nederlands',
  en: 'English',
  de: 'Deutsch',
}

function getMessages(language: string) {
  return translations[language as keyof typeof translations] ?? translations.nl
}

function normalizeUploadSettings(uploadSettings?: Partial<UploadSettings>): UploadSettings {
  const allowedFileTypes = Array.isArray(uploadSettings?.allowedFileTypes)
    ? uploadSettings.allowedFileTypes
      .map((type) => String(type))
      .flatMap((type) => {
        if (type === 'pdf') return ['documents']
        if (type === 'zip') return ['archives']
        return [type]
      }).filter((type): type is UploadType => ['images', 'documents', 'archives'].includes(type))
    : []

  const maxFileSizeMB = Number(uploadSettings?.maxFileSizeMB ?? defaultUploadSettings.maxFileSizeMB)

  return {
    folderMode: ['auto', 'preserve', 'prompt'].includes(uploadSettings?.folderMode ?? '')
      ? uploadSettings!.folderMode!
      : defaultUploadSettings.folderMode,
    autoFolderStrategy: ['strip-number', 'remove-last-segment', 'full-name'].includes(uploadSettings?.autoFolderStrategy ?? '')
      ? uploadSettings!.autoFolderStrategy!
      : defaultUploadSettings.autoFolderStrategy,
    allowedFileTypes: allowedFileTypes.length > 0 ? [...new Set(allowedFileTypes)] : [...defaultUploadSettings.allowedFileTypes],
    maxFileSizeMB: Number.isFinite(maxFileSizeMB) ? Math.max(1, Math.min(250, Math.round(maxFileSizeMB))) : defaultUploadSettings.maxFileSizeMB,
  }
}

function normalizeThemeSettings(themeSettings?: Partial<ThemeSettings>): ThemeSettings {
  const mode = String(themeSettings?.mode ?? defaultThemeSettings.mode)
  const lightAccent = /^#[0-9a-fA-F]{6}$/.test(String(themeSettings?.lightAccent ?? ''))
    ? String(themeSettings?.lightAccent)
    : defaultThemeSettings.lightAccent
  const darkAccent = /^#[0-9a-fA-F]{6}$/.test(String(themeSettings?.darkAccent ?? ''))
    ? String(themeSettings?.darkAccent)
    : defaultThemeSettings.darkAccent

  return {
    mode: ['light', 'dark', 'system'].includes(mode) ? (mode as ThemeMode) : defaultThemeSettings.mode,
    lightAccent,
    darkAccent,
  }
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  const num = Number.parseInt(value, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getUploadAcceptValue(allowedFileTypes: UploadType[]) {
  const values: string[] = []

  if (allowedFileTypes.includes('images')) {
    values.push('image/*,.webp,.avif,.heic,.heif,.svg,.tif,.tiff')
  }

  if (allowedFileTypes.includes('documents')) {
    values.push('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.rtf,.odt,.ods,.odp,.gdoc,.gsheet,.gslides')
  }

  if (allowedFileTypes.includes('archives')) {
    values.push('.zip,.rar,.7z,.tar,.gz,.tgz,.bz2,.xz')
  }

  return values.join(',')
}

function isLocalAssetUrl(url: string) {
  try {
    const parsed = new URL(url)
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)
  } catch {
    return false
  }
}

function resolveAssetPreviewUrl(asset: Asset) {
  return asset.relativeUrl || asset.url
}

function resolveAssetCopyUrl(asset: Asset) {
  if (asset.relativeUrl && typeof window !== 'undefined' && (!asset.url || isLocalAssetUrl(asset.url))) {
    return new URL(asset.relativeUrl, window.location.origin).toString()
  }

  return asset.url
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  }

  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function getTopLevelFolderName(files: File[]) {
  const relativePath = files.find((file) => file.webkitRelativePath)?.webkitRelativePath ?? ''
  const folder = relativePath.split('/').filter(Boolean)[0] ?? ''
  return folder.trim()
}

async function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const entries: FileSystemEntry[] = []

  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve))
    if (batch.length === 0) {
      break
    }
    entries.push(...batch)
  }

  return entries
}

async function entryToFiles(entry: FileSystemEntry, parentPath = ''): Promise<File[]> {
  if (entry.isFile) {
    return await new Promise((resolve) => {
      ;(entry as FileSystemFileEntry).file((file) => {
        const relativePath = parentPath ? `${parentPath}/${file.name}` : file.name
        try {
          Object.defineProperty(file, 'webkitRelativePath', {
            value: relativePath,
            configurable: true,
          })
        } catch {
          // ignore if browser does not allow redefining the property
        }

        resolve([file])
      })
    })
  }

  if (entry.isDirectory) {
    const nextPath = parentPath ? `${parentPath}/${entry.name}` : entry.name
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const entries = await readAllEntries(reader)
    const nestedFiles = await Promise.all(entries.map((child) => entryToFiles(child, nextPath)))
    return nestedFiles.flat()
  }

  return []
}

async function extractDroppedFiles(dataTransfer: DataTransfer): Promise<{ files: File[]; source: 'files' | 'folder' }> {
  const items = Array.from(dataTransfer.items ?? [])
  const entries = items
    .map((item) => (typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null))
    .filter((entry): entry is FileSystemEntry => Boolean(entry))

  if (entries.length > 0) {
    const hasDirectory = entries.some((entry) => entry.isDirectory)
    const nestedFiles = await Promise.all(entries.map((entry) => entryToFiles(entry)))
    return {
      files: nestedFiles.flat(),
      source: hasDirectory ? 'folder' : 'files',
    }
  }

  return {
    files: Array.from(dataTransfer.files ?? []),
    source: 'files',
  }
}

function getUploadModeDescription(uploadSettings: UploadSettings, t: Messages) {
  if (uploadSettings.folderMode === 'preserve') {
    return t.uploadModePreserveDescription
  }

  if (uploadSettings.folderMode === 'prompt') {
    return t.uploadModePromptDescription
  }

  return t.uploadModeAutoDescription
}

function IconActionButton({
  label,
  onClick,
  children,
  variant = 'ghost',
  disabled = false,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  variant?: 'ghost' | 'secondary' | 'destructive'
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size="icon" title={label} aria-label={label} onClick={onClick} disabled={disabled}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function App() {
  const [sessionState, setSessionState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')
  const [currentView, setCurrentView] = useState<ViewMode>('library')

  const [projects, setProjects] = useState<Project[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedFoldersByProject, setSelectedFoldersByProject] = useState<Record<string, string>>({})
  const [projectName, setProjectName] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [preview, setPreview] = useState<Asset | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [openProjectActionsId, setOpenProjectActionsId] = useState<string | null>(null)
  const [openFolderActionsKey, setOpenFolderActionsKey] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(25)
  const [appLanguage, setAppLanguage] = useState('nl')
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['nl', 'en', 'de'])
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>(defaultUploadSettings)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings)
  const [systemInfo, setSystemInfo] = useState<SystemStatus>(defaultSystemStatus)
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, title: '', description: '', confirmLabel: '', onConfirm: null })
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderDialogValue, setFolderDialogValue] = useState('')
  const [folderDialogTitle, setFolderDialogTitle] = useState('')
  const [folderDialogDescription, setFolderDialogDescription] = useState('')
  const [folderDialogConfirmLabel, setFolderDialogConfirmLabel] = useState('')
  const [folderDialogPlaceholder, setFolderDialogPlaceholder] = useState('')
  const [folderDialogFieldLabel, setFolderDialogFieldLabel] = useState('')
  const [folderDialogRequiredMessage, setFolderDialogRequiredMessage] = useState('')
  const [folderDialogInputType, setFolderDialogInputType] = useState<'text' | 'password'>('text')

  const inputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const pendingFolderRef = useRef<string | null>(null)
  const pendingUploadRef = useRef<{ files: File[]; source: 'files' | 'folder' } | null>(null)
  const pendingTargetFolderRef = useRef('')
  const pendingDialogActionRef = useRef<((value: string) => Promise<void>) | null>(null)
  const selectedFolder = selectedProject ? (selectedFoldersByProject[selectedProject] ?? '') : ''
  const t = useMemo(() => getMessages(appLanguage), [appLanguage])
  const locale = appLanguage === 'de' ? 'de-DE' : appLanguage === 'en' ? 'en-US' : 'nl-NL'
  const uploadAccept = useMemo(() => getUploadAcceptValue(uploadSettings.allowedFileTypes), [uploadSettings.allowedFileTypes])
  const uploadModeDescription = useMemo(() => getUploadModeDescription(uploadSettings, t), [t, uploadSettings])
  const resolvedThemeMode = useMemo<Exclude<ThemeMode, 'system'>>(() => {
    if (themeSettings.mode === 'system') {
      return systemPrefersDark ? 'dark' : 'light'
    }

    return themeSettings.mode
  }, [systemPrefersDark, themeSettings.mode])
  const appStyles = useMemo(() => {
    const accent = resolvedThemeMode === 'dark' ? themeSettings.darkAccent : themeSettings.lightAccent

    return {
      '--app-bg': resolvedThemeMode === 'dark' ? '#0b1220' : '#f5f7fa',
      '--header-bg': resolvedThemeMode === 'dark' ? 'rgba(11,18,32,0.94)' : 'rgba(245,247,250,0.95)',
      '--panel-bg': resolvedThemeMode === 'dark' ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.82)',
      '--panel-soft': resolvedThemeMode === 'dark' ? 'rgba(22,34,53,0.96)' : 'rgba(255,255,255,0.66)',
      '--panel-muted': resolvedThemeMode === 'dark' ? 'rgba(30,41,59,0.95)' : 'rgba(248,250,252,0.95)',
      '--text-main': resolvedThemeMode === 'dark' ? '#e5eefb' : '#0f172a',
      '--text-soft': resolvedThemeMode === 'dark' ? '#dbe7f5' : '#475569',
      '--text-muted': resolvedThemeMode === 'dark' ? '#a9bad1' : '#64748b',
      '--border-color': resolvedThemeMode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
      '--accent': accent,
      '--accent-soft': rgba(accent, resolvedThemeMode === 'dark' ? 0.28 : 0.12),
      '--accent-strong': rgba(accent, resolvedThemeMode === 'dark' ? 0.4 : 0.18),
    } as CSSProperties
  }, [resolvedThemeMode, themeSettings.darkAccent, themeSettings.lightAccent])
  const allowedTypeLabels = useMemo(() => {
    const labels: Record<UploadType, string> = {
      images: t.fileTypeImages,
      documents: t.fileTypeDocuments,
      archives: t.fileTypeArchives,
    }

    return uploadSettings.allowedFileTypes.map((type) => labels[type]).join(', ')
  }, [t, uploadSettings.allowedFileTypes])

  function setSelectedFolderForProject(folder: string, projectId = selectedProject) {
    if (!projectId) {
      return
    }

    setSelectedFoldersByProject((current) => {
      if (!folder) {
        if (!(projectId in current)) {
          return current
        }

        const next = { ...current }
        delete next[projectId]
        return next
      }

      if (current[projectId] === folder) {
        return current
      }

      return {
        ...current,
        [projectId]: folder,
      }
    })
  }

  function showConfirmDialog({ title, description, confirmLabel = t.popupConfirm, onConfirm }: Omit<ConfirmState, 'open'>) {
    setConfirmState({ open: true, title, description, confirmLabel, onConfirm: onConfirm ?? null })
  }

  function openTextInputDialog({
    title,
    description,
    value = '',
    placeholder = t.folderNamePlaceholder,
    fieldLabel = t.folderNameLabel,
    confirmLabel = t.popupConfirm,
    requiredMessage = t.folderNameRequired,
    inputType = 'text',
    onConfirm,
  }: {
    title: string
    description: string
    value?: string
    placeholder?: string
    fieldLabel?: string
    confirmLabel?: string
    requiredMessage?: string
    inputType?: 'text' | 'password'
    onConfirm: (value: string) => Promise<void>
  }) {
    setFolderDialogTitle(title)
    setFolderDialogDescription(description)
    setFolderDialogValue(value)
    setFolderDialogPlaceholder(placeholder)
    setFolderDialogFieldLabel(fieldLabel)
    setFolderDialogConfirmLabel(confirmLabel)
    setFolderDialogRequiredMessage(requiredMessage)
    setFolderDialogInputType(inputType)
    pendingUploadRef.current = null
    pendingDialogActionRef.current = onConfirm
    setFolderDialogOpen(true)
  }

  async function handleConfirmDialog() {
    const action = confirmState.onConfirm
    setConfirmState({ open: false, title: '', description: '', confirmLabel: '', onConfirm: null })

    if (action) {
      await action()
    }
  }

  async function checkSession() {
    try {
      const response = await fetch('/api/session')
      const data = await response.json()

      if (data.authenticated) {
        setCurrentUserName(data.username ?? '')
        setSessionState('authenticated')
        await loadData()
      } else {
        setSessionState('unauthenticated')
      }
    } catch {
      setSessionState('unauthenticated')
    }
  }

  async function loadData() {
    const responses = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/files'),
      fetch('/api/users'),
      fetch('/api/settings'),
      fetch('/api/activity'),
      fetch('/api/system/status'),
    ])

    if (responses.some((response) => response.status === 401)) {
      setSessionState('unauthenticated')
      throw new Error('Niet ingelogd')
    }

    if (responses.some((response) => !response.ok)) {
      throw new Error('Kon gegevens niet laden')
    }

    const [projectData, fileData, userData, settingsData, activityData, systemData] = await Promise.all(
      responses.map((response) => response.json()),
    )

    setProjects(projectData.projects ?? [])
    setAssets(fileData.files ?? [])
    setUsers(userData.users ?? [])
    setActivity(activityData.logs ?? [])
    setSystemInfo(systemData.status ?? defaultSystemStatus)
    setAppLanguage(settingsData.settings?.language ?? 'nl')
    setAvailableLanguages(settingsData.settings?.availableLanguages ?? ['nl', 'en', 'de'])
    setUploadSettings(normalizeUploadSettings(settingsData.settings?.upload))
    setThemeSettings(normalizeThemeSettings(settingsData.settings?.theme))
  }

  useEffect(() => {
    void checkSession()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)
    setSystemPrefersDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.style.colorScheme = resolvedThemeMode
    document.title = 'Buckett'
  }, [resolvedThemeMode])

  useEffect(() => {
    if (!folderInputRef.current) {
      return
    }

    folderInputRef.current.setAttribute('webkitdirectory', '')
    folderInputRef.current.setAttribute('directory', '')
  }, [])

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) =>
      a.name.localeCompare(b.name, locale, { numeric: true, sensitivity: 'base' }),
    )
  }, [locale, projects])

  useEffect(() => {
    if (!selectedProject && sortedProjects.length > 0) {
      setSelectedProject(sortedProjects[0].id)
    }
  }, [selectedProject, sortedProjects])

  const projectAssets = useMemo(() => {
    return assets.filter((asset) => asset.projectId === selectedProject)
  }, [assets, selectedProject])

  const folders = useMemo(() => {
    const grouped = projectAssets.reduce<Record<string, FolderGroup>>((acc, asset) => {
      if (!acc[asset.folder]) {
        acc[asset.folder] = {
          projectId: asset.projectId,
          folder: asset.folder,
          count: 0,
        }
      }

      acc[asset.folder].count += 1
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) =>
      a.folder.localeCompare(b.folder, locale, { numeric: true, sensitivity: 'base' }),
    )
  }, [locale, projectAssets])

  useEffect(() => {
    if (!selectedProject) {
      pendingFolderRef.current = null
      return
    }

    if (folders.length === 0) {
      pendingFolderRef.current = null
      setSelectedFolderForProject('', selectedProject)
      return
    }

    const pendingFolder = pendingFolderRef.current
    if (pendingFolder) {
      const exists = folders.some((folder) => folder.folder === pendingFolder)
      if (exists) {
        setSelectedFolderForProject(pendingFolder, selectedProject)
        pendingFolderRef.current = null
      }
      return
    }

    const currentExists = folders.some((folder) => folder.folder === selectedFolder)
    if (!currentExists) {
      setSelectedFolderForProject(folders[0].folder, selectedProject)
    }
  }, [folders, selectedFolder, selectedProject])

  const visibleFiles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return projectAssets.filter((asset) => {
      const folderMatch = query ? true : (!selectedFolder || asset.folder === selectedFolder)
      const searchMatch =
        !query ||
        [asset.folder, asset.name, asset.url, asset.projectName].some((value) =>
          value.toLowerCase().includes(query),
        )

      return folderMatch && searchMatch
    })
  }, [projectAssets, searchTerm, selectedFolder])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedProject, selectedFolder, itemsPerPage, searchTerm])

  useEffect(() => {
    setOpenProjectActionsId(null)
    setOpenFolderActionsKey(null)
  }, [selectedProject, selectedFolder])

  const totalPages = itemsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(visibleFiles.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedFiles = useMemo(() => {
    if (itemsPerPage === 'all') {
      return visibleFiles
    }

    const start = (safeCurrentPage - 1) * itemsPerPage
    return visibleFiles.slice(start, start + itemsPerPage)
  }, [itemsPerPage, safeCurrentPage, visibleFiles])

  const rangeStart = visibleFiles.length === 0 ? 0 : itemsPerPage === 'all' ? 1 : (safeCurrentPage - 1) * itemsPerPage + 1
  const rangeEnd = visibleFiles.length === 0
    ? 0
    : itemsPerPage === 'all'
      ? visibleFiles.length
      : Math.min(safeCurrentPage * itemsPerPage, visibleFiles.length)

  const selectedProjectName = sortedProjects.find((project) => project.id === selectedProject)?.name ?? '-'
  const systemHealthLabel = systemInfo.health === 'online' ? t.statusOnline : t.statusOffline
  const updateStatusLabel = systemInfo.updateStatus === 'available'
    ? `${t.updateYes}${systemInfo.latestVersion ? ` • ${systemInfo.latestVersion}` : ''}`
    : systemInfo.updateStatus === 'current'
      ? t.updateNo
      : systemInfo.updateStatus === 'none'
        ? t.updateNoRelease
        : t.updateUnknown

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginBusy(true)

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    setLoginBusy(false)

    if (!response.ok) {
      toast.error('Ongeldige login')
      return
    }

    setPassword('')
    setCurrentUserName(username)
    setSessionState('authenticated')
    toast.success('Succesvol ingelogd')
    await loadData()
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    setSessionState('unauthenticated')
    setAssets([])
    setUsers([])
    setActivity([])
    setSystemInfo(defaultSystemStatus)
    setSelectedFoldersByProject({})
    pendingFolderRef.current = null
    toast.success('Uitgelogd')
  }

  async function addProject() {
    if (!projectName.trim()) {
      toast.error('Vul eerst een projectnaam in')
      return
    }

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName }),
    })

    const data = await response.json().catch(() => ({ error: 'Project kon niet worden opgeslagen' }))
    if (!response.ok) {
      toast.error(data.error ?? 'Project kon niet worden opgeslagen')
      return
    }

    setProjectName('')
    toast.success('Project toegevoegd')
    await loadData()
  }

  async function addUser() {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      toast.error('Vul gebruikersnaam en wachtwoord in')
      return
    }

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUserName, password: newUserPassword }),
    })

    const data = await response.json().catch(() => ({ error: 'Gebruiker kon niet worden toegevoegd' }))
    if (!response.ok) {
      toast.error(data.error ?? 'Gebruiker kon niet worden toegevoegd')
      return
    }

    setNewUserName('')
    setNewUserPassword('')
    toast.success('Gebruiker toegevoegd')
    await loadData()
  }

  async function deleteUser(userId: string, name: string) {
    showConfirmDialog({
      title: t.confirmDeleteTitle,
      description: `${name} verwijderen?`,
      confirmLabel: t.popupDelete,
      onConfirm: async () => {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
        const data = await response.json().catch(() => ({ error: 'Gebruiker kon niet worden verwijderd' }))

        if (!response.ok) {
          toast.error(data.error ?? 'Gebruiker kon niet worden verwijderd')
          return
        }

        toast.success('Gebruiker verwijderd')
        await loadData()
      },
    })
  }

  async function changeUserPassword(userId: string, name: string) {
    openTextInputDialog({
      title: t.changePasswordTitle,
      description: `${t.changePasswordAction}: ${name}`,
      value: '',
      placeholder: t.userPasswordPlaceholder,
      fieldLabel: t.userPasswordPlaceholder,
      confirmLabel: t.popupConfirm,
      requiredMessage: t.passwordRequired,
      inputType: 'password',
      onConfirm: async (value) => {
        const response = await fetch(`/api/users/${userId}/password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: value }),
        })

        const data = await response.json().catch(() => ({ error: 'Wachtwoord kon niet worden aangepast' }))
        if (!response.ok) {
          toast.error(data.error ?? 'Wachtwoord kon niet worden aangepast')
          return
        }

        toast.success(t.passwordUpdated)
        await loadData()
      },
    })
  }

  async function saveLanguage(language: string) {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    })

    const data = await response.json().catch(() => ({ error: 'Taal kon niet worden opgeslagen' }))
    if (!response.ok) {
      toast.error(data.error ?? 'Taal kon niet worden opgeslagen')
      return
    }

    setAppLanguage(data.settings?.language ?? language)
    setAvailableLanguages(data.settings?.availableLanguages ?? availableLanguages)
    setUploadSettings(normalizeUploadSettings(data.settings?.upload))
    setThemeSettings(normalizeThemeSettings(data.settings?.theme))
    toast.success('Taal bijgewerkt')
  }

  async function saveThemeSettings(nextSettings: ThemeSettings) {
    const normalized = normalizeThemeSettings(nextSettings)
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: appLanguage, upload: uploadSettings, theme: normalized }),
    })

    const data = await response.json().catch(() => ({ error: 'Thema kon niet worden opgeslagen' }))
    if (!response.ok) {
      toast.error(data.error ?? 'Thema kon niet worden opgeslagen')
      return
    }

    setThemeSettings(normalizeThemeSettings(data.settings?.theme ?? normalized))
    toast.success(t.themeSettingsSaved)
  }

  async function saveUploadSettings(nextSettings: UploadSettings) {
    if (nextSettings.allowedFileTypes.length === 0) {
      toast.error(t.selectAtLeastOneType)
      return
    }

    const normalized = normalizeUploadSettings(nextSettings)
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: appLanguage, upload: normalized, theme: themeSettings }),
    })

    const data = await response.json().catch(() => ({ error: 'Uploadinstellingen konden niet worden opgeslagen' }))
    if (!response.ok) {
      toast.error(data.error ?? 'Uploadinstellingen konden niet worden opgeslagen')
      return
    }

    setUploadSettings(normalizeUploadSettings(data.settings?.upload ?? normalized))
    toast.success(t.uploadSettingsSaved)
  }

  async function renameProject(projectId: string, currentName: string) {
    openTextInputDialog({
      title: t.renameProjectTitle,
      description: t.renameProjectAction,
      value: currentName,
      onConfirm: async (value) => {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: value }),
        })

        const data = await response.json().catch(() => ({ error: 'Project kon niet worden aangepast' }))
        if (!response.ok) {
          toast.error(data.error ?? 'Project kon niet worden aangepast')
          return
        }

        toast.success('Project aangepast')
        await loadData()
      },
    })
  }

  async function renameFolder(projectId: string, currentName: string) {
    openTextInputDialog({
      title: t.renameFolderTitle,
      description: t.renameFolderAction,
      value: currentName,
      onConfirm: async (value) => {
        const response = await fetch('/api/folders/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, oldFolder: currentName, newFolder: value }),
        })

        const data = await response.json().catch(() => ({ error: 'Map kon niet worden aangepast' }))
        if (!response.ok) {
          toast.error(data.error ?? 'Map kon niet worden aangepast')
          return
        }

        const nextFolderName = data.folder ?? value
        pendingFolderRef.current = nextFolderName
        setSelectedFolderForProject(nextFolderName, projectId)
        toast.success('Map aangepast')
        await loadData()
      },
    })
  }

  async function renameFile(fileId: string, currentName: string) {
    openTextInputDialog({
      title: t.renameFileTitle,
      description: t.renameFileAction,
      value: currentName,
      onConfirm: async (value) => {
        const response = await fetch(`/api/files/${fileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: value }),
        })

        const data = await response.json().catch(() => ({ error: 'Bestand kon niet worden aangepast' }))
        if (!response.ok) {
          toast.error(data.error ?? 'Bestand kon niet worden aangepast')
          return
        }

        setPreview(null)
        toast.success('Bestandsnaam aangepast')
        await loadData()
      },
    })
  }

  function startUploadToFolder(folderName: string) {
    if (!folderName) {
      return
    }

    pendingTargetFolderRef.current = folderName
    inputRef.current?.click()
  }

  async function performUpload(files: File[], source: 'files' | 'folder' = 'files', folderName = '') {
    const formData = new FormData()
    formData.append('projectId', selectedProject)

    if (folderName) {
      formData.append('folderName', folderName)
    }

    files.forEach((file) => {
      formData.append('files', file, file.name)
      formData.append('relativePaths', file.webkitRelativePath || '')
    })

    setUploading(true)
    setUploadProgress(0)

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload')

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        }

        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText || '{}')

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data)
            return
          }

          reject(new Error(data.error || 'Upload mislukt'))
        }

        xhr.onerror = () => reject(new Error('Upload mislukt'))
        xhr.send(formData)
      })

      const firstFolder = data.files?.[0]?.folder ?? (source === 'folder' ? getTopLevelFolderName(files) : '')
      if (firstFolder) {
        pendingFolderRef.current = firstFolder
        setSelectedFolderForProject(firstFolder, selectedProject)
      }

      const uploadedCount = Array.isArray(data.files) ? data.files.length : files.length
      const skippedCount = Array.isArray(data.skipped) ? data.skipped.length : 0
      const summary = skippedCount > 0
        ? `${uploadedCount} bestand(en) geüpload, ${skippedCount} overgeslagen`
        : `${uploadedCount} bestand(en) geüpload`

      toast.success(summary)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload mislukt')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function uploadFiles(files: File[], source: 'files' | 'folder' = 'files', targetFolder = '') {
    if (!selectedProject) {
      toast.error(t.selectProjectFirst)
      return
    }

    if (files.length === 0) {
      return
    }

    if (targetFolder) {
      await performUpload(files, source, targetFolder)
      return
    }

    if (uploadSettings.folderMode === 'prompt') {
      const suggestedFolder = getTopLevelFolderName(files) || selectedFolder || ''
      setFolderDialogTitle(t.folderPromptTitle)
      setFolderDialogDescription(t.folderPrompt)
      setFolderDialogPlaceholder(t.folderNamePlaceholder)
      setFolderDialogConfirmLabel(t.popupConfirm)
      setFolderDialogValue(suggestedFolder)
      pendingDialogActionRef.current = null
      pendingUploadRef.current = { files, source }
      setFolderDialogOpen(true)
      return
    }

    await performUpload(files, source)
  }

  async function deleteFile(id: string) {
    showConfirmDialog({
      title: t.confirmDeleteTitle,
      description: 'Weet je zeker dat je dit bestand wilt verwijderen?',
      confirmLabel: t.popupDelete,
      onConfirm: async () => {
        const response = await fetch(`/api/files/${id}`, { method: 'DELETE' })
        if (!response.ok) {
          toast.error('Bestand kon niet worden verwijderd')
          return
        }

        toast.success('Bestand verwijderd')
        await loadData()
      },
    })
  }

  async function deleteFolder(projectId: string, folder: string) {
    showConfirmDialog({
      title: t.confirmDeleteTitle,
      description: `Verwijder map ${folder} met alle inhoud?`,
      confirmLabel: t.popupDelete,
      onConfirm: async () => {
        if (selectedFolder === folder) {
          const currentIndex = folders.findIndex((item) => item.folder === folder)
          const nextFolder = folders[currentIndex + 1]?.folder ?? folders[currentIndex - 1]?.folder ?? null
          pendingFolderRef.current = nextFolder
          setSelectedFolderForProject(nextFolder ?? '', projectId)
        }

        const response = await fetch('/api/folders/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, folder }),
        })

        if (!response.ok) {
          toast.error('Map kon niet worden verwijderd')
          return
        }

        toast.success('Map verwijderd')
        await loadData()
      },
    })
  }

  async function deleteProject(projectId: string, projectLabel: string) {
    showConfirmDialog({
      title: t.confirmDeleteTitle,
      description: `Verwijder project ${projectLabel} met alle mappen en bestanden?`,
      confirmLabel: t.popupDelete,
      onConfirm: async () => {
        const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
        if (!response.ok) {
          toast.error('Project kon niet worden verwijderd')
          return
        }

        setSelectedFolderForProject('', projectId)
        if (selectedProject === projectId) {
          setSelectedProject('')
          pendingFolderRef.current = null
        }

        toast.success('Project verwijderd')
        await loadData()
      },
    })
  }

  function downloadProject(projectId: string) {
    window.open(`/api/projects/${projectId}/download`, '_blank')
  }

  function downloadFolder(projectId: string, folder: string) {
    const params = new URLSearchParams({ projectId, folder })
    window.open(`/api/folders/download?${params.toString()}`, '_blank')
  }

  function downloadFile(fileId: string) {
    window.open(`/api/files/${fileId}/download`, '_blank')
  }

  function toggleSearch() {
    setCurrentView('library')
    setSearchOpen((open) => !open)
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL gekopieerd')
    } catch {
      toast.error('Kon de URL niet kopiëren')
    }
  }

  async function toggleThemeMode() {
    const nextMode: ThemeMode = resolvedThemeMode === 'dark' ? 'light' : 'dark'
    await saveThemeSettings({ ...themeSettings, mode: nextMode })
  }

  async function submitFolderDialog() {
    if (!folderDialogValue.trim()) {
      toast.error(folderDialogRequiredMessage || t.folderNameRequired)
      return
    }

    const pendingUpload = pendingUploadRef.current
    const pendingAction = pendingDialogActionRef.current
    setFolderDialogOpen(false)
    setFolderDialogFieldLabel('')
    setFolderDialogRequiredMessage('')
    setFolderDialogInputType('text')

    pendingUploadRef.current = null
    pendingDialogActionRef.current = null

    if (pendingAction) {
      await pendingAction(folderDialogValue.trim())
      return
    }

    if (pendingUpload) {
      await performUpload(pendingUpload.files, pendingUpload.source, folderDialogValue.trim())
    }
  }

  if (sessionState === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] text-sm text-slate-500">Bezig met laden...</div>
  }

  if (sessionState === 'unauthenticated') {
    return (
      <div className="min-h-screen px-6 py-10" style={{ ...appStyles, background: 'var(--app-bg)', color: 'var(--text-main)' }}>
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] p-8" style={{ background: 'var(--panel-bg)', color: 'var(--text-main)' }}>
            <div className="mb-5 flex items-center gap-3 text-slate-700">
              <div className="rounded-2xl bg-slate-900 p-2 text-white">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{t.appName}</div>
                <div className="text-sm text-slate-500">{t.adminArea}</div>
              </div>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{t.loginHeading}</h1>
            <p className="mt-4 max-w-xl text-base text-slate-600">{t.loginText}</p>
            <div className="mt-8 grid gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-slate-400" /> {t.secure}</div>
              <div className="flex items-center gap-2"><Folder className="h-4 w-4 text-slate-400" /> {t.navigation}</div>
              <div className="flex items-center gap-2"><ImageUp className="h-4 w-4 text-slate-400" /> {t.uploadFast}</div>
            </div>
          </div>

          <form onSubmit={(event) => void handleLogin(event)} className="rounded-[28px] p-8" style={{ background: 'var(--panel-bg)', color: 'var(--text-main)' }}>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold">{t.loginTitle}</div>
                <div className="text-sm text-slate-500">{t.loginSubtitle}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-600">{t.username}</label>
                <Input value={username} onChange={(event) => setUsername(event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-600">{t.password}</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </div>

            <Button type="submit" className="mt-6 w-full" disabled={loginBusy}>
              {loginBusy ? t.signingIn : t.signIn}
            </Button>
          </form>
        </div>

        <Toaster position="top-right" richColors />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen text-[13px]" style={appStyles}>
        <header className="sticky top-0 z-30 border-b backdrop-blur-sm" style={{ borderColor: 'var(--border-color)', background: 'var(--header-bg)' }}>
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <button type="button" className="flex items-center gap-3 text-left" onClick={() => setCurrentView('library')}>
              <div className="rounded-2xl bg-slate-900 p-2 text-white">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{t.appName}</div>
                <div className="text-xs text-slate-500">{t.adminArea}</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <div className="hidden text-xs text-slate-500 md:block">{t.signedInAs}: <span className="font-medium text-slate-700">{currentUserName || username}</span></div>

              <div className={`overflow-hidden transition-all duration-300 ease-out ${searchOpen ? 'max-w-[280px] opacity-100' : 'max-w-0 opacity-0'}`}>
                <div className="flex items-center gap-2 rounded-xl bg-white px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-40 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 lg:w-56"
                  />
                  {searchTerm && (
                    <button type="button" aria-label="clear" className="text-slate-400 transition hover:text-slate-700" onClick={() => setSearchTerm('')}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <IconActionButton label={resolvedThemeMode === 'dark' ? t.lightMode : t.darkMode} onClick={() => void toggleThemeMode()}>
                {resolvedThemeMode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </IconActionButton>
              <IconActionButton label={searchOpen ? t.closeSearch : t.search} onClick={toggleSearch}>
                <Search className="h-3.5 w-3.5" />
              </IconActionButton>
              <IconActionButton label={t.exportCsv} variant="secondary" onClick={() => window.open(`/api/export/csv${selectedProject ? `?projectId=${selectedProject}` : ''}`, '_blank')}>
                <Download className="h-3.5 w-3.5" />
              </IconActionButton>
              <IconActionButton label={t.settings} variant={currentView === 'settings' ? 'secondary' : 'ghost'} onClick={() => setCurrentView((view) => view === 'settings' ? 'library' : 'settings')}>
                <Settings className="h-3.5 w-3.5" />
              </IconActionButton>
              <IconActionButton label={t.logout} onClick={() => void handleLogout()}>
                <LogOut className="h-3.5 w-3.5" />
              </IconActionButton>
            </div>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-64px)] w-full grid-cols-1 lg:grid-cols-[260px_260px_minmax(0,1fr)]">
          <aside className="flex h-full flex-col px-4 py-5 lg:border-r" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border-color)' }}>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{t.projects}</div>
              <div className="space-y-1.5">
              {sortedProjects.length === 0 && (
                <div className="rounded-2xl bg-slate-100/60 px-3 py-4 text-xs text-slate-500">{t.noProjects}</div>
              )}
              {sortedProjects.map((project) => {
                const count = assets.filter((asset) => asset.projectId === project.id).length
                const active = selectedProject === project.id
                const actionsOpen = openProjectActionsId === project.id
                return (
                  <div key={project.id} className={`relative flex items-center gap-2 rounded-xl px-1 py-1 ${active ? 'bg-slate-100/80' : ''}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProject(project.id)
                        setCurrentView('library')
                      }}
                      className={`flex min-w-0 flex-1 items-center justify-between rounded-xl px-2.5 py-2.5 pr-3 text-left transition ${
                        active ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                        <Folder className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-[12px] font-medium">{project.name}</span>
                      </div>
                      <span className={`ml-2 text-[10px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>{count}</span>
                    </button>

                    <div className="relative shrink-0">
                      <div className={`absolute right-9 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/95 px-1.5 py-1 shadow-sm transition-all duration-200 ${actionsOpen ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-3 opacity-0'}`}>
                        <IconActionButton label={t.renameProjectAction} onClick={() => { setOpenProjectActionsId(null); void renameProject(project.id, project.name) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </IconActionButton>
                        <IconActionButton label={t.downloadProjectAction} onClick={() => { setOpenProjectActionsId(null); downloadProject(project.id) }}>
                          <Download className="h-3.5 w-3.5" />
                        </IconActionButton>
                        <IconActionButton label={t.deleteProjectAction} onClick={() => { setOpenProjectActionsId(null); void deleteProject(project.id, project.name) }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconActionButton>
                      </div>

                      <IconActionButton
                        label={t.settings}
                        variant={actionsOpen ? 'secondary' : 'ghost'}
                        onClick={() => setOpenProjectActionsId((current) => current === project.id ? null : project.id)}
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </IconActionButton>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border p-3" style={{ borderColor: 'var(--border-color)', background: 'var(--panel-muted)', color: 'var(--text-soft)' }}>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                <Activity className="h-3.5 w-3.5" />
                <span>{t.statusCardTitle}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span>{t.uploadedFilesLabel}</span>
                  <span className="font-semibold text-slate-800">{systemInfo.fileCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t.storageUsedLabel}</span>
                  <span className="font-semibold text-slate-800">{formatFileSize(systemInfo.totalBytes)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t.systemStatusLabel}</span>
                  <span className="flex items-center gap-2 font-semibold text-slate-800">
                    <span className={`inline-block h-2 w-2 rounded-full ${systemInfo.health === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {systemHealthLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t.versionLabel}</span>
                  <span className="font-semibold text-slate-800">v{systemInfo.version}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t.updateAvailableLabel}</span>
                  <span className="text-right font-semibold text-slate-800">{updateStatusLabel}</span>
                </div>
              </div>
            </div>
          </aside>

          <aside className="px-3 py-4 lg:border-r" style={{ background: 'var(--panel-soft)', borderColor: 'var(--border-color)' }}>
            {currentView === 'library' ? (
              <>
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{t.folders}</div>
                <div className="space-y-1.5">
                  {!selectedProject && <div className="text-xs text-slate-500">{t.selectProjectFirst}</div>}
                  {selectedProject && folders.length === 0 && (
                    <div className="rounded-xl bg-slate-100/60 px-3 py-3 text-xs text-slate-500">{t.noFolders}</div>
                  )}
                  {folders.map((folder) => {
                    const active = selectedFolder === folder.folder
                    const folderKey = `${folder.projectId}:${folder.folder}`
                    const actionsOpen = openFolderActionsKey === folderKey
                    return (
                      <div key={folder.folder} className={`relative flex items-center gap-2 rounded-xl px-1 py-1 transition ${active ? 'bg-slate-100/80' : 'bg-transparent'}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedFolderForProject(folder.folder, folder.projectId)}
                          className={`flex min-w-0 flex-1 items-center justify-between rounded-xl px-2.5 py-2 pr-3 text-left transition ${
                            active ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate text-[12px] font-medium">{folder.folder}</span>
                          </div>
                          <span className={`ml-2 text-[10px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>{folder.count}</span>
                        </button>

                        <div className="relative shrink-0">
                          <div className={`absolute right-9 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/95 px-1.5 py-1 shadow-sm transition-all duration-200 ${actionsOpen ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-3 opacity-0'}`}>
                            <IconActionButton label={t.renameFolderAction} onClick={() => { setOpenFolderActionsKey(null); void renameFolder(folder.projectId, folder.folder) }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </IconActionButton>
                            <IconActionButton label={t.uploadToFolderAction} onClick={() => { setOpenFolderActionsKey(null); startUploadToFolder(folder.folder) }}>
                              <ImageUp className="h-3.5 w-3.5" />
                            </IconActionButton>
                            <IconActionButton label={t.downloadFolderAction} onClick={() => { setOpenFolderActionsKey(null); downloadFolder(folder.projectId, folder.folder) }}>
                              <Download className="h-3.5 w-3.5" />
                            </IconActionButton>
                            <IconActionButton label={t.deleteFolderAction} onClick={() => { setOpenFolderActionsKey(null); void deleteFolder(folder.projectId, folder.folder) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconActionButton>
                          </div>

                          <IconActionButton
                            label={t.settings}
                            variant={actionsOpen ? 'secondary' : 'ghost'}
                            onClick={() => setOpenFolderActionsKey((current) => current === folderKey ? null : folderKey)}
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </IconActionButton>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{t.system}</div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="rounded-2xl bg-white/80 p-3"><Languages className="mb-2 h-4 w-4 text-slate-500" />{t.language}</div>
                  <div className="rounded-2xl bg-white/80 p-3"><Users className="mb-2 h-4 w-4 text-slate-500" />{t.userManagement}</div>
                  <div className="rounded-2xl bg-white/80 p-3"><Activity className="mb-2 h-4 w-4 text-slate-500" />{t.activityLog}</div>
                </div>
              </>
            )}
          </aside>

          <main className="px-4 py-5 lg:px-6" style={{ background: 'var(--app-bg)', color: 'var(--text-main)' }}>
            {currentView === 'settings' ? (
              <>
                <header className="mb-5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>{t.settings}</span>
                  </div>
                  <h2 className="text-[28px] font-semibold tracking-tight">{t.settings}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t.settingsSubtitle}</p>
                </header>

                <div className="grid gap-4 xl:grid-cols-2">
                  <section className="rounded-[24px] p-5" style={{ background: 'var(--panel-bg)', color: 'var(--text-main)' }}>
                    <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--text-soft)' }}>
                      <Languages className="h-4 w-4" />
                      <div className="text-sm font-semibold">{t.language}</div>
                    </div>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                      value={appLanguage}
                      onChange={(event) => void saveLanguage(event.target.value)}
                    >
                      {availableLanguages.map((language) => (
                        <option key={language} value={language}>
                          {languageLabels[language] ?? language.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <p className="mt-3 text-xs text-slate-500">{t.languageHint}</p>
                  </section>

                  <section className="rounded-[24px] p-5" style={{ background: 'var(--panel-bg)', color: 'var(--text-main)' }}>
                    <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--text-soft)' }}>
                      <Settings className="h-4 w-4" />
                      <div className="text-sm font-semibold">{t.themeSettings}</div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm text-slate-600">{t.themeMode}</label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                          value={themeSettings.mode}
                          onChange={(event) => setThemeSettings((current) => ({ ...current, mode: event.target.value as ThemeMode }))}
                        >
                          <option value="light">{t.lightMode}</option>
                          <option value="dark">{t.darkMode}</option>
                          <option value="system">{t.systemMode}</option>
                        </select>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm text-slate-600">{t.lightAccentColor}</label>
                          <input
                            type="color"
                            value={themeSettings.lightAccent}
                            onChange={(event) => setThemeSettings((current) => ({ ...current, lightAccent: event.target.value }))}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm text-slate-600">{t.darkAccentColor}</label>
                          <input
                            type="color"
                            value={themeSettings.darkAccent}
                            onChange={(event) => setThemeSettings((current) => ({ ...current, darkAccent: event.target.value }))}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1"
                          />
                        </div>
                      </div>

                      <Button onClick={() => void saveThemeSettings(themeSettings)}>{t.saveThemeSettings}</Button>
                    </div>
                  </section>

                  <section className="rounded-[24px] p-5" style={{ background: 'var(--panel-bg)', color: 'var(--text-main)' }}>
                    <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--text-soft)' }}>
                      <ImageUp className="h-4 w-4" />
                      <div className="text-sm font-semibold">{t.uploadSettings}</div>
                    </div>
                    <p className="text-xs text-slate-500">{t.uploadSettingsHint}</p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm text-slate-600">{t.folderBehavior}</label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                          value={uploadSettings.folderMode}
                          onChange={(event) => setUploadSettings((current) => ({
                            ...current,
                            folderMode: event.target.value as UploadSettings['folderMode'],
                          }))}
                        >
                          <option value="auto">{t.folderBehaviorAuto}</option>
                          <option value="preserve">{t.folderBehaviorPreserve}</option>
                          <option value="prompt">{t.folderBehaviorPrompt}</option>
                        </select>
                      </div>

                      {uploadSettings.folderMode === 'auto' && (
                        <div>
                          <label className="mb-2 block text-sm text-slate-600">{t.autoFolderStrategy}</label>
                          <select
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                            value={uploadSettings.autoFolderStrategy}
                            onChange={(event) => setUploadSettings((current) => ({
                              ...current,
                              autoFolderStrategy: event.target.value as UploadSettings['autoFolderStrategy'],
                            }))}
                          >
                            <option value="strip-number">{t.autoStrategyStripNumber}</option>
                            <option value="remove-last-segment">{t.autoStrategyRemoveLastSegment}</option>
                            <option value="full-name">{t.autoStrategyFullName}</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <div className="mb-2 text-sm text-slate-600">{t.allowedFileTypes}</div>
                        <div className="flex flex-wrap gap-2">
                          {(['images', 'documents', 'archives'] as UploadType[]).map((type) => {
                            const checked = uploadSettings.allowedFileTypes.includes(type)
                            const label = type === 'images'
                              ? t.fileTypeImages
                              : type === 'documents'
                                ? t.fileTypeDocuments
                                : t.fileTypeArchives

                            return (
                              <label key={type} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={checked}
                                  onChange={() => {
                                    setUploadSettings((current) => {
                                      const nextTypes = current.allowedFileTypes.includes(type)
                                        ? current.allowedFileTypes.filter((item) => item !== type)
                                        : [...current.allowedFileTypes, type]

                                      if (nextTypes.length === 0) {
                                        return current
                                      }

                                      return {
                                        ...current,
                                        allowedFileTypes: nextTypes,
                                      }
                                    })
                                  }}
                                />
                                <span>{label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-slate-600">{t.maxUploadSize}</label>
                        <Input
                          type="number"
                          min={1}
                          max={250}
                          value={String(uploadSettings.maxFileSizeMB)}
                          onChange={(event) => setUploadSettings((current) => ({
                            ...current,
                            maxFileSizeMB: Number(event.target.value || 1),
                          }))}
                        />
                        <p className="mt-2 text-xs text-slate-500">{t.maxUploadSizeHint}</p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{uploadModeDescription}</div>

                      <Button onClick={() => void saveUploadSettings(uploadSettings)}>{t.saveUploadSettings}</Button>
                    </div>
                  </section>

                  <section className="rounded-[24px] bg-white/80 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-700">
                      <Folder className="h-4 w-4" />
                      <div className="text-sm font-semibold">{t.projectManagement}</div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input placeholder={t.projectPlaceholder} value={projectName} onChange={(event) => setProjectName(event.target.value)} />
                      <Button onClick={() => void addProject()}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t.addProject}
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {sortedProjects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <span>{project.name}</span>
                          <div className="flex items-center gap-1">
                            <IconActionButton label={t.renameProjectAction} onClick={() => void renameProject(project.id, project.name)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </IconActionButton>
                            <IconActionButton label={t.downloadProjectAction} onClick={() => downloadProject(project.id)}>
                              <Download className="h-3.5 w-3.5" />
                            </IconActionButton>
                            <IconActionButton label={t.deleteProjectAction} onClick={() => void deleteProject(project.id, project.name)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconActionButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] bg-white/80 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-700">
                      <Users className="h-4 w-4" />
                      <div className="text-sm font-semibold">{t.userManagement}</div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input placeholder={t.username} value={newUserName} onChange={(event) => setNewUserName(event.target.value)} />
                      <Input type="password" placeholder={t.userPasswordPlaceholder} value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} />
                      <Button onClick={() => void addUser()}>{t.addUser}</Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-[11px] text-slate-400">{new Date(user.createdAt).toLocaleString(locale)}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <IconActionButton
                              label={t.changePasswordAction}
                              onClick={() => void changeUserPassword(user.id, user.username)}
                            >
                              <LockKeyhole className="h-3.5 w-3.5" />
                            </IconActionButton>
                            <IconActionButton
                              label={t.deleteUserAction}
                              onClick={() => void deleteUser(user.id, user.username)}
                              disabled={user.username === currentUserName}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconActionButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] bg-white/80 p-5 xl:col-span-2">
                    <div className="mb-3 flex items-center gap-2 text-slate-700">
                      <Activity className="h-4 w-4" />
                      <div className="text-sm font-semibold">{t.activityLog}</div>
                    </div>
                    <div className="space-y-2">
                      {activity.length === 0 && <div className="text-xs text-slate-500">{t.noActivity}</div>}
                      {activity.slice(0, 20).map((item) => (
                        <div key={item.id} className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-medium">{item.user} • {item.target}</div>
                            <div className="text-[11px] text-slate-500">{item.details || item.action}</div>
                          </div>
                          <div className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString(locale)}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <>
                <header className="mb-5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>{t.projects}</span>
                    <ChevronRight className="h-4 w-4" />
                    <span>{selectedProjectName}</span>
                    {selectedFolder && (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        <span>{selectedFolder}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-[28px] font-semibold tracking-tight">{t.fileManager}</h2>
                </header>

                <section
                  className={`mb-5 rounded-[24px] p-5 transition ${dragging ? 'bg-slate-200/70' : 'bg-white/80'}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragging(false)
                    void (async () => {
                      const result = await extractDroppedFiles(event.dataTransfer)
                      await uploadFiles(result.files, result.source)
                    })()
                  }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="mb-2 text-sm font-medium text-slate-700">{t.directUpload}</div>
                      <div className="text-sm text-slate-500">{t.uploadHint}</div>
                      <div className="mt-2 text-xs text-slate-400">{t.currentUploadMode}: {uploadModeDescription} • {t.allowedTypesLabel}: {allowedTypeLabels} • {uploadSettings.maxFileSizeMB} MB</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={inputRef}
                        type="file"
                        accept={uploadAccept}
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          const targetFolder = pendingTargetFolderRef.current
                          pendingTargetFolderRef.current = ''
                          void uploadFiles(Array.from(event.target.files ?? []), 'files', targetFolder)
                          event.target.value = ''
                        }}
                      />
                      <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          void uploadFiles(Array.from(event.target.files ?? []), 'folder')
                          event.target.value = ''
                        }}
                      />
                      <Button variant="secondary" onClick={() => {
                        pendingTargetFolderRef.current = ''
                        inputRef.current?.click()
                      }} disabled={!selectedProject || uploading}>
                        <ImageUp className="mr-2 h-4 w-4" />
                        {uploading ? t.uploading : t.chooseFiles}
                      </Button>
                      <Button variant="outline" onClick={() => folderInputRef.current?.click()} disabled={!selectedProject || uploading}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {t.folderUpload}
                      </Button>
                      {selectedFolder && (
                        <Button variant="outline" onClick={() => startUploadToFolder(selectedFolder)} disabled={!selectedProject || uploading}>
                          <ImageUp className="mr-2 h-4 w-4" />
                          {t.uploadSelectedFolder}
                        </Button>
                      )}
                    </div>
                  </div>

                  {uploading && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                        <span>{t.uploadProgress}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-slate-900 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-[24px]" style={{ background: 'var(--panel-bg)', color: 'var(--text-main)' }}>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{t.files}</div>
                      <div className="text-xs text-slate-500">{t.clickFolderHint}</div>
                    </div>
                    <div className="text-xs text-slate-400">{visibleFiles.length}</div>
                  </div>

                  <div className="overflow-x-auto px-2 pb-3">
                    <table className="w-full min-w-[920px] border-collapse text-left text-[12px]">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="px-4 py-3 font-medium">{t.folders}</th>
                          <th className="px-4 py-3 font-medium">{t.files}</th>
                          <th className="px-4 py-3 font-medium">URL</th>
                          <th className="px-4 py-3 font-medium">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFiles.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                              {t.noFiles}
                            </td>
                          </tr>
                        )}
                        {paginatedFiles.map((asset) => (
                          <tr key={asset.id} className="border-t border-slate-100/80 transition-colors hover:bg-slate-50/80">
                            <td className="px-4 py-3 text-slate-700">{asset.folder}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{asset.name}</div>
                              <div className="text-xs text-slate-400">{new Date(asset.createdAt).toLocaleString(locale)}</div>
                            </td>
                            <td className="max-w-xs px-4 py-3 text-xs text-slate-500">
                              <div className="truncate">{asset.url}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <IconActionButton label={t.renameFileAction} onClick={() => void renameFile(asset.id, asset.name)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </IconActionButton>
                                <IconActionButton label={t.downloadFileAction} onClick={() => downloadFile(asset.id)}>
                                  <Download className="h-3.5 w-3.5" />
                                </IconActionButton>
                                <IconActionButton label={t.copyUrlAction} onClick={() => void copyUrl(resolveAssetCopyUrl(asset))}>
                                  <Link2 className="h-3.5 w-3.5" />
                                </IconActionButton>
                                <IconActionButton label={t.previewAction} onClick={() => setPreview(asset)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </IconActionButton>
                                <IconActionButton label={t.deleteFileAction} variant="destructive" onClick={() => void deleteFile(asset.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </IconActionButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100/80 px-5 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{t.show}</span>
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none"
                        value={String(itemsPerPage)}
                        onChange={(event) => {
                          const value = event.target.value
                          setItemsPerPage(value === 'all' ? 'all' : Number(value))
                        }}
                      >
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="all">{t.allItems}</option>
                      </select>
                      <span>{t.perPage}</span>
                      <span className="text-slate-400">{rangeStart}-{rangeEnd} {t.of} {visibleFiles.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" disabled={safeCurrentPage <= 1 || visibleFiles.length === 0} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                        {t.previous}
                      </Button>
                      <span className="text-xs text-slate-500">{t.page} {safeCurrentPage} {t.of} {totalPages}</span>
                      <Button variant="ghost" size="sm" disabled={safeCurrentPage >= totalPages || visibleFiles.length === 0} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                        {t.next}
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>

        <Toaster position="top-right" richColors />

        <Dialog open={confirmState.open} onOpenChange={(open) => setConfirmState((current) => ({ ...current, open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{confirmState.title}</DialogTitle>
              <DialogDescription>{confirmState.description}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmState({ open: false, title: '', description: '', confirmLabel: '', onConfirm: null })}>
                {t.popupCancel}
              </Button>
              <Button variant="destructive" onClick={() => void handleConfirmDialog()}>
                {confirmState.confirmLabel || t.popupDelete}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{folderDialogTitle || t.folderPromptTitle}</DialogTitle>
              <DialogDescription>{folderDialogDescription || t.folderPrompt}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm text-slate-600">{folderDialogFieldLabel || t.folderNameLabel}</label>
                <Input type={folderDialogInputType} value={folderDialogValue} placeholder={folderDialogPlaceholder || t.folderNamePlaceholder} onChange={(event) => setFolderDialogValue(event.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  pendingUploadRef.current = null
                  pendingDialogActionRef.current = null
                  setFolderDialogFieldLabel('')
                  setFolderDialogRequiredMessage('')
                  setFolderDialogInputType('text')
                  setFolderDialogOpen(false)
                }}>
                  {t.popupCancel}
                </Button>
                <Button onClick={() => void submitFolderDialog()}>{folderDialogConfirmLabel || t.popupConfirm}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{preview?.name}</DialogTitle>
              <DialogDescription>
                {preview?.projectName} • {preview?.folder}
              </DialogDescription>
            </DialogHeader>
            {preview && (
              <div className="space-y-3">
                <img src={resolveAssetPreviewUrl(preview)} alt={preview.name} className="max-h-[70vh] w-full rounded-2xl object-contain" />
                <div className="text-sm text-slate-600">{Math.round(preview.size / 1024)} KB</div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default App
