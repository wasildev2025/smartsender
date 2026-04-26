import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, Poll } = pkg;
import qrcode from 'qrcode';
import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { SendGovernor } from './rateLimiter';

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

type WaStatus = 'INITIALIZING' | 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATED' | 'READY';

export class WhatsAppService {
  private client: any; // Using any because official types are missing for this version
  private win: BrowserWindow | null;
  private currentStatus: WaStatus = 'INITIALIZING';
  private currentQR: string = '';
  private readonly sessionDir: string;
  private readonly accountId: string;
  private readonly governor = new SendGovernor();
  private initWatchdog: ReturnType<typeof setTimeout> | null = null;
  private initAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private userInitiatedLogout = false;

  constructor(win: BrowserWindow, accountId: string = 'default') {
    this.win = win;
    this.accountId = accountId;

    // Store session data inside Electron userData so it (a) does not pollute CWD,
    // (b) is scoped to the current OS user, and (c) is removed on app uninstall.
    this.sessionDir = join(app.getPath('userData'), 'wa-sessions', accountId);
    try { mkdirSync(this.sessionDir, { recursive: true }); } catch { /* ignore */ }

    this.client = this.buildClient();

    this.setupListeners();
    this.setupAutoResponder();
  }

  private buildClient() {
    return new Client({
      authStrategy: new LocalAuth({
        clientId: this.accountId,
        dataPath: this.sessionDir,
      }),
      puppeteer: {
        headless: true,
        args: PUPPETEER_ARGS,
        // Give puppeteer more time to launch on slower machines.
        timeout: 120_000,
      },
      // We deliberately do NOT pin webVersionCache — a hardcoded community
      // mirror URL goes stale or 404s and breaks every user. Trust the
      // library default; accept that cold starts can take 5-30s. The init
      // watchdog (initialize()) auto-restarts if WA never reaches READY.
      authTimeoutMs: 60_000,
      qrMaxRetries: 3,
      takeoverOnConflict: true,
    } as any);
  }

