import { NUDGE_CONFIG } from '../config'
import { RandomGenerator } from './utils'
import { ScheduledNudge } from './types'
import {
  BrevoClient,
  NodemailerClient,
  TelegramClient,
  DiscordClient,
  Client,
} from '../clients'
import { DateTime } from 'luxon'
import { ClientType } from '../types'
import LLMService from '../llmServices/service'

export class NudgeManager {
  private scheduledNudges: Map<string, ScheduledNudge> = new Map()
  private clients: Map<string, Client> = new Map()
  private llmService: LLMService | null = null

  constructor() {
    this.initializeClients()
    this.initializeLLMService()
  }

  /**
   * initializes LLM service if configured via environment variables
   */
  private initializeLLMService(): void {
    const useLLM = process.env.USE_LLM === 'true'

    if (useLLM) {
      const llmConfig = {
        model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
        temperature: process.env.LLM_TEMPERATURE || '0.7',
        maxTokens: process.env.LLM_MAX_TOKENS || '100',
      }

      const clientType = process.env.LLM_CLIENT_TYPE || 'openai'

      this.llmService = new LLMService(llmConfig, clientType)
      console.log(`LLM service initialized with ${clientType}`)
    } else {
      console.log('LLM service disabled - using default messages')
    }
  }

  /**
   * initializes available clients based on environment configuration
   */
  private initializeClients(): void {
    const useClients = process.env.USE_CLIENTS?.split(',') || []

    if (useClients.includes(ClientType.BREVO)) {
      this.clients.set(ClientType.BREVO, new BrevoClient())
    }

    if (useClients.includes(ClientType.NODEMAILER)) {
      this.clients.set(ClientType.NODEMAILER, new NodemailerClient())
    }

    if (useClients.includes(ClientType.TELEGRAM)) {
      this.clients.set(ClientType.TELEGRAM, new TelegramClient())
    }

    if (useClients.includes(ClientType.DISCORD)) {
      this.clients.set(ClientType.DISCORD, new DiscordClient())
    }

    if (this.clients.size === 0) {
      throw new Error(`no clients configured. check your .env file`)
    }
  }

  /**
   * generates all nudges for the current day
   */
  async generateDailyNudges(): Promise<void> {
    for (const nudgeConfig of NUDGE_CONFIG.nudges) {
      try {
        const scheduledTime = RandomGenerator.generateRandomTime(
          nudgeConfig.range,
        )
        let message: string

        if (this.llmService) {
          message = await this.llmService.generateResponse(
            'Generate nudge message',
          ) // prompt mesajını değiştir
        } else {
          message = RandomGenerator.selectRandomMessage(nudgeConfig.messages)
        }

        const id = RandomGenerator.generateNudgeId()

        const scheduledNudge: ScheduledNudge = {
          id,
          scheduledTime,
          message,
        }

        this.scheduledNudges.set(id, scheduledNudge)

        const timezone = process.env.TIMEZONE || 'Europe/Istanbul'
        const humanReadableTime = DateTime.fromJSDate(scheduledTime)
          .setZone(timezone)
          .toFormat('yyyy-MM-dd HH:mm')

        console.log(
          `scheduled nudge: ${id} at ${humanReadableTime} (${timezone})`,
        )
      } catch (error) {
        console.error(
          'failed to generate nudge for range:',
          nudgeConfig.range,
          error,
        )
      }
    }
  }

  /**
   * executes a scheduled nudge by sending message through all available clients
   * @param nudgeId id of the nudge to execute
   */
  async executeNudge(nudgeId: string): Promise<void> {
    const nudge = this.scheduledNudges.get(nudgeId)

    if (!nudge) {
      console.error(`nudge not found: ${nudgeId}`)

      return
    }

    for (const [clientName, client] of this.clients) {
      try {
        await client.sendMessage({
          body: nudge.message,
        })

        console.log(`${nudgeId}: message sent successfully via ${clientName}`)
      } catch (error) {
        console.error(
          `${nudgeId}: failed to send message via ${clientName}: `,
          error,
        )
      }
    }

    this.scheduledNudges.delete(nudgeId)
  }

  /**
   * gets all scheduled nudge ids
   * @returns array of nudge ids
   */
  getScheduledNudgeIds(): string[] {
    return Array.from(this.scheduledNudges.keys())
  }

  /**
   * gets a specific scheduled nudge by id
   * @param nudgeId id of the nudge to get
   * @returns scheduled nudge or undefined
   */
  getScheduledNudge(nudgeId: string): ScheduledNudge | undefined {
    return this.scheduledNudges.get(nudgeId)
  }

  /**
   * clears all scheduled nudges (useful for daily reset)
   */
  clearScheduledNudges(): void {
    this.scheduledNudges.clear()
    console.log('nudgeManager: cleared all scheduled nudges')
  }
}
