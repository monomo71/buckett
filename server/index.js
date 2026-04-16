import archiver from 'archiver'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const uploadsDir = path.join(rootDir, 'uploads')
const dataDir = path.join(rootDir, 'data')
const dbPath = path.join(dataDir, 'db.json')
const sessions = new Map()

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const HARD_MAX_FILE_SIZE_MB = 250
const DEFAULT_UPLOAD_SETTINGS = {
  folderMode: 'auto',
  autoFolderStrategy: 'strip-number',
  allowedFileTypes: ['images'],
  maxFileSizeMB: 50,
}
const DEFAULT_THEME_SETTINGS = {
  mode: 'system',
  lightAccent: '#0f172a',
  darkAccent: '#60a5fa',
}
const packageJsonPath = path.join(rootDir, 'package.json')
const APP_VERSION = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')).version || '0.1.0'
const GITHUB_REPO = 'monomo71/buckett'
const UPDATE_CACHE_TTL_MS = 10 * 60 * 1000
let updateCheckCache = {
  checkedAt: 0,
  data: {
    updateAvailable: null,
    latestVersion: null,
    status: 'unknown',
  },
}

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: HARD_MAX_FILE_SIZE_MB * 1024 * 1024 },
})

ensureDir(uploadsDir)
ensureDir(dataDir)
ensureDb()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/session', (req, res) => {
  const session = getSession(req)
  res.json({ authenticated: Boolean(session), username: session?.username ?? null })
})

app.post('/api/login', (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')
  const db = readDb()
  const user = db.users.find(
    (item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password,
  )

  if (!user) {
    return res.status(401).json({ error: 'Ongeldige login' })
  }

  const token = randomUUID()
  sessions.set(token, { userId: user.id, username: user.username, createdAt: new Date().toISOString() })
  setCookie(res, token)
  return res.json({ success: true })
})

app.post('/api/logout', (req, res) => {
  const token = getSessionToken(req)
  if (token) {
    sessions.delete(token)
  }

  clearCookie(res)
  res.json({ success: true })
})

app.use('/api', (req, res, next) => {
  if (['/health', '/session', '/login', '/logout'].includes(req.path)) {
    return next()
  }

  const session = getSession(req)
  if (!session) {
    return res.status(401).json({ error: 'Niet ingelogd' })
  }

  next()
})

app.get('/api/settings', (_req, res) => {
  const db = readDb()
  res.json({ settings: db.settings })
})

app.post('/api/settings', (req, res) => {
  const db = readDb()
  const language = String(req.body?.language ?? db.settings?.language ?? '').trim().toLowerCase()

  if (!language) {
    return res.status(400).json({ error: 'Taal ontbreekt' })
  }

  db.settings.language = language
  db.settings.upload = normalizeUploadSettings(req.body?.upload ?? db.settings?.upload)
  db.settings.theme = normalizeThemeSettings(req.body?.theme ?? db.settings?.theme)

  if (!db.settings.availableLanguages.includes(language)) {
    db.settings.availableLanguages.push(language)
  }

  const details = []
  if (req.body?.language) details.push(`taal ${language}`)
  if (req.body?.upload) details.push(`uploadmodus ${db.settings.upload.folderMode}`)
  if (req.body?.theme) details.push(`thema ${db.settings.theme.mode}`)

  logAction(req, db, 'settings', 'system', details.length > 0 ? `Instellingen bijgewerkt: ${details.join(', ')}` : 'Instellingen bijgewerkt')
  writeDb(db)
  return res.json({ settings: db.settings })
})

app.get('/api/users', (_req, res) => {
  const db = readDb()
  const users = db.users
    .map(({ password, ...user }) => user)
    .sort((a, b) => a.username.localeCompare(b.username, 'nl', { sensitivity: 'base' }))

  res.json({ users })
})

app.post('/api/users', (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')

  if (!username || !password) {
    return res.status(400).json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' })
  }

  const db = readDb()
  const exists = db.users.some((user) => user.username.toLowerCase() === username.toLowerCase())

  if (exists) {
    return res.status(400).json({ error: 'Gebruikersnaam bestaat al' })
  }

  const user = {
    id: randomUUID(),
    username,
    password,
    createdAt: new Date().toISOString(),
  }

  db.users.push(user)
  logAction(req, db, 'user-create', username, 'Nieuwe gebruiker aangemaakt')
  writeDb(db)
  return res.status(201).json({ user: { id: user.id, username: user.username, createdAt: user.createdAt } })
})

app.patch('/api/users/:id/password', (req, res) => {
  const password = String(req.body?.password ?? '').trim()
  if (!password) {
    return res.status(400).json({ error: 'Nieuw wachtwoord is verplicht' })
  }

  const db = readDb()
  const user = db.users.find((item) => item.id === req.params.id)

  if (!user) {
    return res.status(404).json({ error: 'Gebruiker niet gevonden' })
  }

  user.password = password
  logAction(req, db, 'user-password', user.username, 'Wachtwoord bijgewerkt')
  writeDb(db)
  return res.json({ success: true })
})

app.delete('/api/users/:id', (req, res) => {
  const db = readDb()
  const session = getSession(req)
  const userIndex = db.users.findIndex((user) => user.id === req.params.id)

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Gebruiker niet gevonden' })
  }

  if (db.users.length <= 1) {
    return res.status(400).json({ error: 'Er moet minimaal één gebruiker overblijven' })
  }

  if (session?.userId === req.params.id) {
    return res.status(400).json({ error: 'Je kunt jezelf niet verwijderen terwijl je bent ingelogd' })
  }

  const [user] = db.users.splice(userIndex, 1)
  logAction(req, db, 'user-delete', user.username, 'Gebruiker verwijderd')
  writeDb(db)
  return res.json({ success: true })
})