  private setupListeners() {
    this.client.on('qr', async (qr: string) => {
      this.currentStatus = 'QR_READY';
      this.clearInitWatchdog();
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
      this.clearInitWatchdog();
      // We're back online — reset reconnect backoff so a future disconnect
      // doesn't inherit a long delay from a previous outage.
      this.reconnectAttempts = 0;
      this.notifyFrontend('wa-status', {
        status: this.currentStatus,
        number: this.client.info.wid.user,
        info: this.client.info
      });
    });

    this.client.on('authenticated', () => {
      this.currentStatus = 'AUTHENTICATED';
      this.clearInitWatchdog();
      this.notifyFrontend('wa-status', { status: this.currentStatus });
    });

    this.client.on('auth_failure', (msg: string) => {
      console.error('AUTHENTICATION FAILURE', msg);
      this.currentStatus = 'DISCONNECTED';
      this.clearInitWatchdog();
      this.notifyFrontend('wa-status', { status: this.currentStatus, error: msg });
    });

    this.client.on('disconnected', (reason: string) => {
      this.currentStatus = 'DISCONNECTED';
      this.clearInitWatchdog();
      this.notifyFrontend('wa-status', { status: this.currentStatus, reason });
      // Schedule an auto-reconnect unless the user explicitly logged out.
      // WA drops sessions for many reasons (network blip, takeover, phone
      // offline); without this the user has to restart the app every time.
      if (!this.userInitiatedLogout) {
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return; // already scheduled
    if (this.reconnectAttempts >= 5) {
      console.warn('WhatsApp auto-reconnect: giving up after 5 attempts');
      return;
    }
    // Exponential backoff: 5s, 15s, 45s, 2m, 5m
    const delays = [5_000, 15_000, 45_000, 120_000, 300_000];
    const delay = delays[Math.min(this.reconnectAttempts, delays.length - 1)];
    this.reconnectAttempts += 1;
    console.log(`WhatsApp auto-reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.userInitiatedLogout) return;
      this.restart().catch(err => {
        console.error('Auto-reconnect restart failed', err);
        this.scheduleReconnect();
      });
    }, delay);
  }

  private cancelReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  public async initialize() {
    // Reaching initialize() means we're attempting to connect — the user has
    // not requested a logout, and any pending reconnect timer is superseded.
    this.userInitiatedLogout = false;
    this.cancelReconnect();
    this.initAttempts += 1;
    console.log(`Initializing WhatsApp Client (attempt ${this.initAttempts})...`);
    this.currentStatus = 'INITIALIZING';
    this.notifyFrontend('wa-status', { status: this.currentStatus });

    // Watchdog: if no QR / ready event arrives within 90s, restart the
    // client. whatsapp-web.js occasionally hangs forever on a blank
    // Chromium page; auto-restarting recovers without user action.
    if (this.initWatchdog) clearTimeout(this.initWatchdog);
    this.initWatchdog = setTimeout(() => {
      if (this.currentStatus === 'INITIALIZING' && this.initAttempts < 3) {
        console.warn('WhatsApp engine init timed out, restarting...');
        this.restart().catch(err => console.error('Restart failed', err));
      } else if (this.currentStatus === 'INITIALIZING') {
        this.currentStatus = 'DISCONNECTED';
        this.notifyFrontend('wa-status', {
          status: this.currentStatus,
          error: 'Engine failed to start. Try restarting the app.',
        });
      }
    }, 90_000);

    try {
      await this.client.initialize();
    } catch (error: any) {
      console.error('Failed to initialize client', error);
      this.currentStatus = 'DISCONNECTED';
      this.notifyFrontend('wa-status', {
        status: this.currentStatus,
        error: error?.message || 'Engine failed to start',
      });
    }
  }

  private clearInitWatchdog() {
    if (this.initWatchdog) {
      clearTimeout(this.initWatchdog);
      this.initWatchdog = null;
    }
    this.initAttempts = 0;
  }

  private async restart() {
    try {
      if (this.initWatchdog) {
        clearTimeout(this.initWatchdog);
        this.initWatchdog = null;
      }
      try { await this.client.destroy(); } catch { /* ignore */ }
      this.client = this.buildClient();
      this.setupListeners();
      this.setupAutoResponder();
      await this.initialize();
    } catch (err) {
      console.error('Failed to restart WA client', err);
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

  public async sendMessage(number: string, text: string) {
    if (this.currentStatus !== 'READY') {
      // Refuse early if the WA web Store hasn't finished hydrating; sending
      // before READY is what produces the cryptic "getChat of undefined" error.
      return { success: false, number, error: 'WhatsApp is not fully ready yet. Wait a few seconds and try again.' };
    }

    const decision = await this.governor.request(this.accountId);
    if (!decision.allow) {
      return { success: false, number, error: `rate_limited:${decision.reason}`, retryAfterMs: decision.retryAfterMs };
    }

    try {
      const formattedNumber = number.toString().replace(/\D/g, '');
      if (formattedNumber.length < 7) {
        return { success: false, number: formattedNumber, error: 'Invalid number format. Ensure country code is included (e.g., 12125551234)' };
      }

      const chatId = formattedNumber.endsWith('@c.us') ? formattedNumber : `${formattedNumber}@c.us`;

      // Human-pattern jitter before the actual send.
      await new Promise(r => setTimeout(r, decision.waitMs));

      await this.client.sendMessage(chatId, text);
      return { success: true, number: formattedNumber, remainingToday: decision.remainingToday };
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const raw = error?.message || String(error);
      // Translate the most common confusing error into something actionable.
      const friendly = /getChat|undefined.*reading/i.test(raw)
        ? 'WhatsApp engine is not fully ready (Store not loaded). Reconnect from the Accounts tab.'
        : raw;
      return { success: false, number, error: friendly };
    }
  }

  public async logout() {
    // Mark this as user-initiated so the 'disconnected' event handler doesn't
    // try to auto-reconnect us into the QR screen we just left.
    this.userInitiatedLogout = true;
    this.cancelReconnect();
    try {
      await this.client.logout();
    } catch (err) {
      console.error('logout() failed', err);
    }
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

    const decision = await this.governor.request(this.accountId);
    if (!decision.allow) {
      return { success: false, number, error: `rate_limited:${decision.reason}`, retryAfterMs: decision.retryAfterMs };
    }

    try {
      const formatted = number.toString().replace(/\D/g, '');
      const chatId = formatted.endsWith('@c.us') ? formatted : `${formatted}@c.us`;

      await new Promise(r => setTimeout(r, decision.waitMs));

      const poll = new Poll(question, options, { allowMultipleAnswers: allowMultiple } as any);
      await this.client.sendMessage(chatId, poll);

      return { success: true, number: formatted, remainingToday: decision.remainingToday };
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
