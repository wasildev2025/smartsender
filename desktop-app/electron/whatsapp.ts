import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, Poll } = pkg;
import qrcode from 'qrcode';
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Puppeteer's internal sandbox requires setuid on Linux; on Windows/macOS
// we rely on Chromium's full sandbox (default: ON).
const PUPPETEER_ARGS = [
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
];
if (process.platform === 'linux') {
  // Linux: keep --no-sandbox only if the host can't provide one.
  PUPPETEER_ARGS.push('--no-sandbox', '--disable-setuid-sandbox');
}

export class WhatsAppService {
  private client: any; // Using any because official types are missing for this version
  private win: BrowserWindow | null;
  private currentStatus: 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATED' | 'READY' = 'DISCONNECTED';
  private currentQR: string = '';
  private readonly sessionDir: string;

  constructor(win: BrowserWindow, accountId: string = 'default') {
    this.win = win;

    // Store session data inside Electron userData so it (a) does not pollute CWD,
    // (b) is scoped to the current OS user, and (c) is removed on app uninstall.
    this.sessionDir = join(app.getPath('userData'), 'wa-sessions', accountId);
    try { mkdirSync(this.sessionDir, { recursive: true }); } catch { /* ignore */ }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: accountId,
        dataPath: this.sessionDir,
      }),
      puppeteer: {
        headless: true,
        args: PUPPETEER_ARGS,
      },
    });

    this.setupListeners();
    this.setupAutoResponder();
  }

  private setupListeners() {
    this.client.on('qr', async (qr: string) => {
      this.currentStatus = 'QR_READY';
      // Convert QR string to Base64 image
      try {
        this.currentQR = await qrcode.toDataURL(qr);
        this.notifyFrontend('wa-status', { status: this.currentStatus, qr: this.currentQR });
      } catch (err) {
        console.error('Error generating QR', err);
      }
    });

    this.client.on('ready', () => {
      this.currentStatus = 'READY';
      this.currentQR = '';
      this.notifyFrontend('wa-status', { 
        status: this.currentStatus, 
        number: this.client.info.wid.user,
        info: this.client.info
      });
    });

    this.client.on('authenticated', () => {
      this.currentStatus = 'AUTHENTICATED';
      this.notifyFrontend('wa-status', { status: this.currentStatus });
    });

    this.client.on('auth_failure', (msg: string) => {
      console.error('AUTHENTICATION FAILURE', msg);
      this.currentStatus = 'DISCONNECTED';
      this.notifyFrontend('wa-status', { status: this.currentStatus, error: msg });
    });

    this.client.on('disconnected', (reason: string) => {
      this.currentStatus = 'DISCONNECTED';
      this.notifyFrontend('wa-status', { status: this.currentStatus, reason });
    });
  }

  public async initialize() {
    console.log('Initializing WhatsApp Client...');
    try {
      await this.client.initialize();
    } catch (error) {
      console.error('Failed to initialize client', error);
    }
  }
  public getStatus() {
    return {
      status: this.currentStatus,
      qr: this.currentQR,
      number: this.client?.info?.wid?.user || null,
      info: this.client?.info || null
    };
  }

  public async sendMessage(number: string, text: string, attachmentPath?: string) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }

    try {
      // Format number (strip non-digits, add @c.us if missing)
      const formattedNumber = number.toString().replace(/\D/g, '');
      
      if (formattedNumber.length < 7) {
        return { success: false, number: formattedNumber, error: 'Invalid number format. Ensure country code is included (e.g., 12125551234)' };
      }

      const chatId = formattedNumber.endsWith('@c.us') ? formattedNumber : `${formattedNumber}@c.us`;

      if (attachmentPath) {
        const { MessageMedia } = require('whatsapp-web.js');
        const media = MessageMedia.fromFilePath(attachmentPath);
        await this.client.sendMessage(chatId, media, { caption: text });
      } else {
        await this.client.sendMessage(chatId, text);
      }
      return { success: true, number: formattedNumber };
    } catch (error: any) {
      console.error('Failed to send message:', error);
      return { success: false, number, error: error.message };
    }
  }

  public async logout() {
    await this.client.logout();
    this.currentStatus = 'DISCONNECTED';
    this.currentQR = '';
    this.notifyFrontend('wa-status', { status: this.currentStatus });
  }

  public async getChats() {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }
    const chats = await this.client.getChats();
    return chats.map((c: any) => ({
      id: c.id._serialized,
      name: c.name || c.id.user,
      isGroup: c.isGroup,
      unreadCount: c.unreadCount
    }));
  }

  public async getGroupMembers(groupId: string) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }
    const chat = await this.client.getChatById(groupId);
    if (!chat.isGroup) {
      throw new Error('Chat is not a group');
    }
    
    // Typecast to any to bypass type issues on the group chat object for participants
    const groupChat: any = chat;
    const participants = groupChat.participants || [];
    
    return participants.map((p: any) => ({
      id: p.id._serialized,
      number: p.id.user,
      isAdmin: p.isAdmin || p.isSuperAdmin
    }));
  }

  public async joinGroup(inviteCode: string) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }
    
    try {
      // Extract the code if a full URL is provided
      const code = inviteCode.replace('https://chat.whatsapp.com/', '').trim();
      const response = await this.client.acceptInvite(code);
      return { success: true, groupId: response };
    } catch (error: any) {
      console.error('Failed to join group:', error);
      return { success: false, error: error.message };
    }
  }

  public async addParticipantsToGroup(groupId: string, participantNumbers: string[]) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }

    try {
      const chat = await this.client.getChatById(groupId);
      if (!chat.isGroup) {
        throw new Error('Chat is not a group');
      }

      // Format participant IDs
      const participantIds = participantNumbers.map(n => {
        const formatted = n.toString().replace(/\D/g, '');
        return formatted.endsWith('@c.us') ? formatted : `${formatted}@c.us`;
      });

      const groupChat: any = chat;
      const result = await groupChat.addParticipants(participantIds);
      return { success: true, result };
    } catch (error: any) {
      console.error('Failed to add participants:', error);
      return { success: false, error: error.message };
    }
  }

  public async createGroup(name: string, participantNumbers: string[]) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }

    try {
      const participantIds = participantNumbers.map(n => {
        const formatted = n.toString().replace(/\D/g, '');
        return formatted.endsWith('@c.us') ? formatted : `${formatted}@c.us`;
      });

      const result = await this.client.createGroup(name, participantIds);
      return { success: true, gid: result.id._serialized };
    } catch (error: any) {
      console.error('Failed to create group:', error);
      return { success: false, error: error.message };
    }
  }

  public async removeParticipantsFromGroup(groupId: string, participantNumbers: string[]) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }

    try {
      const chat = await this.client.getChatById(groupId);
      if (!chat.isGroup) {
        throw new Error('Chat is not a group');
      }

      const participantIds = participantNumbers.map(n => {
        const formatted = n.toString().replace(/\D/g, '');
        return formatted.endsWith('@c.us') ? formatted : `${formatted}@c.us`;
      });

      const groupChat: any = chat;
      await groupChat.removeParticipants(participantIds);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to remove participants:', error);
      return { success: false, error: error.message };
    }
  }

  public async leaveGroup(groupId: string) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }

    try {
      const chat = await this.client.getChatById(groupId);
      if (!chat.isGroup) {
        throw new Error('Chat is not a group');
      }
      const groupChat: any = chat;
      await groupChat.leave();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      return { success: false, error: error.message };
    }
  }

  public async checkNumber(number: string) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }
    const formatted = number.replace(/\D/g, '');
    const id = formatted.endsWith('@c.us') ? formatted : `${formatted}@c.us`;
    try {
      const isRegistered = await this.client.isRegisteredUser(id);
      return { number: formatted, isRegistered };
    } catch (error: any) {
      return { number: formatted, isRegistered: false, error: error.message };
    }
  }

  public async sendPoll(number: string, question: string, options: string[], allowMultiple: boolean = false) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }

    try {
      const formatted = number.toString().replace(/\D/g, '');
      const chatId = formatted.endsWith('@c.us') ? formatted : `${formatted}@c.us`;

      const poll = new Poll(question, options, { 
        allowMultipleAnswers: allowMultiple 
      } as any);
      await this.client.sendMessage(chatId, poll);
      
      return { success: true, number: formatted };
    } catch (error: any) {
      console.error('Failed to send poll:', error);
      return { success: false, number, error: error.message };
    }
  }

  private autoResponderRules: any[] = [];

  public setAutoResponderRules(rules: any[]) {
    this.autoResponderRules = rules;
  }

  private setupAutoResponder() {
    this.client.on('message', async (msg: any) => {
      if (this.autoResponderRules.length === 0) return;
      if (msg.from === 'status@broadcast') return;
      // Reject group chats by default — replying in groups is a major ban trigger.
      if (typeof msg.from === 'string' && msg.from.endsWith('@g.us')) return;
      // Never reply to our own outbound echoes.
      if (msg.fromMe) return;

      const body: string = typeof msg.body === 'string' ? msg.body : '';
      if (!body) return;
      const bodyLower = body.toLowerCase();

      for (const rule of this.autoResponderRules) {
        const keyword = String(rule?.keyword ?? '').toLowerCase();
        if (!keyword) continue;
        const match = rule.matchType === 'exact'
          ? bodyLower === keyword
          : rule.matchType === 'contains' && bodyLower.includes(keyword);

        if (match) {
          try {
            await msg.reply(String(rule.replyText ?? ''));
          } catch (e) {
            console.error('AutoResponder error', e);
          }
          break;
        }
      }
    });
  }

  private notifyFrontend(channel: string, payload: any) {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(channel, payload);
    }
  }
}