app.get('/api/activity', (_req, res) => {
  const db = readDb()
  const logs = [...db.logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json({ logs })
})

app.get('/api/system/status', async (_req, res) => {
  const db = readDb()
  const totalBytes = db.files.reduce((sum, file) => sum + Number(file.size || 0), 0)
  const updateInfo = await getUpdateInfo()

  res.json({
    status: {
      fileCount: db.files.length,
      totalBytes,
      health: 'online',
      version: APP_VERSION,
      updateAvailable: updateInfo.updateAvailable,
      latestVersion: updateInfo.latestVersion,
      updateStatus: updateInfo.status,
    },
  })
})

app.get('/api/projects', (_req, res) => {
  const db = readDb()
  const projects = [...db.projects].sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base', numeric: true }))
  res.json({ projects })
})

app.post('/api/projects', (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  if (!name) {
    return res.status(400).json({ error: 'Projectnaam is verplicht' })
  }

  const db = readDb()
  const slug = getUniqueProjectSlug(db, name)

  const project = {
    id: randomUUID(),
    name,
    slug,
    createdAt: new Date().toISOString(),
  }

  db.projects.push(project)
  logAction(req, db, 'project-create', project.name, 'Project toegevoegd')
  writeDb(db)
  return res.status(201).json({ project })
})

app.patch('/api/projects/:id', (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  if (!name) {
    return res.status(400).json({ error: 'Projectnaam is verplicht' })
  }

  const db = readDb()
  const project = db.projects.find((item) => item.id === req.params.id)

  if (!project) {
    return res.status(404).json({ error: 'Project niet gevonden' })
  }

  const oldName = project.name
  const oldSlug = project.slug
  const newSlug = getUniqueProjectSlug(db, name, project.id)

  if (oldName === name && oldSlug === newSlug) {
    return res.json({ project })
  }

  const oldProjectPath = path.join(uploadsDir, oldSlug)
  const newProjectPath = path.join(uploadsDir, newSlug)

  if (oldSlug !== newSlug && fs.existsSync(oldProjectPath)) {
    fs.renameSync(oldProjectPath, newProjectPath)
  }

  project.name = name
  project.slug = newSlug
  db.files = db.files.map((file) => {
    if (file.projectId !== project.id) {
      return file
    }

    return updateFileRecordPaths(req, newSlug, {
      ...file,
      projectName: name,
    })
  })

  logAction(req, db, 'project-rename', oldName, `Project hernoemd naar ${name}`)
  writeDb(db)
  return res.json({ project })
})

app.delete('/api/projects/:id', (req, res) => {
  const db = readDb()
  const projectIndex = db.projects.findIndex((project) => project.id === req.params.id)

  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project niet gevonden' })
  }

  const [project] = db.projects.splice(projectIndex, 1)
  db.files = db.files.filter((file) => file.projectId !== project.id)

  const projectPath = path.join(uploadsDir, project.slug)
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }

  logAction(req, db, 'project-delete', project.name, 'Project verwijderd')
  writeDb(db)
  return res.json({ success: true })
})

