import { ipcRenderer, contextBridge } from 'electron'

// ------------------------------------------------------------------
// Typed API surface exposed to the renderer.
//
// The renderer can ONLY reach the main process through these named
// methods. It cannot pass an arbitrary channel name to `invoke` or
// subscribe to arbitrary events. This is the single chokepoint.
// ------------------------------------------------------------------

type WaStatus = {
  status: 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATED' | 'READY'
  qr?: string
  number?: string | null
  info?: unknown
  error?: string
  reason?: string
}

type Unsubscribe = () => void

const on = <T>(channel: string, cb: (payload: T) => void): Unsubscribe => {
  const handler = (_: Electron.IpcRendererEvent, payload: T) => cb(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.off(channel, handler)
}

const api = {
  wa: {
    getStatus:            ()                                                                => ipcRenderer.invoke('wa-get-status'),
    sendMessage:          (number: string, text: string, attachmentPath?: string)          => ipcRenderer.invoke('wa-send-message', number, text, attachmentPath),
    sendPoll:             (number: string, question: string, options: string[], allowMultiple?: boolean) => ipcRenderer.invoke('wa-send-poll', number, question, options, allowMultiple ?? false),
    getChats:             ()                                                                => ipcRenderer.invoke('wa-get-chats'),
    getGroupMembers:      (groupId: string)                                                 => ipcRenderer.invoke('wa-get-group-members', groupId),
    joinGroup:            (inviteCode: string)                                              => ipcRenderer.invoke('wa-join-group', inviteCode),
    createGroup:          (name: string, numbers: string[])                                 => ipcRenderer.invoke('wa-create-group', name, numbers),
    addParticipants:      (groupId: string, numbers: string[])                              => ipcRenderer.invoke('wa-add-participants', groupId, numbers),
    removeParticipants:   (groupId: string, numbers: string[])                              => ipcRenderer.invoke('wa-remove-participants', groupId, numbers),
    leaveGroup:           (groupId: string)                                                 => ipcRenderer.invoke('wa-leave-group', groupId),
    checkNumber:          (number: string)                                                  => ipcRenderer.invoke('wa-check-number', number),
    setAutoResponder:     (rules: unknown[])                                                => ipcRenderer.invoke('wa-set-auto-responder', rules),
    logout:               ()                                                                => ipcRenderer.invoke('wa-logout'),
    onStatus:             (cb: (s: WaStatus) => void): Unsubscribe                          => on<WaStatus>('wa-status', cb),
  },

  db: {
    getDashboardData:     ()                                                                => ipcRenderer.invoke('db-get-dashboard-data'),
    recordCampaign:       (c: unknown)                                                      => ipcRenderer.invoke('db-record-campaign', c),
    incrementSent:        (n: number)                                                       => ipcRenderer.invoke('db-increment-sent', n),
  },

  license: {
    activate:             (key: string)                                                     => ipcRenderer.invoke('license-activate', key),
    status:               ()                                                                => ipcRenderer.invoke('license-status'),
    deactivate:           ()                                                                => ipcRenderer.invoke('license-deactivate'),
    onUpdate:             (cb: (s: any) => void): Unsubscribe                               => on<any>('license-updated', cb),
  },

  system: {
    getMachineId:         ()                                                                => ipcRenderer.invoke('get-machine-id'),
  },
} as const

contextBridge.exposeInMainWorld('smartsender', api)

export type SmartsenderApi = typeof api
