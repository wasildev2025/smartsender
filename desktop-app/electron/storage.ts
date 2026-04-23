import { app, safeStorage } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

// -----------------------------------------------------------------
// Campaign history + counters. Stored encrypted at rest via Electron's
// safeStorage (DPAPI / Keychain / libsecret). Falls back to plaintext
// only if the OS key store is unavailable (headless CI, old Linux).
// -----------------------------------------------------------------

interface CampaignRecord {
  id: string;
  name: string;
  status: 'Completed' | 'Running' | 'Paused' | 'Failed';
  sent: number;
  total: number;
  date: string;
}

interface AppData {
  totalSent: number;
  history: CampaignRecord[];
}

const ENC_MAGIC = 'SSENC1:';  // prefix to signal an encrypted payload on disk.

export class StorageService {
  private filePath: string;
  private data: AppData | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.filePath = path.join(userDataPath, 'app_data.enc');
  }

  private async ensureInitialized() {
    if (this.data) return;

    try {
      const raw = await fs.readFile(this.filePath);
      const text = raw.toString('utf-8');

      if (text.startsWith(ENC_MAGIC)) {
        if (!safeStorage.isEncryptionAvailable()) {
          console.error('storage: encrypted blob found but safeStorage unavailable; refusing to open.');
          this.data = { totalSent: 0, history: [] };
        } else {
          const cipher = Buffer.from(text.slice(ENC_MAGIC.length), 'base64');
          const plain = safeStorage.decryptString(cipher);
          this.data = JSON.parse(plain);
        }
      } else {
        // Legacy plaintext — migrate on next save.
        this.data = JSON.parse(text);
      }
    } catch {
      this.data = { totalSent: 0, history: [] };
      await this.save();
    }
  }

  private async save() {
    if (!this.data) return;
    try {
      const payload = JSON.stringify(this.data);
      if (safeStorage.isEncryptionAvailable()) {
        const cipher = safeStorage.encryptString(payload);
        await fs.writeFile(this.filePath, ENC_MAGIC + cipher.toString('base64'));
      } else {
        await fs.writeFile(this.filePath, payload);
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  public async getDashboardData() {
    await this.ensureInitialized();
    return this.data;
  }

  public async recordCampaign(campaign: CampaignRecord) {
    await this.ensureInitialized();
    if (!this.data) return;

    const index = this.data.history.findIndex(h => h.id === campaign.id);
    if (index !== -1) {
      this.data.history[index] = campaign;
    } else {
      this.data.history.unshift(campaign);
    }

    if (this.data.history.length > 50) {
      this.data.history = this.data.history.slice(0, 50);
    }

    await this.save();
  }

  public async incrementTotalSent(amount: number = 1) {
    await this.ensureInitialized();
    if (!this.data) return;

    this.data.totalSent += amount;
    await this.save();
  }
}