app.get('/api/projects/:id/download', (req, res) => {
  const db = readDb()
  const project = db.projects.find((item) => item.id === req.params.id)

  if (!project) {
    return res.status(404).json({ error: 'Project niet gevonden' })
  }

  const projectPath = path.join(uploadsDir, project.slug)
  return sendZip(res, projectPath, project.slug || project.name)
})

app.get('/api/files', (req, res) => {
  const projectId = String(req.query.projectId ?? '')
  const db = readDb()
  const files = db.files
    .filter((file) => !projectId || file.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json({ files })
})

app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    const projectId = String(req.body?.projectId ?? '')
    const incomingFiles = Array.isArray(req.files) ? req.files : []
    const db = readDb()
    const project = db.projects.find((item) => item.id === projectId)
    const uploadSettings = normalizeUploadSettings(db.settings?.upload)
    const relativePaths = toArray(req.body?.relativePaths)
    const requestedFolderName = String(req.body?.folderName ?? '').trim()
    const customFolderName = requestedFolderName ? sanitizeFolderName(requestedFolderName) : ''
    const maxSizeBytes = uploadSettings.maxFileSizeMB * 1024 * 1024
    const skipped = []

    if (!project) {
      return res.status(400).json({ error: 'Ongeldig project' })
    }

    if (incomingFiles.length === 0) {
      return res.status(400).json({ error: 'Geen bestanden ontvangen' })
    }

    const fileEntries = incomingFiles
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => {
        if (shouldIgnoreUploadFile(file)) {
          skipped.push({ name: file.originalname, reason: 'ignored' })
          return false
        }

        if (file.size > maxSizeBytes) {
          skipped.push({ name: file.originalname, reason: 'too-large' })
          return false
        }

        if (!isAllowedFileType(file, uploadSettings.allowedFileTypes)) {
          skipped.push({ name: file.originalname, reason: 'disallowed' })
          return false
        }

        return true
      })

    if (fileEntries.length === 0) {
      const reasons = [...new Set(skipped.map((item) => item.reason))]
      let errorMessage = 'Geen toegestane bestanden gevonden in deze upload'

      if (reasons.length === 1 && reasons[0] === 'too-large') {
        errorMessage = `Alle geselecteerde bestanden zijn groter dan ${uploadSettings.maxFileSizeMB} MB.`
      } else if (reasons.length === 1 && reasons[0] === 'disallowed') {
        errorMessage = 'De geselecteerde bestanden passen niet binnen de toegestane types.'
      } else if (reasons.length === 1 && reasons[0] === 'ignored') {
        errorMessage = 'Er zijn alleen verborgen systeembestanden gevonden.'
      }

      return res.status(400).json({ error: errorMessage, skipped })
    }

    const uploaded = fileEntries.map(({ file, index }) => {
      const originalName = sanitizeFileName(path.basename(file.originalname))
      const folder = resolveFolderName({
        fileName: originalName,
        relativePath: String(relativePaths[index] ?? ''),
        customFolderName,
        uploadSettings,
      })
      const projectDir = path.join(uploadsDir, project.slug)
      const folderDir = path.join(projectDir, folder)

      ensureDir(projectDir)
      ensureDir(folderDir)

      const targetPath = uniquePath(path.join(folderDir, originalName))
      fs.writeFileSync(targetPath, file.buffer)

      const relativeUrl = path.posix.join(
        '/uploads',
        encodeURIComponent(project.slug),
        encodeURIComponent(folder),
        encodeURIComponent(path.basename(targetPath)),
      )

      const baseUrl = getPublicBaseUrl(req)

      const record = {
        id: randomUUID(),
        projectId: project.id,
        projectName: project.name,
        folder,
        name: path.basename(targetPath),
        size: file.size,
        createdAt: new Date().toISOString(),
        url: `${baseUrl}${relativeUrl}`,
        relativeUrl,
        diskPath: targetPath,
      }

      db.files.unshift(record)
      return record
    })

    const foldersTouched = [...new Set(uploaded.map((file) => file.folder))].join(', ')
    const skippedSuffix = skipped.length > 0 ? `, ${skipped.length} overgeslagen` : ''
    logAction(req, db, 'upload', project.name, `${uploaded.length} bestand(en) geüpload naar ${foldersTouched}${skippedSuffix}`)
    writeDb(db)
    return res.status(201).json({ files: uploaded, skipped })
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Upload mislukt' })
  }
})

