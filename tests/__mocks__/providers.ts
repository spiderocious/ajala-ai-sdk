import { BaseProvider, ProviderResponse, ProviderKeyConfig, PromptOptions } from '@/types';

export class MockProvider extends BaseProvider {
  readonly name = 'mock';
  readonly supportedModels = ['mock-model-1', 'mock-model-2'];

  async authenticate(config: ProviderKeyConfig): Promise<void> {
    // Mock authentication
    if (!config.private || config.private === 'invalid') {
      throw new Error('Invalid authentication credentials');
    }
  }

  async sendPrompt(prompt: string, options: PromptOptions): Promise<ProviderResponse> {
    // Mock response generation
    const mockResponse: ProviderResponse = {
      content: `Mock response for: ${prompt}`,
      provider: this.name,
      model: options.model || 'mock-model-1',
      metadata: {
        timestamp: Date.now(),
        latency: 100,
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        },
        requestId: 'mock-request-id',
      },
    };

    // Simulate JSON response if requested
    if (options.expectJson) {
      mockResponse.content = JSON.stringify({
        result: 'Mock JSON response',
        data: prompt,
      });
    }

    return mockResponse;
  }
}

export const createMockProvider = () => new MockProvider();