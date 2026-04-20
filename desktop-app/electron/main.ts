import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { WhatsAppService } from './whatsapp'

const __dirname = dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let waService: WhatsAppService | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: false, 
    },
  })

  // Setup WhatsApp Service
  waService = new WhatsAppService(win)
  waService.initialize()

  // IPC Handlers
  ipcMain.handle('wa-get-status', () => {
    return waService?.getStatus()
  })

  ipcMain.handle('wa-send-message', async (_event, number: string, text: string, attachmentPath?: string) => {
    return await waService?.sendMessage(number, text, attachmentPath)
  })

  ipcMain.handle('wa-get-chats', async () => {
    return await waService?.getChats()
  })

  ipcMain.handle('wa-get-group-members', async (_event, groupId: string) => {
    return await waService?.getGroupMembers(groupId)
  })

  ipcMain.handle('wa-join-group', async (_event, inviteCode: string) => {
    return await waService?.joinGroup(inviteCode)
  })

  ipcMain.handle('wa-add-participants', async (_event, groupId: string, participantNumbers: string[]) => {
    return await waService?.addParticipantsToGroup(groupId, participantNumbers)
  })

  ipcMain.handle('wa-check-number', async (_event, number: string) => {
    return await waService?.checkNumber(number)
  })

  ipcMain.handle('wa-set-auto-responder', async (_event, rules: any[]) => {
    waService?.setAutoResponderRules(rules)
    return { success: true }
  })

  ipcMain.handle('wa-logout', async () => {
    await waService?.logout()
    return { success: true }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(RENDERER_DIST, 'index.html'))
  }
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

app.whenReady().then(createWindow)
