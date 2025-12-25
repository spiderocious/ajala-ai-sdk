/**
 * Tests for Claude Provider
 */

import { ClaudeProvider } from '@/providers/claude/claude-provider';
import { ProviderKeyConfig } from '@/types/provider';
import Anthropic from '@anthropic-ai/sdk';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;
  let mockClient: jest.Mocked<Anthropic>;
  const config: ProviderKeyConfig = {
    private: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      messages: {
        create: jest.fn(),
      },
    } as any;

    // Mock Anthropic constructor
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => mockClient);

    provider = new ClaudeProvider(config);
  });

  describe('Constructor and Properties', () => {
    it('should create provider with correct name', () => {
      expect(provider.name).toBe('claude');
    });

    it('should store config', () => {
      expect((provider as any).config).toEqual(config);
    });

    it('should not initialize client until authenticate is called', () => {
      expect((provider as any).client).toBeNull();
    });
  });

  describe('authenticate()', () => {
    it('should create Anthropic client with API key', async () => {
      await provider.authenticate();

      expect(Anthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
      expect((provider as any).client).toBe(mockClient);
    });

    it('should handle authentication errors', async () => {
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => {
        throw new Error('Invalid API key');
      });

      await expect(provider.authenticate()).rejects.toThrow(
        'Claude authentication failed: Invalid API key'
      );
    });

    it('should handle non-Error authentication failures', async () => {
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => {
        throw 'String error';
      });

      await expect(provider.authenticate()).rejects.toThrow(
        'Claude authentication failed: String error'
      );
    });
  });

  describe('sendPrompt()', () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [
        { type: 'text', text: 'Hello! How can I help you?' },
      ],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    beforeEach(async () => {
      await provider.authenticate();
      mockClient.messages.create.mockResolvedValue(mockResponse as any);
    });

    it('should authenticate if client is not initialized', async () => {
      const newProvider = new ClaudeProvider(config);
      mockClient.messages.create.mockResolvedValue(mockResponse as any);

      await newProvider.sendPrompt('Test prompt');

      expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should send basic prompt with default options', async () => {
      const result = await provider.sendPrompt('Test prompt');

      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: 'Test prompt',
          },
        ],
      });

      expect(result).toEqual({
        content: 'Hello! How can I help you?',
        provider: 'claude',
        model: 'claude-3-5-sonnet-20241022',
        metadata: {
          timestamp: expect.any(Number),
          latency: expect.any(Number),
          usage: {
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
          },
          requestId: 'msg_123',
        },
        raw: mockResponse,
      });
    });

    it('should use custom model when specified', async () => {
      await provider.sendPrompt('Test prompt', {
        model: 'claude-3-opus-20240229',
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
        })
      );
    });

    it('should use custom max_tokens when specified', async () => {
      await provider.sendPrompt('Test prompt', {
        providerOptions: {
          max_tokens: 1000,
        },
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000,
        })
      );
    });

    it('should pass through additional provider options', async () => {
      await provider.sendPrompt('Test prompt', {
        providerOptions: {
          temperature: 0.7,
          top_p: 0.9,
          stop_sequences: ['\n\n'],
        },
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          top_p: 0.9,
          stop_sequences: ['\n\n'],
        })
      );
    });

    it('should extract text content from response', async () => {
      const multiBlockResponse = {
        ...mockResponse,
        content: [
          { type: 'text', text: 'First block' },
          { type: 'text', text: 'Second block' },
        ],
      };
      mockClient.messages.create.mockResolvedValue(multiBlockResponse as any);

      const result = await provider.sendPrompt('Test prompt');

      expect(result.content).toBe('First block\nSecond block');
    });

    it('should filter out non-text content blocks', async () => {
      const mixedResponse = {
        ...mockResponse,
        content: [
          { type: 'text', text: 'Text content' },
          { type: 'tool_use', id: 'tool_123', name: 'search' },
          { type: 'text', text: 'More text' },
        ],
      };
      mockClient.messages.create.mockResolvedValue(mixedResponse as any);

      const result = await provider.sendPrompt('Test prompt');

      expect(result.content).toBe('Text content\nMore text');
    });

    it('should calculate latency correctly', async () => {
      const startTime = Date.now();

      // Simulate API delay
      mockClient.messages.create.mockImplementation(async () => {
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

    it('should include request ID in metadata', async () => {
      const result = await provider.sendPrompt('Test prompt');

      expect(result.metadata.requestId).toBe('msg_123');
    });

    it('should include raw response', async () => {
      const result = await provider.sendPrompt('Test prompt');

      expect(result.raw).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      mockClient.messages.create.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(provider.sendPrompt('Test prompt')).rejects.toThrow(
        'Claude API error: Rate limit exceeded'
      );
    });

    it('should handle non-Error API failures', async () => {
      mockClient.messages.create.mockRejectedValue('Network error');

      await expect(provider.sendPrompt('Test prompt')).rejects.toThrow(
        'Claude API error: Network error'
      );
    });

    it('should handle empty content array', async () => {
      const emptyResponse = {
        ...mockResponse,
        content: [],
      };
      mockClient.messages.create.mockResolvedValue(emptyResponse as any);

      const result = await provider.sendPrompt('Test prompt');

      expect(result.content).toBe('');
    });
  });

  describe('getDefaultModel()', () => {
    it('should return correct default model', () => {
      const defaultModel = (provider as any).getDefaultModel();
      expect(defaultModel).toBe('claude-3-5-sonnet-20241022');
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(async () => {
      await provider.authenticate();
    });

    it('should handle multiple sequential prompts', async () => {
      const response1 = {
        id: 'msg_1',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Response 1' }],
        usage: { input_tokens: 5, output_tokens: 10 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      const response2 = {
        id: 'msg_2',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Response 2' }],
        usage: { input_tokens: 8, output_tokens: 12 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      mockClient.messages.create
        .mockResolvedValueOnce(response1 as any)
        .mockResolvedValueOnce(response2 as any);

      const result1 = await provider.sendPrompt('First prompt');
      const result2 = await provider.sendPrompt('Second prompt');

      expect(result1.content).toBe('Response 1');
      expect(result2.content).toBe('Response 2');
      expect(mockClient.messages.create).toHaveBeenCalledTimes(2);
    });

    it('should handle different models in sequence', async () => {
      const mockResponse = {
        id: 'msg_123',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      mockClient.messages.create.mockResolvedValue(mockResponse as any);

      await provider.sendPrompt('Prompt 1', { model: 'claude-3-5-sonnet-20241022' });
      await provider.sendPrompt('Prompt 2', { model: 'claude-3-opus-20240229' });

      expect(mockClient.messages.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ model: 'claude-3-5-sonnet-20241022' })
      );
      expect(mockClient.messages.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ model: 'claude-3-opus-20240229' })
      );
    });

    it('should preserve provider name across calls', async () => {
      const mockResponse = {
        id: 'msg_123',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      mockClient.messages.create.mockResolvedValue(mockResponse as any);

      const result1 = await provider.sendPrompt('Test 1');
      const result2 = await provider.sendPrompt('Test 2');

      expect(result1.provider).toBe('claude');
      expect(result2.provider).toBe('claude');
    });
  });
});
