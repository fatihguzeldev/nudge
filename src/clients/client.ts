import { Message } from '../types/messages'

export abstract class Client {
  abstract sendMessage(message: Message): Promise<void>
}
