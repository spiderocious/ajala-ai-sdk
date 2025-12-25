/**
 * OpenAI Provider
 */

import OpenAI from 'openai';
import { BaseProvider } from '../base-provider';
import { ProviderKeyConfig, ProviderResponse, PromptOptions } from '../../types/provider';
import { PROVIDERS, DEFAULT_MODELS } from '../../constants/providers';

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai';
  private client: OpenAI | null = null;

  constructor(config: ProviderKeyConfig) {
    super(config);
  }

  async authenticate(): Promise<void> {
    try {
      this.client = new OpenAI({
        apiKey: this.config.private,
      });

      // Test the connection with a minimal request
      // Note: OpenAI doesn't have a dedicated auth endpoint,
      // so we consider it authenticated if the client was created
    } catch (error) {
      throw new Error(
        `OpenAI authentication failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async sendPrompt(prompt: string, options: PromptOptions = {}): Promise<ProviderResponse> {
    if (!this.client) {
      await this.authenticate();
    }

    const startTime = Date.now();
    const model = this.getModel(options);

    try {
      const response = await this.client!.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        ...options.providerOptions,
      });

      const latency = Date.now() - startTime;

      // Extract text content
      const content = response.choices
        .map((choice) => choice.message.content || '')
        .join('\n');

      return {
        content,
        provider: this.name,
        model: response.model,
        metadata: {
          timestamp: startTime,
          latency,
          usage: {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          },
          requestId: response.id,
        },
        raw: response,
      };
    } catch (error) {
      throw new Error(
        `OpenAI API error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  protected getDefaultModel(): string {
    return DEFAULT_MODELS[PROVIDERS.OPENAI];
  }
}
