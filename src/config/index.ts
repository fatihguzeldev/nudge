import { NudgeConfig, TimeInterval } from '@/types';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export class ConfigManager {
  private config: NudgeConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'nudge.config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): NudgeConfig {
    // First, try to load from file
    if (fs.existsSync(this.configPath)) {
      try {
        const configFile = fs.readFileSync(this.configPath, 'utf-8');
        const fileConfig = JSON.parse(configFile);
        
        // Merge with environment variables
        return {
          ...fileConfig,
          telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || fileConfig.telegramBotToken,
          telegramChatId: process.env.TELEGRAM_CHAT_ID || fileConfig.telegramChatId,
          timezone: process.env.TZ || fileConfig.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      } catch (error) {
        console.error('Error loading config file:', error);
      }
    }

    // Default configuration with example intervals
    return {
      intervals: this.getDefaultIntervals(),
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
      telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
      timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getDefaultIntervals(): TimeInterval[] {
    return [
      {
        id: 'morning-work',
        startTime: '09:00',
        endTime: '12:00',
        enabled: true,
        messages: [
          { id: 'm1', content: 'Çalışmalar nasıl gidiyor? Yatıyor musun hala? Utan amk kendinden' },
          { id: 'm2', content: 'Sabah sabah ne yapıyorsun? Kod yazıyor musun yoksa YouTube\'da mı takılıyorsun?' },
          { id: 'm3', content: 'Hadi bakalım, bu sabah kaç satır kod yazdın?' }
        ]
      },
      {
        id: 'afternoon-check',
        startTime: '14:00',
        endTime: '17:00',
        enabled: true,
        messages: [
          { id: 'a1', content: 'Öğleden sonra verimliliği nasıl gidiyor?' },
          { id: 'a2', content: 'Hala ayaktasın değil mi? Yoksa uyukladın mı?' },
          { id: 'a3', content: 'Bu saatte hala bir şeyler üretebiliyor musun?' }
        ]
      },
      {
        id: 'evening-review',
        startTime: '19:00',
        endTime: '22:00',
        enabled: true,
        messages: [
          { id: 'e1', content: 'Bugün ne yaptın? Özet geç bakalım.' },
          { id: 'e2', content: 'Yarın için plan yaptın mı yoksa yine günü kurtarmaca mı?' },
          { id: 'e3', content: 'Bu akşam da mı Netflix? Biraz kitap oku be!' }
        ]
      }
    ];
  }

  public getConfig(): NudgeConfig {
    return this.config;
  }

  public getActiveIntervals(): TimeInterval[] {
    return this.config.intervals.filter(interval => interval.enabled);
  }

  public saveConfig(config: NudgeConfig): void {
    this.config = config;
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  public updateInterval(intervalId: string, updates: Partial<TimeInterval>): void {
    const intervalIndex = this.config.intervals.findIndex(i => i.id === intervalId);
    if (intervalIndex !== -1) {
      this.config.intervals[intervalIndex] = {
        ...this.config.intervals[intervalIndex],
        ...updates
      };
      this.saveConfig(this.config);
    }
  }

  public validateConfig(): string[] {
    const errors: string[] = [];

    if (!this.config.telegramBotToken) {
      errors.push('Telegram bot token is missing');
    }

    if (!this.config.telegramChatId) {
      errors.push('Telegram chat ID is missing');
    }

    this.config.intervals.forEach(interval => {
      if (!this.isValidTimeFormat(interval.startTime)) {
        errors.push(`Invalid start time format for interval ${interval.id}: ${interval.startTime}`);
      }
      if (!this.isValidTimeFormat(interval.endTime)) {
        errors.push(`Invalid end time format for interval ${interval.id}: ${interval.endTime}`);
      }
      if (interval.messages.length === 0) {
        errors.push(`No messages defined for interval ${interval.id}`);
      }
    });

    return errors;
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}