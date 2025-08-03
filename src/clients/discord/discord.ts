import { Client } from '../client'
import { Message } from '../../types/messages'

interface DiscordEmbed {
  title: string
  description: string
  color: number
  timestamp: string
  footer: {
    text: string
  }
}

interface DiscordWebhookPayload {
  username?: string
  avatar_url?: string
  content?: string
  embeds?: DiscordEmbed[]
}

export class DiscordClient extends Client {
  private readonly webhookUrl: string
  private readonly username: string
  private readonly avatarUrl?: string
  private readonly useEmbeds: boolean
  private readonly embedColor: number

  constructor() {
    super()

    if (!process.env.DISCORD_WEBHOOK_URL) {
      throw new Error(
        'discord client is not configured. please check your .env file (DISCORD_WEBHOOK_URL is required)',
      )
    }

    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL

    // All optional settings with sensible defaults
    this.username = process.env.DISCORD_USERNAME || 'nudge bot'
    this.avatarUrl = process.env.DISCORD_AVATAR_URL
    this.useEmbeds = process.env.DISCORD_USE_EMBEDS !== 'false' // defaults to true
    this.embedColor = parseInt(process.env.DISCORD_EMBED_COLOR || '3447003', 10)
  }

  override async sendMessage(message: Message): Promise<void> {
    const payload: DiscordWebhookPayload = {
      username: this.username,
    }

    if (this.avatarUrl) {
      payload.avatar_url = this.avatarUrl
    }

    if (this.useEmbeds) {
      // Use rich embed formatting
      payload.embeds = [
        {
          title: '🔔 nudge reminder',
          description: message.body,
          color: this.embedColor,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'nudge',
          },
        },
      ]
    } else {
      // Use plain text formatting
      payload.content = this.formatMessage(message.body)
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `discord webhook failed with status ${response.status}: ${errorText}`,
      )
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      if (retryAfter) {
        const retryMs = parseInt(retryAfter, 10) * 1000
        console.log(`discord rate limited, retrying after ${retryMs}ms`)
        await new Promise((resolve) => setTimeout(resolve, retryMs))
        return this.sendMessage(message)
      }
    }
  }

  /**
   * formats the message body for discord plain text mode
   * adds a header to identify nudge messages
   */
  private formatMessage(body: string): string {
    return `🔔 **nudge reminder**\n\n${body}`
  }
}
