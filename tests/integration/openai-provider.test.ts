/**
 * Tests for OpenAI Provider
 */

import { OpenAIProvider } from '@/providers/openai/openai-provider';
import { ProviderKeyConfig } from '@/types/provider';
import OpenAI from 'openai';

// Mock the OpenAI SDK
jest.mock('openai');

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockClient: jest.Mocked<OpenAI>;
  const config: ProviderKeyConfig = {
    private: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);

    provider = new OpenAIProvider(config);
  });

  describe('Constructor and Properties', () => {
    it('should create provider with correct name', () => {
      expect(provider.name).toBe('openai');
    });

    it('should store config', () => {
      expect((provider as any).config).toEqual(config);
    });

    it('should not initialize client until authenticate is called', () => {
      expect((provider as any).client).toBeNull();
    });
  });

  describe('authenticate()', () => {
    it('should create OpenAI client with API key', async () => {
      await provider.authenticate();

      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
      expect((provider as any).client).toBe(mockClient);
    });

    it('should handle authentication errors', async () => {
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => {
        throw new Error('Invalid API key');
      });

      await expect(provider.authenticate()).rejects.toThrow(
        'OpenAI authentication failed: Invalid API key'
      );
    });

    it('should handle non-Error authentication failures', async () => {
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => {
        throw 'String error';
      });

      await expect(provider.authenticate()).rejects.toThrow(
        'OpenAI authentication failed: String error'
      );
    });
  });

  describe('sendPrompt()', () => {
    const mockResponse = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      model: 'gpt-4o',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you?',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    };

    beforeEach(async () => {
      await provider.authenticate();
      mockClient.chat.completions.create.mockResolvedValue(mockResponse as any);
    });

    it('should authenticate if client is not initialized', async () => {
      const newProvider = new OpenAIProvider(config);
      mockClient.chat.completions.create.mockResolvedValue(mockResponse as any);

      await newProvider.sendPrompt('Test prompt');

      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should send basic prompt with default options', async () => {
      const result = await provider.sendPrompt('Test prompt');

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Test prompt',
          },
        ],
      });

      expect(result).toEqual({
        content: 'Hello! How can I help you?',
        provider: 'openai',
        model: 'gpt-4o',
        metadata: {
          timestamp: expect.any(Number),
          latency: expect.any(Number),
          usage: {
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
          },
          requestId: 'chatcmpl-123',
        },
        raw: mockResponse,
      });
    });

    it('should use custom model when specified', async () => {
      await provider.sendPrompt('Test prompt', {
        model: 'gpt-4-turbo',
      });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo',
        })
      );
    });

    it('should pass through additional provider options', async () => {
      await provider.sendPrompt('Test prompt', {
        providerOptions: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000,
        },
      });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000,
        })
      );
    });

    it('should extract content from multiple choices', async () => {
      const multiChoiceResponse = {
        ...mockResponse,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'First choice' },
            finish_reason: 'stop',
          },
          {
            index: 1,
            message: { role: 'assistant', content: 'Second choice' },
            finish_reason: 'stop',
          },
        ],
      };
      mockClient.chat.completions.create.mockResolvedValue(multiChoiceResponse as any);

      const result = await provider.sendPrompt('Test prompt');

      expect(result.content).toBe('First choice\nSecond choice');
    });

    it('should handle null content in choices', async () => {
      const nullContentResponse = {
        ...mockResponse,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: null },
            finish_reason: 'stop',
          },
        ],
      };
      mockClient.chat.completions.create.mockResolvedValue(nullContentResponse as any);

      const result = await provider.sendPrompt('Test prompt');

      expect(result.content).toBe('');
    });

    it('should calculate latency correctly', async () => {
      const startTime = Date.now();

      // Simulate API delay
      mockClient.chat.completions.create.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockResponse as any;
      });

      const result = await provider.sendPrompt('Test prompt');

      expect(result.metadata.latency).toBeGreaterThanOrEqual(100);
      expect(result.metadata.timestamp).toBeGreaterThanOrEqual(startTime);
    });

    it('should calculate token usage correctly', async () => {
      const result = await provider.sendPrompt('Test prompt');

      expect(result.metadata.usage).toEqual({
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      });
    });

    it('should handle missing usage data', async () => {
      const noUsageResponse = {
        ...mockResponse,
        usage: undefined,
      };
      mockClient.chat.completions.create.mockResolvedValue(noUsageResponse as any);

      const result = await provider.sendPrompt('Test prompt');

      expect(result.metadata.usage).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      });
    });

    it('should include request ID in metadata', async () => {
      const result = await provider.sendPrompt('Test prompt');

      expect(result.metadata.requestId).toBe('chatcmpl-123');
    });

    it('should include raw response', async () => {
      const result = await provider.sendPrompt('Test prompt');

      expect(result.raw).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      mockClient.chat.completions.create.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(provider.sendPrompt('Test prompt')).rejects.toThrow(
        'OpenAI API error: Rate limit exceeded'
      );
    });

    it('should handle non-Error API failures', async () => {
      mockClient.chat.completions.create.mockRejectedValue('Network error');

      await expect(provider.sendPrompt('Test prompt')).rejects.toThrow(
        'OpenAI API error: Network error'
      );
    });

    it('should handle empty choices array', async () => {
      const emptyResponse = {
        ...mockResponse,
        choices: [],
      };
      mockClient.chat.completions.create.mockResolvedValue(emptyResponse as any);

      const result = await provider.sendPrompt('Test prompt');

      expect(result.content).toBe('');
    });
  });

  describe('getDefaultModel()', () => {
    it('should return correct default model', () => {
      const defaultModel = (provider as any).getDefaultModel();
      expect(defaultModel).toBe('gpt-4o');
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(async () => {
      await provider.authenticate();
    });

    it('should handle multiple sequential prompts', async () => {
      const response1 = {
        id: 'chatcmpl-1',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response 1' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      const response2 = {
        id: 'chatcmpl-2',
        object: 'chat.completion',
        created: 1677652289,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response 2' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 8, completion_tokens: 12, total_tokens: 20 },
      };

      mockClient.chat.completions.create
        .mockResolvedValueOnce(response1 as any)
        .mockResolvedValueOnce(response2 as any);

      const result1 = await provider.sendPrompt('First prompt');
      const result2 = await provider.sendPrompt('Second prompt');

      expect(result1.content).toBe('Response 1');
      expect(result2.content).toBe('Response 2');
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it('should handle different models in sequence', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse as any);

      await provider.sendPrompt('Prompt 1', { model: 'gpt-4o' });
      await provider.sendPrompt('Prompt 2', { model: 'gpt-4-turbo' });

      expect(mockClient.chat.completions.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ model: 'gpt-4o' })
      );
      expect(mockClient.chat.completions.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ model: 'gpt-4-turbo' })
      );
    });

    it('should preserve provider name across calls', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result1 = await provider.sendPrompt('Test 1');
      const result2 = await provider.sendPrompt('Test 2');

      expect(result1.provider).toBe('openai');
      expect(result2.provider).toBe('openai');
    });
  });
});
