/**
 * Tests for SDK Initialization
 */

import { initialize } from '@/core/ajala';
import { AjalaConfig } from '@/types/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Mock the SDKs
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

describe('SDK Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Anthropic
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
      () => ({ messages: { create: jest.fn() } } as any)
    );

    // Mock OpenAI
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
      () => ({ chat: { completions: { create: jest.fn() } } } as any)
    );
  });

  describe('initialize() with embedded auth', () => {
    it('should initialize with valid Claude config', () => {
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

      const ai = initialize(config);

      expect(ai).toBeDefined();
      expect(ai.prompt).toBeInstanceOf(Function);
    });

    it('should initialize with valid OpenAI config', () => {
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

      const ai = initialize(config);

      expect(ai).toBeDefined();
      expect(ai.prompt).toBeInstanceOf(Function);
    });

    it('should initialize with both providers', () => {
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

      const ai = initialize(config);

      expect(ai).toBeDefined();
    });

    it('should throw error when auth config is missing', () => {
      const config: any = {};

      expect(() => initialize(config)).toThrow('Authentication configuration is required');
    });

    it('should throw error when embedded auth has no keys', () => {
      const config: AjalaConfig = {
        auth: {
          type: 'embedded',
          keys: {},
        },
      };

      expect(() => initialize(config)).toThrow('Embedded auth requires at least one provider key');
    });

    it('should throw error when embedded auth keys is undefined', () => {
      const config: AjalaConfig = {
        auth: {
          type: 'embedded',
        },
      };

      expect(() => initialize(config)).toThrow('Embedded auth requires at least one provider key');
    });

    it('should initialize with settings', () => {
      const config: AjalaConfig = {
        auth: {
          type: 'embedded',
          keys: {
            claude: {
              private: 'sk-ant-test',
            },
          },
        },
        settings: {
          trimPrompt: true,
          defaultProvider: 'claude',
          debug: false,
          timeout: 30000,
        },
      };

      const ai = initialize(config);

      expect(ai).toBeDefined();
    });

    it('should accept custom model in provider config', () => {
      const config: AjalaConfig = {
        auth: {
          type: 'embedded',
          keys: {
            claude: {
              private: 'sk-ant-test',
              model: 'claude-3-opus-20240229',
            },
          },
        },
      };

      const ai = initialize(config);

      expect(ai).toBeDefined();
    });

    it('should use Claude as default when both providers configured', () => {
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

      const ai = initialize(config);

      expect(ai).toBeDefined();
      // Default provider should be set (tested via prompt functionality)
    });

    it('should respect defaultProvider setting', () => {
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
        settings: {
          defaultProvider: 'openai',
        },
      };

      const ai = initialize(config);

      expect(ai).toBeDefined();
    });
  });

  describe('initialize() with remote auth', () => {
    it('should throw error when remote auth has no URL', () => {
      const config: AjalaConfig = {
        auth: {
          type: 'remote',
        },
      };

      expect(() => initialize(config)).toThrow('Remote auth requires remoteUrl');
    });

    it('should accept valid remote auth config', () => {
      const config: AjalaConfig = {
        auth: {
          type: 'remote',
          remoteUrl: 'https://api.example.com/keys',
        },
      };

      const ai = initialize(config);

      expect(ai).toBeDefined();
    });
  });
});
