import log from 'electron-log/main'
import { app } from 'electron'

// Centralised logger for the main process.
//
// Without this, every `console.error` in a packaged build vanishes — Electron
// detaches stdio from the OS console on Windows and macOS GUI launches.
// electron-log writes to a rotating file under userData/logs/, which is the
// only thing support engineers can ask users to attach to a bug report.
//
// Format: `[level] timestamp module: message`. JSON formatting was rejected
// because users sometimes need to grep these by hand.

let initialized = false

export function initLogger() {
  if (initialized) return
  initialized = true

  log.initialize() // wires renderer logs through to main

  // 5 MB per file, keep last 5 — generous for a desktop app.
  log.transports.file.maxSize = 5 * 1024 * 1024
  log.transports.file.format = '[{level}] {iso} {scope}: {text}'
  log.transports.console.format = '[{level}] {scope}: {text}'
  log.transports.file.level = app.isPackaged ? 'info' : 'debug'
  log.transports.console.level = app.isPackaged ? 'warn' : 'debug'

  // Forward unhandled rejections so we don't lose them.
  process.on('unhandledRejection', reason => {
    log.error('unhandledRejection', reason)
  })
  process.on('uncaughtException', err => {
    log.error('uncaughtException', err)
  })

  // Hijack the global console so existing `console.error / console.log` calls
  // throughout the codebase start writing to the rotating log file too. We
  // can rewrite them to scoped loggers gradually; in the meantime this gives
  // immediate observability for free.
  Object.assign(console, log.functions)

  log.info('Logger initialised. Path:', log.transports.file.getFile().path)
}

export function scoped(scope: string) {
  return log.scope(scope)
}

export default log
