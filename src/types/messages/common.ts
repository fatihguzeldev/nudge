export enum ClientType {
  BREVO = 'brevo',
  NODEMAILER = 'nodemailer',
  TELEGRAM = 'telegram',
}

export interface Message {
  body: string
}
