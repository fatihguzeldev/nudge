export enum ClientType {
  BREVO = 'brevo',
  NODEMAILER = 'nodemailer',
}

export interface BaseMessage {
  type: ClientType
}
