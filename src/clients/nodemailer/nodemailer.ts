import { Client } from '../client'
import { Message } from '../../types/messages'
import nodemailer from 'nodemailer'

export class NodemailerClient extends Client {
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

  override async sendMessage(message: Message): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.senderEmail,
      to: this.toEmail,
      subject: 'nudge reminder',
      text: message.body,
      html: `<p>${message.body}</p>`,
    }

    await this.transporter.sendMail(mailOptions)
  }
}