app.patch('/api/files/:id', (req, res) => {
  const db = readDb()
  const file = db.files.find((item) => item.id === req.params.id)

  if (!file) {
    return res.status(404).json({ error: 'Bestand niet gevonden' })
  }

  const project = db.projects.find((item) => item.id === file.projectId)
  if (!project) {
    return res.status(400).json({ error: 'Project niet gevonden' })
  }

  const nextName = normalizeRequestedFileName(req.body?.name, file.name)
  if (!nextName) {
    return res.status(400).json({ error: 'Nieuwe bestandsnaam ontbreekt' })
  }

  if (nextName !== file.name) {
    const targetPath = uniquePath(path.join(path.dirname(file.diskPath), nextName))
    if (fs.existsSync(file.diskPath)) {
      fs.renameSync(file.diskPath, targetPath)
    }

    file.name = path.basename(targetPath)
  }

  Object.assign(file, updateFileRecordPaths(req, project.slug, file))
  logAction(req, db, 'file-rename', file.projectName, `Bestand hernoemd naar ${file.name}`)
  writeDb(db)
  return res.json({ file })
})

app.delete('/api/files/:id', (req, res) => {
  const db = readDb()
  const fileIndex = db.files.findIndex((file) => file.id === req.params.id)

  if (fileIndex === -1) {
    return res.status(404).json({ error: 'Bestand niet gevonden' })
  }

  const [file] = db.files.splice(fileIndex, 1)
  if (fs.existsSync(file.diskPath)) {
    fs.unlinkSync(file.diskPath)
  }

  removeEmptyDirectory(path.dirname(file.diskPath))
  logAction(req, db, 'file-delete', file.name, `Bestand verwijderd uit ${file.projectName}`)
  writeDb(db)
  return res.json({ success: true })
})

app.post('/api/folders/rename', (req, res) => {
  const { projectId, oldFolder, newFolder } = req.body ?? {}
  const db = readDb()
  const project = db.projects.find((item) => item.id === projectId)
  const nextFolder = sanitizeFolderName(String(newFolder ?? '').trim())

  if (!project || !oldFolder || !nextFolder) {
    return res.status(400).json({ error: 'Project of mapnaam ontbreekt' })
  }

  if (oldFolder === nextFolder) {
    return res.json({ success: true, folder: nextFolder })
  }

  const oldFolderPath = path.join(uploadsDir, project.slug, oldFolder)
  const nextFolderPath = path.join(uploadsDir, project.slug, nextFolder)

  if (fs.existsSync(nextFolderPath)) {
    return res.status(400).json({ error: 'Deze mapnaam bestaat al' })
  }

  if (fs.existsSync(oldFolderPath)) {
    fs.renameSync(oldFolderPath, nextFolderPath)
  }

  db.files = db.files.map((file) => {
    if (!(file.projectId === projectId && file.folder === oldFolder)) {
      return file
    }

    return updateFileRecordPaths(req, project.slug, {
      ...file,
      folder: nextFolder,
    })
  })

  logAction(req, db, 'folder-rename', oldFolder, `Map hernoemd naar ${nextFolder}`)
  writeDb(db)
  return res.json({ success: true, folder: nextFolder })
})

