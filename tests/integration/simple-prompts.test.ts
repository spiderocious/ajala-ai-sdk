/**
 * Tests for Simple Prompts
 */

import { initialize } from '@/core/ajala';
import { AjalaConfig } from '@/types/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Mock the SDKs
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

describe('Simple Prompts', () => {
  let mockAnthropicClient: any;
  let mockOpenAIClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Anthropic client
    mockAnthropicClient = {
      messages: {
        create: jest.fn(),
      },
    };

    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
      () => mockAnthropicClient
    );

    // Mock OpenAI client
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIClient);
  });

  describe('prompt() with Claude', () => {
    const config: AjalaConfig = {
      auth: {
        type: 'embedded',
        keys: {
          claude: {
            private: 'sk-ant-test',
          },
        },
      },
    };

    it('should send simple text prompt and return response', async () => {
      const mockResponse = {
        id: 'msg_123',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: '2 + 2 equals 4' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const ai = initialize(config);
      const result = await ai.prompt('What is 2 + 2?');

      expect(result).toBe('2 + 2 equals 4');
      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'What is 2 + 2?' }],
        })
      );
    });

    it('should trim prompt by default', async () => {
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

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const ai = initialize(config);
      await ai.prompt('  \n  Hello  \n  ');

      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      );
    });

    it('should not trim prompt when trimPrompt is false', async () => {
      const configNoTrim: AjalaConfig = {
        ...config,
        settings: {
          trimPrompt: false,
        },
      };

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

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const ai = initialize(configNoTrim);
      await ai.prompt('  \n  Hello  \n  ');

      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: '  \n  Hello  \n  ' }],
        })
      );
    });

    it('should handle provider errors', async () => {
      mockAnthropicClient.messages.create.mockRejectedValue(new Error('API Error'));

      const ai = initialize(config);

      await expect(ai.prompt('Test')).rejects.toThrow('Claude API error: API Error');
    });

    it('should send multiple prompts in sequence', async () => {
      const mockResponse1 = {
        id: 'msg_1',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Response 1' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      const mockResponse2 = {
        id: 'msg_2',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Response 2' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      mockAnthropicClient.messages.create
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const ai = initialize(config);

      const result1 = await ai.prompt('First prompt');
      const result2 = await ai.prompt('Second prompt');

      expect(result1).toBe('Response 1');
      expect(result2).toBe('Response 2');
      expect(mockAnthropicClient.messages.create).toHaveBeenCalledTimes(2);
    });

    it('should pass provider options to underlying provider', async () => {
      const mockResponse = {
        id: 'msg_123',
        model: 'claude-3-opus-20240229',
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const ai = initialize(config);
      await ai.prompt('Test', {
        model: 'claude-3-opus-20240229',
        providerOptions: {
          max_tokens: 1000,
          temperature: 0.7,
        },
      });

      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          temperature: 0.7,
        })
      );
    });
  });

  describe('prompt() with OpenAI', () => {
    const config: AjalaConfig = {
      auth: {
        type: 'embedded',
        keys: {
          openai: {
            private: 'sk-test',
          },
        },
      },
    };

    it('should send simple text prompt and return response', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: '2 + 2 equals 4' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

      const ai = initialize(config);
      const result = await ai.prompt('What is 2 + 2?');

      expect(result).toBe('2 + 2 equals 4');
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'What is 2 + 2?' }],
        })
      );
    });

    it('should handle provider errors', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const ai = initialize(config);

      await expect(ai.prompt('Test')).rejects.toThrow('OpenAI API error: API Error');
    });
  });

  describe('prompt() with multiple providers', () => {
    const config: AjalaConfig = {
      auth: {
        type: 'embedded',
        keys: {
          claude: {
            private: 'sk-ant-test',
          },
          openai: {
            private: 'sk-test',
          },
        },
      },
    };

    it('should use default provider (Claude) when no provider specified', async () => {
      const mockResponse = {
        id: 'msg_123',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Claude response' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        role: 'assistant',
        type: 'message',
        stop_reason: 'end_turn',
        stop_sequence: null,
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const ai = initialize(config);
      const result = await ai.prompt('Test');

      expect(result).toBe('Claude response');
      expect(mockAnthropicClient.messages.create).toHaveBeenCalled();
      expect(mockOpenAIClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should use specified provider', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'OpenAI response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

      const ai = initialize(config);
      const result = await ai.prompt('Test', { provider: 'openai' });

      expect(result).toBe('OpenAI response');
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled();
      expect(mockAnthropicClient.messages.create).not.toHaveBeenCalled();
    });

    it('should throw error for unconfigured provider', async () => {
      const ai = initialize(config);

      await expect(ai.prompt('Test', { provider: 'gemini' as any })).rejects.toThrow(
        "Provider 'gemini' not configured"
      );
    });
  });
});
