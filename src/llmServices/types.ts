export interface LLMClient {
  createResponse(input: ChatInput[]): Promise<string>
}

export interface BaseLLMConfig {
  model: string
  temperature: string
  maxTokens: string
}

export interface ChatInput {
  role: 'system' | 'user' | 'assistant'
  content: Array<{
    type: 'input_text'
    text: string
  }>
}
