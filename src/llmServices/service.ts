import { BaseLLMConfig, LLMClient } from './types'
import OpenAIClient from './openai'

class LLMService {
  private client!: LLMClient

  constructor(config: BaseLLMConfig, clientType: string) {
    switch (clientType) {
      case 'openai':
        this.client = new OpenAIClient(config)
    }
  }

  async generateResponse(input: string) {
    return await this.client.createResponse(input)
  }
}

export default LLMService
