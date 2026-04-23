import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { WhatsAppService } from './whatsapp'
import { StorageService } from './storage'
import { Schemas, ensureAttachmentDir } from './ipc-schemas'
import { LicenseManager } from './license'
import { z, type ZodType } from 'zod'

const __dirname = dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = join(__dirname, '..')

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
});

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const API_ORIGIN = process.env.SS_API_URL ?? 'https://smartsender.vercel.app'

const CSP = [
  "default-src 'self'",
  VITE_DEV_SERVER_URL
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VITE_DEV_SERVER_URL}`
    : "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN}${VITE_DEV_SERVER_URL ? ` ${VITE_DEV_SERVER_URL} ws://localhost:* ws://127.0.0.1:*` : ''}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

function installSecurityHeaders() {
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'Referrer-Policy': ['no-referrer'],
      },
    })
  })

  // Block permission escalation from the renderer.
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))
  session.defaultSession.setPermissionCheckHandler(() => false)
}

let win: BrowserWindow | null
let waService: WhatsAppService | null = null
let storage: StorageService | null = null
const licenseManager = new LicenseManager(API_ORIGIN)

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      spellcheck: false,
    },
  })

  // Block new-window requests; route external http(s) links to the OS browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url)
      if (u.protocol === 'https:' || u.protocol === 'http:') shell.openExternal(url)
    } catch { /* ignore */ }
    return { action: 'deny' }
  })

  // Prevent navigation away from the app origin.
  win.webContents.on('will-navigate', (e, url) => {
    try {
      const u = new URL(url)
      const allowed =
        (VITE_DEV_SERVER_URL && url.startsWith(VITE_DEV_SERVER_URL)) ||
        u.protocol === 'file:'
      if (!allowed) e.preventDefault()
    } catch {
      e.preventDefault()
    }
  })

  // Refuse webview creation entirely.
  win.webContents.on('will-attach-webview', (e) => e.preventDefault())

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(RENDERER_DIST, 'index.html'))
  }
}

function initServices() {
  if (!waService && win) {
    waService = new WhatsAppService(win)
    waService.initialize()
  }
  if (!storage) storage = new StorageService()
}

type Handler<S extends ZodType> = (args: z.infer<S>) => unknown | Promise<unknown>

type HandleOpts = { feature?: string }

/**
 * Register a validated IPC handler. Any payload that fails the schema is
 * rejected with a generic error — never leaks parser details to the renderer.
 * If `feature` is supplied the license manager must currently grant it.
 */
function safeHandle<S extends ZodType>(channel: string, schema: S, fn: Handler<S>, opts: HandleOpts = {}) {
  ipcMain.handle(channel, async (_e, ...raw: unknown[]) => {
    if (opts.feature && !licenseManager.hasFeature(opts.feature)) {
      return { success: false, error: 'license_required' }
    }
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      console.warn(`[ipc] rejected ${channel}:`, parsed.error.issues.map(i => i.message).join('; '))
      return { success: false, error: 'invalid_arguments' }
    }
    try {
      return await fn(parsed.data as z.infer<S>)
    } catch (err: any) {
      console.error(`[ipc] ${channel} failed:`, err)
      return { success: false, error: err?.message || 'internal_error' }
    }
  })
}

function registerIpc() {
  // ------- WhatsApp handlers (validated) -------

  ipcMain.handle('wa-get-status', () => waService?.getStatus())
  ipcMain.handle('wa-get-chats', () => waService?.getChats())
  ipcMain.handle('wa-logout', async () => {
    await waService?.logout()
    return { success: true }
  })

  safeHandle('wa-send-message', Schemas.SendMessage,
    ([number, text, attachmentPath]) => waService!.sendMessage(number, text, attachmentPath),
    { feature: 'wa_send' })

  safeHandle('wa-send-poll', Schemas.SendPoll,
    ([number, q, opts, allowMulti]) => waService!.sendPoll(number, q, opts, allowMulti),
    { feature: 'wa_send' })

  safeHandle('wa-get-group-members', Schemas.GroupId,
    ([gid]) => waService!.getGroupMembers(gid),
    { feature: 'wa_extract' })

  safeHandle('wa-join-group', Schemas.JoinGroup,
    ([code]) => waService!.joinGroup(code),
    { feature: 'wa_group_add' })

  safeHandle('wa-add-participants', Schemas.GroupParticipants,
    ([gid, nums]) => waService!.addParticipantsToGroup(gid, nums),
    { feature: 'wa_group_add' })

  safeHandle('wa-create-group', Schemas.CreateGroup,
    ([name, nums]) => waService!.createGroup(name, nums),
    { feature: 'wa_group_add' })

  safeHandle('wa-remove-participants', Schemas.GroupParticipants,
    ([gid, nums]) => waService!.removeParticipantsFromGroup(gid, nums),
    { feature: 'wa_group_add' })

  safeHandle('wa-leave-group', Schemas.GroupId,
    ([gid]) => waService!.leaveGroup(gid))

  safeHandle('wa-check-number', Schemas.CheckNumber,
    ([number]) => waService!.checkNumber(number),
    { feature: 'wa_validate' })

  safeHandle('wa-set-auto-responder', Schemas.AutoResponderRules, ([rules]) => {
    waService?.setAutoResponderRules(rules)
    return { success: true }
  }, { feature: 'wa_auto_responder' })

  // ------- License -------
  safeHandle('license-activate', Schemas.LicenseKey, async ([key]) => {
    return licenseManager.activate(key)
  })
  ipcMain.handle('license-status', () => licenseManager.status())
  ipcMain.handle('license-deactivate', () => licenseManager.deactivate())

  // ------- System -------
  ipcMain.handle('get-machine-id', async () => {
    try {
      const mod: any = await import('node-machine-id')
      return mod.machineIdSync ? mod.machineIdSync() : mod.default?.machineIdSync?.()
    } catch {
      return null
    }
  })

  // ------- Local storage -------
  ipcMain.handle('db-get-dashboard-data', () => storage?.getDashboardData())
  safeHandle('db-record-campaign', Schemas.Campaign,
    ([campaign]) => storage?.recordCampaign(campaign as any))
  safeHandle('db-increment-sent', Schemas.IncrementSent,
    ([n]) => storage?.incrementTotalSent(n))
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  ensureAttachmentDir()
  installSecurityHeaders()
  await licenseManager.load() // restore from disk before IPC is live
  createWindow()
  initServices()
  registerIpc()
})
