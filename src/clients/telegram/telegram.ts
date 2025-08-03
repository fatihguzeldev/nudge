import TelegramBot from 'node-telegram-bot-api'
import { Client } from '../client'
import { Message } from '../../types/messages'

export class TelegramClient extends Client {
  private readonly bot: TelegramBot
  private readonly chatId: string
  private readonly parseMode: TelegramBot.ParseMode
  private readonly disableNotification: boolean

  constructor() {
    super()

    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      throw new Error(
        'telegram client is not configured. please check your .env file (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required)',
      )
    }

    const token = process.env.TELEGRAM_BOT_TOKEN
    this.chatId = process.env.TELEGRAM_CHAT_ID
    this.parseMode =
      (process.env.TELEGRAM_PARSE_MODE as TelegramBot.ParseMode) || 'HTML'
    this.disableNotification =
      process.env.TELEGRAM_DISABLE_NOTIFICATION === 'true'

    // initialize bot without polling since we only send messages
    this.bot = new TelegramBot(token, { polling: false })
  }

  override async sendMessage(message: Message): Promise<void> {
      // your options here
      const telegramOptions: TelegramBot.SendMessageOptions = {}

      await this.bot.sendMessage(
        this.chatId,
        this.formatMessage(message.body),
        telegramOptions,
      )
  }

  /**
   * formats the message body for telegram
   * adds a header to identify nudge messages
   */
  private formatMessage(body: string): string {
    // use emoji and formatting based on parse mode
    if (this.parseMode === 'HTML') {
      return `🔔 <b>nudge reminder</b>\n\n${body}`
    }

    if (this.parseMode === 'Markdown' || this.parseMode === 'MarkdownV2') {
      const header =
        this.parseMode === 'MarkdownV2'
          ? '🔔 *nudge reminder*\n\n'
          : '🔔 *nudge reminder*\n\n'
      return header + body
    }

    // plain text fallback
    return `🔔 nudge reminder\n\n${body}`
  }
}
