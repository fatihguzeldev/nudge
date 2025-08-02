import { BaseMessage, ClientType } from './common'

export type MailClientType = ClientType.BREVO | ClientType.NODEMAILER

export interface MailMessage extends BaseMessage {
  type: MailClientType
  subject: string
  body: string
}
