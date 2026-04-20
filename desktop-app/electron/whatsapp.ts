import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { BrowserWindow } from 'electron';

export class WhatsAppService {
  private client: Client;
  private win: BrowserWindow | null;
  private currentStatus: 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATED' | 'READY' = 'DISCONNECTED';
  private currentQR: string = '';

  constructor(win: BrowserWindow) {
    this.win = win;

    // Initialize WhatsApp Client with LocalAuth for session saving
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.smartsender_auth' // Saves session locally
      }),
      puppeteer: {
        // Use headless mode
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.client.on('qr', async (qr) => {
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
        info: this.client.info 
      });
    });

    this.client.on('authenticated', () => {
      this.currentStatus = 'AUTHENTICATED';
      this.notifyFrontend('wa-status', { status: this.currentStatus });
    });

    this.client.on('auth_failure', msg => {
      console.error('AUTHENTICATION FAILURE', msg);
      this.currentStatus = 'DISCONNECTED';
      this.notifyFrontend('wa-status', { status: this.currentStatus, error: msg });
    });

    this.client.on('disconnected', (reason) => {
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
      info: this.client.info
    };
  }

  public async sendMessage(number: string, text: string, attachmentPath?: string) {
    if (this.currentStatus !== 'READY' && this.currentStatus !== 'AUTHENTICATED') {
      throw new Error('WhatsApp Client is not ready');
    }

    try {
      // Format number (strip non-digits, add @c.us if missing)
      const formattedNumber = number.replace(/\D/g, '');
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

  private notifyFrontend(channel: string, payload: any) {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(channel, payload);
    }
  }
}
