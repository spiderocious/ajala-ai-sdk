/**
 * Tests for Prompts with JSON Validation
 */

import { initialize } from '@/core/ajala';
import { AjalaConfig } from '@/types/config';
import { JsonStructure } from '@/types/validation';
import Anthropic from '@anthropic-ai/sdk';

// Mock the SDK
jest.mock('@anthropic-ai/sdk');

describe('Prompts with JSON Validation', () => {
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

  it('should validate JSON response against schema', async () => {
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

    const schema: JsonStructure = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: true },
      email: { type: 'string', format: 'email', required: true },
    };

    const ai = initialize(config);
    const result = await ai.prompt('Get user info', {
      expectJson: true,
      jsonStructure: schema
    });

    expect(result).toEqual({
      name: 'John',
      age: 25,
      email: 'john@example.com'
    });
  });

  it('should throw error when JSON validation fails', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{ type: 'text', text: '{"name":"John","age":"invalid"}' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: true },
    };

    const ai = initialize(config);

    await expect(
      ai.prompt('Get user info', {
        expectJson: true,
        jsonStructure: schema
      })
    ).rejects.toThrow('JSON validation failed');
  });

  it('should throw error when required field is missing', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{ type: 'text', text: '{"name":"John"}' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: true },
    };

    const ai = initialize(config);

    await expect(
      ai.prompt('Get user info', {
        expectJson: true,
        jsonStructure: schema
      })
    ).rejects.toThrow('JSON validation failed');
  });

  it('should apply default values when specified in schema', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{ type: 'text', text: '{"name":"John"}' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: false, default: 18 },
      active: { type: 'boolean', required: false, default: true },
    };

    const ai = initialize(config);
    const result = await ai.prompt('Get user info', {
      expectJson: true,
      jsonStructure: schema
    });

    expect(result).toEqual({
      name: 'John',
      age: 18,
      active: true
    });
  });

  it('should validate string constraints', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{ type: 'text', text: '{"email":"invalid-email"}' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      email: { type: 'string', format: 'email', required: true },
    };

    const ai = initialize(config);

    await expect(
      ai.prompt('Get email', {
        expectJson: true,
        jsonStructure: schema
      })
    ).rejects.toThrow('JSON validation failed');
  });

  it('should validate number constraints', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{ type: 'text', text: '{"age":150}' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      age: { type: 'number', minimum: 0, maximum: 120, required: true },
    };

    const ai = initialize(config);

    await expect(
      ai.prompt('Get age', {
        expectJson: true,
        jsonStructure: schema
      })
    ).rejects.toThrow('JSON validation failed');
  });

  it('should validate nested objects', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"user":{"name":"Alice","address":{"city":"NYC","zip":"10001"}}}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      user: {
        type: 'object',
        required: true,
        properties: {
          name: { type: 'string', required: true },
          address: {
            type: 'object',
            required: true,
            properties: {
              city: { type: 'string', required: true },
              zip: { type: 'string', required: true },
            },
          },
        },
      },
    };

    const ai = initialize(config);
    const result = await ai.prompt('Get user', {
      expectJson: true,
      jsonStructure: schema
    });

    expect(result).toEqual({
      user: {
        name: 'Alice',
        address: {
          city: 'NYC',
          zip: '10001'
        }
      }
    });
  });

  it('should validate arrays', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"items":[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      items: {
        type: 'array',
        required: true,
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', required: true },
            name: { type: 'string', required: true },
          },
        },
      },
    };

    const ai = initialize(config);
    const result = await ai.prompt('Get items', {
      expectJson: true,
      jsonStructure: schema
    });

    expect(result).toEqual({
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
    });
  });

  it('should work without validation when no schema provided', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{ type: 'text', text: '{"any":"data","whatever":123}' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const ai = initialize(config);
    const result = await ai.prompt('Get data', {
      expectJson: true
    });

    expect(result).toEqual({
      any: 'data',
      whatever: 123
    });
  });

  it('should combine variables, JSON parsing, and validation', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"name":"Bob","email":"bob@example.com","age":30}'
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      name: { type: 'string', required: true },
      email: { type: 'string', format: 'email', required: true },
      age: { type: 'number', minimum: 0, maximum: 120, required: true },
    };

    const ai = initialize(config);
    const result = await ai.prompt(
      'Get user info for {{username}} as JSON',
      {
        expectJson: true,
        jsonStructure: schema
      },
      { username: 'Bob' }
    );

    expect(result).toEqual({
      name: 'Bob',
      email: 'bob@example.com',
      age: 30
    });
  });

  it('should auto-fix JSON before validation', async () => {
    const mockResponse = {
      id: 'msg_123',
      model: 'claude-3-5-sonnet-20241022',
      content: [{
        type: 'text',
        text: '{"name":"Charlie","age":35,}' // trailing comma
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
      role: 'assistant',
      type: 'message',
      stop_reason: 'end_turn',
      stop_sequence: null,
    };

    mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

    const schema: JsonStructure = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: true },
    };

    const ai = initialize(config);
    const result = await ai.prompt('Get user', {
      expectJson: true,
      jsonStructure: schema
    });

    expect(result).toEqual({
      name: 'Charlie',
      age: 35
    });
  });
});
