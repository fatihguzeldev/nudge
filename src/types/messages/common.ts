export enum ClientType {
  BREVO = 'brevo',
  NODEMAILER = 'nodemailer',
  TELEGRAM = 'telegram',
  DISCORD = 'discord',
}

export interface Message {
  body: string
}
