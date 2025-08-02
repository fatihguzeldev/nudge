import Client from '../client'
import { MailMessage } from '../../types/messages'
import nodemailer from 'nodemailer'

export class NodemailerClient extends Client<MailMessage> {
  private readonly transporter: nodemailer.Transporter
  private readonly smtp: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  private readonly senderEmail: string
  private readonly toEmail: string

  constructor() {
    super()

    if (
      process.env.NODEMAILER_SMTP_HOST &&
      process.env.NODEMAILER_SMTP_PORT &&
      process.env.NODEMAILER_SMTP_SECURE &&
      process.env.NODEMAILER_SMTP_AUTH_USER &&
      process.env.NODEMAILER_SMTP_AUTH_PASS &&
      process.env.NODEMAILER_SENDER_EMAIL &&
      process.env.NODEMAILER_TO_EMAIL
    ) {
      this.smtp = {
        host: process.env.NODEMAILER_SMTP_HOST,
        port: parseInt(process.env.NODEMAILER_SMTP_PORT, 10),
        secure: process.env.NODEMAILER_SMTP_SECURE === 'true',
        auth: {
          user: process.env.NODEMAILER_SMTP_AUTH_USER,
          pass: process.env.NODEMAILER_SMTP_AUTH_PASS,
        },
      }
      this.senderEmail = process.env.NODEMAILER_SENDER_EMAIL
      this.toEmail = process.env.NODEMAILER_TO_EMAIL
    } else {
      throw new Error(
        'nodemailer client is not configured. please check your .env file',
      )
    }

    this.transporter = nodemailer.createTransport({
      host: this.smtp.host,
      port: this.smtp.port,
      secure: this.smtp.secure,
      auth: {
        user: this.smtp.auth.user,
        pass: this.smtp.auth.pass,
      },
    })
  }

  override async sendMessage(payload: MailMessage): Promise<void> {
    try {
      const { subject, body } = payload

      const mailOptions: nodemailer.SendMailOptions = {
        from: this.senderEmail,
        to: this.toEmail,
        subject,
        text: body,
        html: `<p>${body}</p>`,
      }

      await this.transporter.sendMail(mailOptions)
    } catch (error) {
      console.error(error)
      throw new Error('nodemailer: failed to send email')
    }
  }
}