app.post('/api/folders/delete', (req, res) => {
  const { projectId, folder } = req.body ?? {}
  const db = readDb()
  const project = db.projects.find((item) => item.id === projectId)

  if (!project || !folder) {
    return res.status(400).json({ error: 'Project of map ontbreekt' })
  }

  const folderPath = path.join(uploadsDir, project.slug, folder)
  db.files = db.files.filter((file) => !(file.projectId === projectId && file.folder === folder))

  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true })
  }

  logAction(req, db, 'folder-delete', folder, `Map verwijderd uit ${project.name}`)
  writeDb(db)
  return res.json({ success: true })
})

app.get('/api/folders/download', (req, res) => {
  const projectId = String(req.query.projectId ?? '')
  const folder = String(req.query.folder ?? '')
  const db = readDb()
  const project = db.projects.find((item) => item.id === projectId)

  if (!project || !folder) {
    return res.status(400).json({ error: 'Project of map ontbreekt' })
  }

  const folderPath = path.join(uploadsDir, project.slug, folder)
  return sendZip(res, folderPath, `${project.slug}-${folder}`)
})

app.get('/api/files/:id/download', (req, res) => {
  const db = readDb()
  const file = db.files.find((item) => item.id === req.params.id)

  if (!file || !fs.existsSync(file.diskPath)) {
    return res.status(404).json({ error: 'Bestand niet gevonden' })
  }

  return res.download(file.diskPath, file.name)
})

app.get('/api/export/csv', (req, res) => {
  const projectId = String(req.query.projectId ?? '')
  const db = readDb()
  const files = db.files.filter((file) => !projectId || file.projectId === projectId)
  const rows = [
    ['project', 'folder', 'bestandsnaam', 'url', 'grootte_bytes', 'uploaddatum'],
    ...files.map((file) => [file.projectName, file.folder, file.name, file.url, String(file.size), file.createdAt]),
  ]

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="afbeeldingen-export.csv"')
  res.send(csv)
})

app.get(/^(?!\/api|\/uploads).*/, (_req, res, next) => {
  const indexPath = path.join(distDir, 'index.html')

  if (!fs.existsSync(indexPath)) {
    return next()
  }

  return res.sendFile(indexPath)
})

app.use((error, _req, res, next) => {
  if (!error) {
    return next()
  }

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: `Bestand te groot. Maximaal ${HARD_MAX_FILE_SIZE_MB} MB per bestand.` })
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message || 'Upload mislukt' })
  }

  console.error(error)
  return res.status(500).json({ error: 'Interne serverfout tijdens upload' })
})

app.listen(3001, () => {
  console.log('API draait op http://localhost:3001')
})

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true })
}

function ensureDb() {
  const defaults = getDefaultDb()

  if (!fs.existsSync(dbPath)) {
    writeDb(defaults)
    return
  }

  const current = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
  const next = {
    projects: Array.isArray(current.projects) ? current.projects : [],
    files: Array.isArray(current.files) ? current.files : [],
    users: Array.isArray(current.users) && current.users.length > 0 ? current.users : defaults.users,
    settings: {
      ...defaults.settings,
      ...(current.settings ?? {}),
      availableLanguages: Array.isArray(current.settings?.availableLanguages) && current.settings.availableLanguages.length > 0
        ? current.settings.availableLanguages
        : defaults.settings.availableLanguages,
      upload: normalizeUploadSettings(current.settings?.upload),
      theme: normalizeThemeSettings(current.settings?.theme),
    },
    logs: Array.isArray(current.logs) ? current.logs : [],
  }

  writeDb(next)
}

function getDefaultDb() {
  return {
    projects: [],
    files: [],
    users: [
      {
        id: randomUUID(),
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        createdAt: new Date().toISOString(),
      },
    ],
    settings: {
      language: 'nl',
      availableLanguages: ['nl', 'en', 'de'],
      upload: getDefaultUploadSettings(),
      theme: getDefaultThemeSettings(),
    },
    logs: [],
  }
}

