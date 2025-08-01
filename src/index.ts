import { ConfigManager } from '@/config';
import { TelegramNotifier } from '@/telegram';
import { Scheduler } from '@/scheduler';
import { MessageSelector } from '@/messages';
import { TimeInterval } from '@/types';
import { Logger } from '@/utils/logger';

class NudgeDaemon {
  private configManager: ConfigManager;
  private telegramNotifier!: TelegramNotifier;
  private scheduler: Scheduler;
  private messageSelector: MessageSelector;
  private isRunning: boolean = false;

  constructor() {
    this.configManager = new ConfigManager();
    this.scheduler = new Scheduler();
    this.messageSelector = new MessageSelector();
  }

  async initialize(): Promise<void> {
    Logger.info('Initializing Nudge Daemon...');

    // Validate configuration
    const configErrors = this.configManager.validateConfig();
    if (configErrors.length > 0) {
      Logger.error('Configuration errors found:');
      configErrors.forEach(error => Logger.error(`  - ${error}`));
      throw new Error('Invalid configuration');
    }

    const config = this.configManager.getConfig();

    // Initialize Telegram notifier
    this.telegramNotifier = new TelegramNotifier(
      config.telegramBotToken,
      config.telegramChatId
    );

    // Test Telegram connection
    const connected = await this.telegramNotifier.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Telegram');
    }

    Logger.success('Nudge Daemon initialized successfully');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      Logger.warn('Daemon is already running');
      return;
    }

    await this.initialize();
    this.isRunning = true;

    Logger.info('Starting Nudge Daemon...');

    const activeIntervals = this.configManager.getActiveIntervals();
    Logger.info(`Found ${activeIntervals.length} active intervals`);

    // Schedule initial tasks for each interval
    for (const interval of activeIntervals) {
      await this.scheduleInterval(interval);
    }

    // Schedule daily checks for each interval
    for (const interval of activeIntervals) {
      this.scheduler.scheduleDailyIntervalCheck(interval, async (int) => {
        await this.scheduleInterval(int);
      });
    }

    // Send startup notification
    await this.telegramNotifier.sendStatusUpdate(
      `🚀 Nudge Bot başlatıldı!\n\n` +
      `Aktif aralıklar: ${activeIntervals.length}\n` +
      `Toplam mesaj sayısı: ${activeIntervals.reduce((sum, int) => sum + int.messages.length, 0)}`
    );

    Logger.success('Nudge Daemon started successfully');
  }

  private async scheduleInterval(interval: TimeInterval): Promise<void> {
    try {
      // Get random time within interval
      const randomTime = this.scheduler.getRandomTimeInInterval(interval);
      
      // Select random message
      const message = this.messageSelector.selectRandomMessage(interval);

      // Create scheduled job
      const scheduledJob = {
        intervalId: interval.id,
        scheduledTime: randomTime,
        message: message
      };

      // Add to scheduled jobs list
      this.scheduler.addScheduledJob(scheduledJob);

      // Schedule the task
      this.scheduler.scheduleTask(
        `nudge-${interval.id}-${Date.now()}`,
        randomTime,
        async () => {
          await this.sendNudge(interval, message);
          // Clean up completed jobs
          this.scheduler.cleanupCompletedJobs();
        }
      );

      Logger.schedule(
        `Scheduled nudge for interval "${interval.id}" at ${randomTime.toLocaleString()} - Message: "${message.content.substring(0, 50)}..."`
      );
    } catch (error) {
      Logger.error(`Failed to schedule interval ${interval.id}:`, error);
    }
  }

  private async sendNudge(interval: TimeInterval, message: any): Promise<void> {
    try {
      Logger.message(`Sending nudge from interval "${interval.id}"`);
      await this.telegramNotifier.sendMessage(message);
      Logger.success(`Nudge sent successfully`);
    } catch (error) {
      Logger.error(`Failed to send nudge:`, error);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      Logger.warn('Daemon is not running');
      return;
    }

    Logger.info('Stopping Nudge Daemon...');

    // Cancel all scheduled tasks
    this.scheduler.cancelAllTasks();

    // Send shutdown notification
    try {
      await this.telegramNotifier.sendStatusUpdate(
        `🛑 Nudge Bot durduruldu.`
      );
    } catch (error) {
      Logger.error('Failed to send shutdown notification:', error);
    }

    // Stop Telegram bot
    this.telegramNotifier.stop();

    this.isRunning = false;
    Logger.success('Nudge Daemon stopped');
  }

  async status(): Promise<void> {
    const activeIntervals = this.configManager.getActiveIntervals();
    const scheduledJobs = this.scheduler.getScheduledJobs();
    const now = new Date();
    const upcomingJobs = scheduledJobs.filter(job => job.scheduledTime > now);

    let statusMessage = `📊 <b>Nudge Bot Durumu</b>\n\n`;
    statusMessage += `Çalışma durumu: ${this.isRunning ? '✅ Aktif' : '❌ Durduruldu'}\n`;
    statusMessage += `Aktif aralıklar: ${activeIntervals.length}\n`;
    statusMessage += `Bekleyen görevler: ${upcomingJobs.length}\n\n`;

    if (upcomingJobs.length > 0) {
      statusMessage += `<b>Sonraki mesajlar:</b>\n`;
      upcomingJobs
        .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
        .slice(0, 5)
        .forEach(job => {
          const interval = activeIntervals.find(int => int.id === job.intervalId);
          if (interval) {
            statusMessage += `• ${job.scheduledTime.toLocaleString()} - ${interval.id}\n`;
          }
        });
    }

    await this.telegramNotifier.sendCustomMessage(statusMessage);
  }
}

// Main execution
const daemon = new NudgeDaemon();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  Logger.info('Received SIGINT, shutting down gracefully...');
  await daemon.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('Received SIGTERM, shutting down gracefully...');
  await daemon.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the daemon
daemon.start().catch(error => {
  Logger.error('Failed to start daemon:', error);
  process.exit(1);
});