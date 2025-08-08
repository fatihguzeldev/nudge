import { BaseLLMConfig, ChatInput, LLMClient } from './types'
import OpenAIClient from './openai'
import {
  NUDGE_PROMPTS_ARRAY,
  SYSTEM_PROMPTS_ARRAY,
} from './prompts/nudgePrompts'

class LLMService {
  private client!: LLMClient
  private promptHistory: string[] = []

  constructor(config: BaseLLMConfig, clientType: string) {
    switch (clientType) {
      case 'openai':
        this.client = new OpenAIClient(config)
        break
      default:
        throw new Error(`Bu client type desteklenmiyor: ${clientType}`)
    }
  }

  async generateResponse() {
    let nudgePrompt = ''
    if (this.promptHistory.length > 0) {
      const historyText = this.promptHistory.join('\n')
      const oldResponses = `Eskiden bunları yazdın:\n${historyText}\n\nBunlara benzer yazma, yaratıcı ol.`
      nudgePrompt = `${oldResponses}`
    }
    nudgePrompt +=
      NUDGE_PROMPTS_ARRAY[
        Math.floor(Math.random() * NUDGE_PROMPTS_ARRAY.length)
      ].text

    const systemPrompt =
      SYSTEM_PROMPTS_ARRAY[
        Math.floor(Math.random() * SYSTEM_PROMPTS_ARRAY.length)
      ].text

    const apiInput: ChatInput[] = [
      {
        role: 'system' as const,
        content: [{ type: 'input_text', text: systemPrompt }],
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'input_text',
            text: nudgePrompt,
          },
        ],
      },
    ]
    const response = await this.client.createResponse(apiInput)
    this.promptHistory.push(response)
    return response
  }
}

export default LLMService