function readDb() {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
  const projectSlugById = new Map((Array.isArray(db.projects) ? db.projects : []).map((project) => [project.id, project.slug]))
  let changed = false

  db.files = (Array.isArray(db.files) ? db.files : []).map((file) => {
    const projectSlug = projectSlugById.get(file.projectId)
    if (!projectSlug) {
      return file
    }

    const nextFile = updateFileRecordPaths(null, projectSlug, file)
    if (nextFile.relativeUrl !== file.relativeUrl || nextFile.url !== file.url || nextFile.diskPath !== file.diskPath) {
      changed = true
    }

    return nextFile
  })

  if (changed) {
    writeDb(db)
  }

  return db
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'project'
}

function getUniqueProjectSlug(db, name, excludeProjectId = null) {
  const slugBase = slugify(name)
  let slug = slugBase
  let index = 1

  while (db.projects.some((project) => project.slug === slug && project.id !== excludeProjectId)) {
    index += 1
    slug = `${slugBase}-${index}`
  }

  return slug
}

function getDefaultUploadSettings() {
  return {
    folderMode: DEFAULT_UPLOAD_SETTINGS.folderMode,
    autoFolderStrategy: DEFAULT_UPLOAD_SETTINGS.autoFolderStrategy,
    allowedFileTypes: [...DEFAULT_UPLOAD_SETTINGS.allowedFileTypes],
    maxFileSizeMB: DEFAULT_UPLOAD_SETTINGS.maxFileSizeMB,
  }
}

function getDefaultThemeSettings() {
  return {
    mode: DEFAULT_THEME_SETTINGS.mode,
    lightAccent: DEFAULT_THEME_SETTINGS.lightAccent,
    darkAccent: DEFAULT_THEME_SETTINGS.darkAccent,
  }
}

function normalizeUploadSettings(uploadSettings) {
  const next = getDefaultUploadSettings()
  const folderMode = String(uploadSettings?.folderMode ?? '').trim()
  const autoFolderStrategy = String(uploadSettings?.autoFolderStrategy ?? '').trim()
  const normalizedTypes = Array.isArray(uploadSettings?.allowedFileTypes)
    ? uploadSettings.allowedFileTypes.flatMap((type) => {
      if (type === 'pdf') return ['documents']
      if (type === 'zip') return ['archives']
      return [type]
    }).filter((type) => ['images', 'documents', 'archives'].includes(type))
    : []
  const maxFileSizeMB = Number(uploadSettings?.maxFileSizeMB ?? next.maxFileSizeMB)

  if (['auto', 'preserve', 'prompt'].includes(folderMode)) {
    next.folderMode = folderMode
  }

  if (['strip-number', 'remove-last-segment', 'full-name'].includes(autoFolderStrategy)) {
    next.autoFolderStrategy = autoFolderStrategy
  }

  next.allowedFileTypes = normalizedTypes.length > 0 ? [...new Set(normalizedTypes)] : [...DEFAULT_UPLOAD_SETTINGS.allowedFileTypes]
  next.maxFileSizeMB = Number.isFinite(maxFileSizeMB)
    ? Math.max(1, Math.min(HARD_MAX_FILE_SIZE_MB, Math.round(maxFileSizeMB)))
    : DEFAULT_UPLOAD_SETTINGS.maxFileSizeMB

  return next
}

function normalizeThemeSettings(themeSettings) {
  const next = getDefaultThemeSettings()
  const mode = String(themeSettings?.mode ?? '').trim()
  const lightAccent = String(themeSettings?.lightAccent ?? '').trim()
  const darkAccent = String(themeSettings?.darkAccent ?? '').trim()

  if (['light', 'dark', 'system'].includes(mode)) {
    next.mode = mode
  }

  if (/^#[0-9a-fA-F]{6}$/.test(lightAccent)) {
    next.lightAccent = lightAccent
  }

  if (/^#[0-9a-fA-F]{6}$/.test(darkAccent)) {
    next.darkAccent = darkAccent
  }

  return next
}

