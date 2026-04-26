import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { WhatsAppService } from './whatsapp'
import { StorageService } from './storage'
import { Schemas } from './ipc-schemas'
import { LicenseManager, guardAgainstPlaceholderKey } from './license'
import { setupAutoUpdater } from './updater'
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

// Injected by vite.config.ts at build time so packaged binaries don't depend
// on runtime env vars. Override via SS_API_URL when running `npm run dev`.
declare const __SS_API_URL__: string
const API_ORIGIN = process.env.SS_API_URL ?? __SS_API_URL__

// CSP for the renderer.
//
// In dev, Vite's HMR runtime needs 'unsafe-eval' to evaluate hot updates;
// production builds emit static JS and don't need it. Keep the loose policy
// scoped to dev so the packaged app gets a meaningfully tighter CSP.
//
// 'unsafe-inline' for scripts is unfortunately still required by some React
// dev runtime injections; tightening that further (nonces) is a follow-up.
//
// connect-src deliberately does not whitelist Supabase: the renderer does not
// talk to Supabase — only the main process does, via Node fetch (CSP doesn't
// apply there). Anything reaching Supabase from the renderer would be a bug.
const isDev = !!VITE_DEV_SERVER_URL
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'"

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN}`,
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
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
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
  if (!storage) storage = new StorageService()
  if (!waService && win) {
    waService = new WhatsAppService(win)
    waService.initialize()
    // Restore persisted auto-responder rules so the rules a user saved before
    // restart actually fire after restart. Best-effort — failures are logged
    // but don't block the WA client from starting.
    storage!.getAutoResponderRules()
      .then(rules => waService!.setAutoResponderRules(rules))
      .catch(err => console.error('Failed to load auto-responder rules', err))
  }
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

/**
 * Wrap a no-args IPC handler in the same try/catch envelope as safeHandle, so
 * a thrown error reaches the renderer as `{ success: false, error }` rather
 * than rejecting the renderer-side `await` with an opaque IPC failure.
 */
function safeHandleVoid(channel: string, fn: () => unknown | Promise<unknown>) {
  ipcMain.handle(channel, async () => {
    try {
      return await fn()
    } catch (err: any) {
      console.error(`[ipc] ${channel} failed:`, err)
      return { success: false, error: err?.message || 'internal_error' }
    }
  })
}

function registerIpc() {
  // ------- WhatsApp handlers (validated) -------

  safeHandleVoid('wa-get-status', () => waService?.getStatus())
  safeHandleVoid('wa-get-chats', () => waService!.getChats())
  safeHandleVoid('wa-logout', async () => {
    await waService?.logout()
    return { success: true }
  })

  safeHandle('wa-send-message', Schemas.SendMessage,
    ([number, text]) => waService!.sendMessage(number, text),
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

  safeHandle('wa-set-auto-responder', Schemas.AutoResponderRules, async ([rules]) => {
    waService?.setAutoResponderRules(rules)
    // Persist alongside the in-memory copy so they survive restarts.
    await storage?.setAutoResponderRules(rules as any)
    return { success: true }
  }, { feature: 'wa_auto_responder' })

  safeHandleVoid('wa-get-auto-responder', async () => {
    return (await storage?.getAutoResponderRules()) ?? []
  })

  // ------- License -------
  safeHandle('license-activate', Schemas.LicenseKey, async ([key]) => {
    return licenseManager.activate(key)
  })
  safeHandleVoid('license-status', () => licenseManager.status())
  safeHandleVoid('license-deactivate', () => licenseManager.deactivate())

  // ------- System -------
  safeHandleVoid('get-machine-id', async () => {
    try {
      const mod: any = await import('node-machine-id')
      return mod.machineIdSync ? mod.machineIdSync() : mod.default?.machineIdSync?.()
    } catch {
      return null
    }
  })

  // ------- Local storage -------
  safeHandleVoid('db-get-dashboard-data', () => storage?.getDashboardData())
  safeHandle('db-record-campaign', Schemas.Campaign,
    ([campaign]) => storage?.recordCampaign(campaign as any))
  safeHandle('db-increment-sent', Schemas.IncrementSent,
    ([n]) => storage?.incrementTotalSent(n))
  safeHandle('db-delete-campaign', Schemas.CampaignId,
    ([id]) => storage?.deleteCampaign(id))
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
  // Refuse to start a packaged build that ships the dev placeholder key.
  // Better to fail loudly here than to silently reject every license activation.
  try {
    guardAgainstPlaceholderKey()
  } catch (err) {
    console.error(err)
    app.exit(1)
    return
  }

  installSecurityHeaders()
  await licenseManager.load() // restore from disk before IPC is live
  createWindow()
  initServices()
  registerIpc()
  setupAutoUpdater(win)

  // Periodically sync license in the background (every hour)
  setInterval(async () => {
    const status = await licenseManager.sync()
    if (win) win.webContents.send('license-updated', status)
  }, 60 * 60 * 1000)
  
  // Initial sync shortly after start
  setTimeout(async () => {
    const status = await licenseManager.sync()
    if (win) win.webContents.send('license-updated', status)
  }, 5000)
})
