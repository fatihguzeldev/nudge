export interface LLMClient {
  createResponse(input: string): Promise<any>
}

export interface BaseLLMConfig {
  model: string
  temperature: string
  maxTokens: string
}
