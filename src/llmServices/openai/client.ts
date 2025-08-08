import OpenAI from 'openai'
import { BaseLLMConfig, LLMClient } from '../types'

export class OpenAIClient implements LLMClient {
  private client: OpenAI
  private config: BaseLLMConfig

  constructor(config: BaseLLMConfig) {
    this.config = config
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('apikey yok')
    }
    this.client = new OpenAI({
      apiKey: apiKey,
    })
  }

  async createResponse(input: string) {
    const response = await this.client.responses.create({
      model: this.config.model,
      input: input,
    })
    return response.output_text
  }
}

export default OpenAIClient