function getFolderName(fileName, strategy = 'strip-number') {
  const extension = path.extname(fileName)
  const baseName = path.basename(fileName, extension)

  if (strategy === 'full-name') {
    return sanitizeFolderName(baseName)
  }

  if (strategy === 'remove-last-segment') {
    const trimmed = baseName.replace(/([_\-\s])[^_\-\s]+$/, '')
    return sanitizeFolderName(trimmed || baseName)
  }

  return sanitizeFolderName(baseName.replace(/([_\-])\d+$/, '') || baseName)
}

function getFolderFromRelativePath(relativePath) {
  const parts = String(relativePath ?? '')
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean)

  if (parts.length <= 1) {
    return ''
  }

  return sanitizeFolderName(parts[0])
}

function resolveFolderName({ fileName, relativePath, customFolderName, uploadSettings }) {
  if (customFolderName) {
    return customFolderName
  }

  if (uploadSettings.folderMode === 'preserve') {
    const preserved = getFolderFromRelativePath(relativePath)
    if (preserved) {
      return preserved
    }
  }

  return getFolderName(fileName, uploadSettings.autoFolderStrategy)
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._\-]/g, '_')
}

function normalizeRequestedFileName(nextName, currentName) {
  const trimmed = String(nextName ?? '').trim()
  if (!trimmed) {
    return ''
  }

  const currentExtension = path.extname(currentName)
  const requestedExtension = path.extname(trimmed)
  return sanitizeFileName(requestedExtension ? trimmed : `${trimmed}${currentExtension}`)
}

function sanitizeFolderName(folderName) {
  return folderName
    .replace(/[/\\]+/g, '-')
    .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
    .trim() || 'upload'
}

function shouldIgnoreUploadFile(file) {
  const fileName = path.basename(String(file.originalname ?? '')).trim()
  return !fileName || fileName.startsWith('.') || fileName === 'Thumbs.db'
}

function isAllowedFileType(file, allowedFileTypes) {
  const extension = path.extname(String(file.originalname ?? '')).toLowerCase()
  const mimetype = String(file.mimetype ?? '').toLowerCase()
  const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff', '.avif', '.heic', '.heif', '.ico'])
  const documentExtensions = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.txt', '.rtf', '.odt', '.ods', '.odp', '.gdoc', '.gsheet', '.gslides'])
  const archiveExtensions = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2', '.xz'])

  if (allowedFileTypes.includes('images') && (mimetype.startsWith('image/') || imageExtensions.has(extension))) {
    return true
  }

  if (
    allowedFileTypes.includes('documents')
    && (
      documentExtensions.has(extension)
      || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'].some((type) => mimetype.startsWith(type))
      || mimetype.includes('spreadsheet')
      || mimetype.includes('presentation')
      || mimetype.startsWith('text/')
    )
  ) {
    return true
  }

  if (
    allowedFileTypes.includes('archives')
    && (
      archiveExtensions.has(extension)
      || mimetype.includes('zip')
      || mimetype.includes('rar')
      || mimetype.includes('7z')
      || mimetype.includes('compressed')
    )
  ) {
    return true
  }

  return false
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (value === undefined || value === null || value === '') {
    return []
  }

  return [value]
}

function buildRelativeUrl(projectSlug, folder, fileName) {
  return path.posix.join(
    '/uploads',
    encodeURIComponent(projectSlug),
    encodeURIComponent(folder),
    encodeURIComponent(fileName),
  )
}

function getPublicBaseUrl(req) {
  const configured = String(process.env.PUBLIC_BASE_URL ?? '').trim().replace(/\/+$/, '')
  if (configured) {
    return configured
  }

  if (req) {
    return `${req.protocol}://${req.get('host')}`
  }

  return ''
}

