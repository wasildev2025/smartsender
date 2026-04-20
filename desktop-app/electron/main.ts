import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { WhatsAppService } from './whatsapp'
import { StorageService } from './storage'

const __dirname = dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = join(__dirname, '..')

// Handle startup errors
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
});

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let waService: WhatsAppService | null = null
let storage: StorageService | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: true, 
    },
  })

  // Setup Services
  waService = new WhatsAppService(win)
  waService.initialize()
  storage = new StorageService()

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

  ipcMain.handle('wa-add-participants', (_event, groupId, numbers) => {
    return waService?.addParticipantsToGroup(groupId, numbers)
  })

  ipcMain.handle('wa-create-group', (_event, name, numbers) => {
    return waService?.createGroup(name, numbers)
  })

  ipcMain.handle('wa-remove-participants', (_event, groupId, numbers) => {
    return waService?.removeParticipantsFromGroup(groupId, numbers)
  })

  ipcMain.handle('wa-leave-group', (_event, groupId) => {
    return waService?.leaveGroup(groupId)
  })

  ipcMain.handle('wa-check-number', async (_event, number: string) => {
    return await waService?.checkNumber(number)
  })

  ipcMain.handle('wa-send-poll', (_event, number, question, options, allowMultiple) => {
    return waService?.sendPoll(number, question, options, allowMultiple)
  })

  ipcMain.handle('wa-set-auto-responder', async (_event, rules: any[]) => {
    waService?.setAutoResponderRules(rules)
    return { success: true }
  })

  ipcMain.handle('wa-logout', async () => {
    await waService?.logout()
    return { success: true }
  })

  ipcMain.handle('get-machine-id', async () => {
    const { machineIdSync } = await import('node-machine-id')
    return machineIdSync()
  })

  // Storage Handlers
  ipcMain.handle('db-get-dashboard-data', async () => {
    return await storage?.getDashboardData()
  })

  ipcMain.handle('db-record-campaign', async (_event, campaign: any) => {
    return await storage?.recordCampaign(campaign)
  })

  ipcMain.handle('db-increment-sent', async (_event, amount: number) => {
    return await storage?.incrementTotalSent(amount)
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
