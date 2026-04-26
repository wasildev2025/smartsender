import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

// -----------------------------------------------------------------
// Auto-update bootstrap.
//
// electron-updater pulls release artifacts from the `publish` URL configured
// in package.json (currently https://updates.smartsender.app/). Behavior:
//
//   * Skip entirely when not packaged (`npm run dev`).
//   * Check once at startup (after a short delay so we don't slow boot).
//   * Re-check every 6 hours while the app is running.
//   * Download in the background; install on next quit (default behavior).
//   * Forward update events to the renderer over `app-update` so the UI can
//     surface "an update is being installed" toasts.
//
// Logging is intentionally noisy — auto-update bugs are silent killers in the
// field, and main-process console output goes to the system log via Electron.
// -----------------------------------------------------------------

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

export function setupAutoUpdater(win: BrowserWindow | null) {
  if (!app.isPackaged) {
    console.log('[updater] skipped: not running a packaged build')
    return
  }

  // Allow downgrades only if the publish channel says so. By default
  // electron-updater refuses; that's correct for production.
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  const notify = (channel: string, payload: unknown) => {
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] checking for update')
    notify('app-update', { status: 'checking' })
  })
  autoUpdater.on('update-available', info => {
    console.log('[updater] update-available', info?.version)
    notify('app-update', { status: 'available', version: info?.version })
  })
  autoUpdater.on('update-not-available', () => {
    notify('app-update', { status: 'up-to-date' })
  })
  autoUpdater.on('download-progress', p => {
    notify('app-update', { status: 'downloading', percent: p.percent })
  })
  autoUpdater.on('update-downloaded', info => {
    console.log('[updater] downloaded', info?.version)
    notify('app-update', { status: 'ready', version: info?.version })
  })
  autoUpdater.on('error', err => {
    console.error('[updater] error', err)
    notify('app-update', { status: 'error', message: err?.message })
  })

  // Initial check — defer briefly so app launch isn't competing for bandwidth.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => console.error('[updater] initial check failed', err))
  }, 30_000)

  setInterval(() => {
    autoUpdater.checkForUpdates().catch(err => console.error('[updater] periodic check failed', err))
  }, SIX_HOURS_MS)
}
