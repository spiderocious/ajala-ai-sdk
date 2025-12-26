/**
 * Tests for Prompts with Variable Substitution
 */

import { initialize } from '@/core/ajala';
import { AjalaConfig } from '@/types/config';
import Anthropic from '@anthropic-ai/sdk';

// Mock the SDK
jest.mock('@anthropic-ai/sdk');

describe('Prompts with Variable Substitution', () => {
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
  });

  it('should substitute simple variable in prompt', async () => {
    const ai = initialize(config);

    await ai.prompt('Hello {{name}}!', {}, { name: 'Alice' });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello Alice!' }],
      })
    );
  });

  it('should substitute multiple variables', async () => {
    const ai = initialize(config);

    await ai.prompt('Write a story about {{topic}} in {{style}} style', {}, {
      topic: 'robots',
      style: 'sci-fi'
    });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Write a story about robots in sci-fi style' }],
      })
    );
  });

  it('should substitute nested variables', async () => {
    const ai = initialize(config);

    await ai.prompt('Hello {{user.name}}!', {}, {
      user: { name: 'Bob', age: 30 }
    });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello Bob!' }],
      })
    );
  });

  it('should throw error for missing variable', async () => {
    const ai = initialize(config);

    await expect(
      ai.prompt('Hello {{name}}!', {}, { age: 30 })
    ).rejects.toThrow("Missing required variable: {{name}}");
  });

  it('should work with prompts that have no variables', async () => {
    const ai = initialize(config);

    await ai.prompt('Hello world!', {}, { extra: 'variable' });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello world!' }],
      })
    );
  });

  it('should work when no variables object provided and no variables in prompt', async () => {
    const ai = initialize(config);

    await ai.prompt('Hello world!');

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello world!' }],
      })
    );
  });

  it('should handle extra variables without error', async () => {
    const ai = initialize(config);

    await ai.prompt('Hello {{name}}!', {}, {
      name: 'Alice',
      extra: 'variable',
      another: 'value'
    });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello Alice!' }],
      })
    );
  });

  it('should substitute variables before sending to provider', async () => {
    const ai = initialize(config);

    await ai.prompt('User {{user.name}} is {{user.age}} years old', {}, {
      user: { name: 'Charlie', age: 25 }
    });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'User Charlie is 25 years old' }],
      })
    );
  });

  it('should handle number variables', async () => {
    const ai = initialize(config);

    await ai.prompt('The answer is {{answer}}', {}, { answer: 42 });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'The answer is 42' }],
      })
    );
  });

  it('should handle boolean variables', async () => {
    const ai = initialize(config);

    await ai.prompt('Is active: {{isActive}}', {}, { isActive: true });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Is active: true' }],
      })
    );
  });

  it('should handle array variables', async () => {
    const ai = initialize(config);

    await ai.prompt('Tags: {{tags}}', {}, { tags: ['js', 'ts', 'node'] });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Tags: js, ts, node' }],
      })
    );
  });

  it('should handle object variables', async () => {
    const ai = initialize(config);

    await ai.prompt('Config: {{config}}', {}, {
      config: { debug: true, port: 3000 }
    });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Config: {"debug":true,"port":3000}' }],
      })
    );
  });

  it('should substitute same variable multiple times', async () => {
    const ai = initialize(config);

    await ai.prompt('{{name}} says hello. {{name}} is friendly.', {}, { name: 'Dave' });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Dave says hello. Dave is friendly.' }],
      })
    );
  });

  it('should work with complex nested structures', async () => {
    const ai = initialize(config);

    await ai.prompt(
      'Company: {{company.name}}, Location: {{company.address.city}}',
      {},
      {
        company: {
          name: 'TechCorp',
          address: {
            city: 'San Francisco',
            state: 'CA'
          }
        }
      }
    );

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Company: TechCorp, Location: San Francisco' }],
      })
    );
  });

  it('should handle zero as valid value', async () => {
    const ai = initialize(config);

    await ai.prompt('Count: {{count}}', {}, { count: 0 });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Count: 0' }],
      })
    );
  });

  it('should handle empty string as valid value', async () => {
    const ai = initialize(config);

    await ai.prompt('Value: "{{value}}"', {}, { value: '' });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Value: ""' }],
      })
    );
  });

  it('should handle false as valid value', async () => {
    const ai = initialize(config);

    await ai.prompt('Flag: {{flag}}', {}, { flag: false });

    expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Flag: false' }],
      })
    );
  });
});
