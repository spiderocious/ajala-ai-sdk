/**
 * Tests for Prompts with JSON Responses
 */

import { initialize } from '@/core/ajala';
import { AjalaConfig } from '@/types/config';
import Anthropic from '@anthropic-ai/sdk';

// Mock the SDK
jest.mock('@anthropic-ai/sdk');

describe('Prompts with JSON Responses', () => {
  let mockAnthropicClient: any;

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
  });

  it('should parse valid JSON response', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{ type: 'text', text: '{"name":"John","age":25,"email":"john@example.com"}' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt(
      'Return user info for {{name}}',
      { expectJson: true },
      { name: 'John' }
    );

    expect(result).toEqual({
      name: 'John',
      age: 25,
      email: 'john@example.com'
    });
  });

  it('should auto-fix JSON with trailing commas', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{ type: 'text', text: '{"name":"Alice","age":30,}' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get user info', { expectJson: true });

    expect(result).toEqual({
      name: 'Alice',
      age: 30
    });
  });

  it('should extract JSON from markdown code blocks', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: 'Here is the data:\n```json\n{"status":"success","data":{"id":1}}\n```'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get status', { expectJson: true });

    expect(result).toEqual({
      status: 'success',
      data: { id: 1 }
    });
  });

  it('should handle JSON with comments', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{\n  // User data\n  "name": "Bob",\n  "age": 35\n}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get user', { expectJson: true });

    expect(result).toEqual({
      name: 'Bob',
      age: 35
    });
  });

  it('should fix unclosed brackets', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"items": [1, 2, 3'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get items', { expectJson: true });

    expect(result).toEqual({
      items: [1, 2, 3]
    });
  });

  it('should throw error for unparseable JSON', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: 'This is not JSON at all!'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);

    await expect(
      ai.prompt('Get data', { expectJson: true })
    ).rejects.toThrow('Failed to parse JSON response');
  });

  it('should return text when expectJson is false', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"name":"John"}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get data', { expectJson: false });

    expect(typeof result).toBe('string');
    expect(result).toBe('{"name":"John"}');
  });

  it('should return text by default (no expectJson)', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"name":"John"}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get data');

    expect(typeof result).toBe('string');
    expect(result).toBe('{"name":"John"}');
  });

  it('should handle arrays as JSON', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '[{"id":1},{"id":2},{"id":3}]'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get items', { expectJson: true });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 }
    ]);
  });

  it('should handle nested objects', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"user":{"name":"Charlie","address":{"city":"NYC","state":"NY"}}}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get user', { expectJson: true });

    expect(result).toEqual({
      user: {
        name: 'Charlie',
        address: {
          city: 'NYC',
          state: 'NY'
        }
      }
    });
  });

  it('should combine variable substitution with JSON parsing', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"name":"Dave","age":28,"role":"developer"}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt(
      'Return user info for {{name}} as JSON',
      { expectJson: true },
      { name: 'Dave' }
    );

    expect(result).toEqual({
      name: 'Dave',
      age: 28,
      role: 'developer'
    });
  });

  it('should handle empty object', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get data', { expectJson: true });

    expect(result).toEqual({});
  });

  it('should handle empty array', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '[]'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get items', { expectJson: true });

    expect(result).toEqual([]);
  });
});