async function getLatestTagVersion() {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/tags`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Buckett',
    },
  })

  if (!response.ok) {
    return null
  }

  const payload = await response.json()
  const firstTag = Array.isArray(payload) ? payload[0] : null
  return String(firstTag?.name ?? '').trim().replace(/^v/i, '') || null
}

async function getUpdateInfo() {
  const now = Date.now()
  if (now - updateCheckCache.checkedAt < UPDATE_CACHE_TTL_MS) {
    return updateCheckCache.data
  }

  const fallback = {
    updateAvailable: null,
    latestVersion: null,
    status: 'unknown',
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Buckett',
      },
    })

    let latestVersion = null

    if (response.status === 404) {
      latestVersion = await getLatestTagVersion()
      if (!latestVersion) {
        updateCheckCache = {
          checkedAt: now,
          data: {
            updateAvailable: false,
            latestVersion: null,
            status: 'none',
          },
        }
        return updateCheckCache.data
      }
    } else if (!response.ok) {
      updateCheckCache = { checkedAt: now, data: fallback }
      return updateCheckCache.data
    } else {
      const payload = await response.json()
      latestVersion = String(payload.tag_name ?? payload.name ?? '').trim().replace(/^v/i, '')
    }

    if (!latestVersion) {
      updateCheckCache = { checkedAt: now, data: fallback }
      return updateCheckCache.data
    }

    const updateAvailable = compareVersions(latestVersion, APP_VERSION) > 0
    updateCheckCache = {
      checkedAt: now,
      data: {
        updateAvailable,
        latestVersion,
        status: updateAvailable ? 'available' : 'current',
      },
    }

    return updateCheckCache.data
  } catch {
    updateCheckCache = { checkedAt: now, data: fallback }
    return updateCheckCache.data
  }
}

function compareVersions(left, right) {
  const leftParts = String(left).split('.').map((value) => Number.parseInt(value, 10) || 0)
  const rightParts = String(right).split('.').map((value) => Number.parseInt(value, 10) || 0)
  const maxLength = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0)
    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

function updateFileRecordPaths(req, projectSlug, file) {
  const relativeUrl = buildRelativeUrl(projectSlug, file.folder, file.name)
  const baseUrl = getPublicBaseUrl(req)

  return {
    ...file,
    relativeUrl,
    url: baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl,
    diskPath: path.join(uploadsDir, projectSlug, file.folder, file.name),
  }
}

function uniquePath(filePath) {
  if (!fs.existsSync(filePath)) {
    return filePath
  }

  const extension = path.extname(filePath)
  const baseName = path.basename(filePath, extension)
  const directory = path.dirname(filePath)
  let counter = 2
  let nextPath = path.join(directory, `${baseName}-${counter}${extension}`)

  while (fs.existsSync(nextPath)) {
    counter += 1
    nextPath = path.join(directory, `${baseName}-${counter}${extension}`)
  }

  return nextPath
}

function removeEmptyDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return
  }

  const items = fs.readdirSync(directory)
  if (items.length === 0) {
    fs.rmdirSync(directory)
  }
}

function getSession(req) {
  const token = getSessionToken(req)
  return token ? sessions.get(token) : null
}

function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie)
  return cookies.cdn_admin_session
}

function parseCookies(header = '') {
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=')
      if (index === -1) return acc
      const key = decodeURIComponent(part.slice(0, index))
      const value = decodeURIComponent(part.slice(index + 1))
      acc[key] = value
      return acc
    }, {})
}

function setCookie(res, token) {
  res.setHeader('Set-Cookie', `cdn_admin_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`)
}

function clearCookie(res) {
  res.setHeader('Set-Cookie', 'cdn_admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0')
}

function logAction(req, db, action, target, details = '') {
  const session = getSession(req)
  db.logs.unshift({
    id: randomUUID(),
    user: session?.username ?? 'Onbekend',
    action,
    target,
    details,
    createdAt: new Date().toISOString(),
  })

  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500)
  }
}

function sendZip(res, sourcePath, archiveName) {
  if (!fs.existsSync(sourcePath)) {
    return res.status(404).json({ error: 'Downloadbron niet gevonden' })
  }

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeArchiveName(archiveName)}.zip"`)

  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download mislukt' })
    } else {
      res.end()
    }
  })

  archive.pipe(res)
  archive.directory(sourcePath, false)
  archive.finalize()
}

function sanitizeArchiveName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, '_')
}
