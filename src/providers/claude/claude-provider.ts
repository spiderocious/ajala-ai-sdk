/**
 * Claude Provider
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from '../base-provider';
import { ProviderKeyConfig, ProviderResponse, PromptOptions } from '../../types/provider';
import { PROVIDERS, DEFAULT_MODELS } from '../../constants/providers';

export class ClaudeProvider extends BaseProvider {
  readonly name = 'claude';
  private client: Anthropic | null = null;

  constructor(config: ProviderKeyConfig) {
    super(config);
  }

  async authenticate(): Promise<void> {
    try {
      this.client = new Anthropic({
        apiKey: this.config.private,
      });

      // Test the connection with a minimal request
      // Note: Anthropic doesn't have a dedicated auth endpoint,
      // so we consider it authenticated if the client was created
    } catch (error) {
      throw new Error(
        `Claude authentication failed: ${error instanceof Error ? error.message : String(error)}`
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
      const response = await this.client!.messages.create({
        model,
        max_tokens: options.providerOptions?.max_tokens || 4096,
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
      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      return {
        content,
        provider: this.name,
        model: response.model,
        metadata: {
          timestamp: startTime,
          latency,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          },
          requestId: response.id,
        },
        raw: response,
      };
    } catch (error) {
      throw new Error(
        `Claude API error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  protected getDefaultModel(): string {
    return DEFAULT_MODELS[PROVIDERS.CLAUDE];
  }
}
