import Client from '../client'
import { MailMessage } from '../../types/messages'
import Brevo from '@getbrevo/brevo'

export class BrevoClient extends Client<MailMessage> {
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

  override async sendMessage(payload: MailMessage): Promise<void> {
    const { subject, body } = payload

    const message = new Brevo.SendSmtpEmail()
    message.subject = subject
    message.textContent = body
    message.to = [{ email: this.toEmail }]
    message.sender = {
      email: this.senderEmail,
      name: this.senderName,
    }

    try {
      await this.brevo.sendTransacEmail(message)
    } catch (error) {
      console.error(error)
      throw new Error('brevo: failed to send email')
    }
  }
}
