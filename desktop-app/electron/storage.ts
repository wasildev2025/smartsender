import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

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

export class StorageService {
  private filePath: string;
  private data: AppData | null = null;

  constructor() {
    // Save to the user data directory (AppData/Roaming/smartsender on Windows)
    const userDataPath = app.getPath('userData');
    this.filePath = path.join(userDataPath, 'app_data.json');
  }

  private async ensureInitialized() {
    if (this.data) return;

    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(content);
    } catch (error) {
      console.log('No existing storage found, initializing new database.');
      this.data = {
        totalSent: 0,
        history: []
      };
      await this.save();
    }
  }

  private async save() {
    if (!this.data) return;
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
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

    // Check if we are updating an existing campaign (e.g. from Running to Completed)
    const index = this.data.history.findIndex(h => h.id === campaign.id);
    if (index !== -1) {
      this.data.history[index] = campaign;
    } else {
      this.data.history.unshift(campaign); // Add to top
    }

    // Keep only last 50 campaigns
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
