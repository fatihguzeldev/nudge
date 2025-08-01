import TelegramBot from 'node-telegram-bot-api';
import { Message } from '@/types';

export class TelegramNotifier {
  private bot: TelegramBot;
  private chatId: string;
  private isInitialized: boolean = false;

  constructor(token: string, chatId: string) {
    if (!token || !chatId) {
      throw new Error('Telegram bot token and chat ID are required');
    }

    this.bot = new TelegramBot(token, { polling: false });
    this.chatId = chatId;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Test the connection by getting bot info
      const botInfo = await this.bot.getMe();
      console.log(`✅ Telegram bot initialized: @${botInfo.username}`);
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  async sendMessage(message: Message): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.bot.sendMessage(this.chatId, message.content, {
        parse_mode: 'HTML',
        disable_notification: false
      });
      console.log(`📤 Message sent: ${message.id}`);
    } catch (error) {
      console.error(`❌ Failed to send message ${message.id}:`, error);
      throw error;
    }
  }

  async sendCustomMessage(text: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.bot.sendMessage(this.chatId, text, {
        parse_mode: 'HTML',
        disable_notification: false
      });
      console.log(`📤 Custom message sent`);
    } catch (error) {
      console.error('❌ Failed to send custom message:', error);
      throw error;
    }
  }

  async sendStatusUpdate(status: string): Promise<void> {
    const statusMessage = `🤖 <b>Nudge Bot Status</b>\n\n${status}`;
    await this.sendCustomMessage(statusMessage);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      await this.sendCustomMessage('🎯 Nudge bot bağlantı testi başarılı! Bot çalışmaya hazır.');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Method to stop the bot gracefully
  stop(): void {
    if (this.bot) {
      this.bot.stopPolling();
    }
  }
}