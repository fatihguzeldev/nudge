import { Client } from '../client'
import { Message } from '../../types/messages'
import * as Brevo from '@getbrevo/brevo'

export class BrevoClient extends Client {
  private readonly brevo: Brevo.TransactionalEmailsApi
  private readonly senderEmail: string
  private readonly senderName: string
  private readonly toEmail: string

  constructor() {
    super()

    if (
      process.env.BREVO_SENDER_EMAIL &&
      process.env.BREVO_SENDER_NAME &&
      process.env.BREVO_TO_EMAIL
    ) {
      this.senderEmail = process.env.BREVO_SENDER_EMAIL
      this.senderName = process.env.BREVO_SENDER_NAME
      this.toEmail = process.env.BREVO_TO_EMAIL
    } else {
      throw new Error(
        'brevo client is not configured. please check your .env file',
      )
    }

    this.brevo = new Brevo.TransactionalEmailsApi()
    this.brevo.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY || 'no-key',
    )
  }

  override async sendMessage(message: Message): Promise<void> {
    const emailMessage = new Brevo.SendSmtpEmail()

    emailMessage.subject = 'nudge reminder'
    emailMessage.textContent = message.body
    emailMessage.to = [{ email: this.toEmail }]
    emailMessage.sender = {
      email: this.senderEmail,
      name: this.senderName,
    }

    await this.brevo.sendTransacEmail(emailMessage)
  }
}
