export const PROVIDERS = {
  CLAUDE: 'claude',
  OPENAI: 'openai',
} as const;

export const PROVIDER_MODELS = {
  [PROVIDERS.CLAUDE]: {
    CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
    CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
    CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',
    CLAUDE_3_5_HAIKU: 'claude-3-5-haiku-20241022',
    CLAUDE_4_OPUS: 'claude-opus-4-20250514',
    CLAUDE_3_7_SONNET: 'claude-3-7-sonnet-20250219',
    CLAUDE_4_SONNET: 'claude-sonnet-4-20250514',
    CLAUDE_4_5_SONNET: 'claude-4-5-sonnet-20240627',
  },
  [PROVIDERS.OPENAI]: {
    GPT_4: 'gpt-4',
    GPT_4_TURBO: 'gpt-4-turbo',
    GPT_4O: 'gpt-4o',
    GPT_4O_MINI: 'gpt-4o-mini',
    GPT_3_5_TURBO: 'gpt-3.5-turbo',
  },
} as const;

export const DEFAULT_MODELS = {
  [PROVIDERS.CLAUDE]: PROVIDER_MODELS[PROVIDERS.CLAUDE].CLAUDE_3_5_SONNET,
  [PROVIDERS.OPENAI]: PROVIDER_MODELS[PROVIDERS.OPENAI].GPT_4O,
} as const;

export const PROVIDER_ENDPOINTS = {
  [PROVIDERS.CLAUDE]: 'https://api.anthropic.com',
  [PROVIDERS.OPENAI]: 'https://api.openai.com',
} as const;

export const PROVIDER_LIMITS = {
  [PROVIDERS.CLAUDE]: {
    MAX_TOKENS: 200000,
    MAX_OUTPUT_TOKENS: 4096,
    RATE_LIMIT_RPM: 1000,
    RATE_LIMIT_TPM: 40000,
  },
  [PROVIDERS.OPENAI]: {
    MAX_TOKENS: 128000,
    MAX_OUTPUT_TOKENS: 4096,
    RATE_LIMIT_RPM: 500,
    RATE_LIMIT_TPM: 30000,
  },
} as const;

export type ProviderName = typeof PROVIDERS[keyof typeof PROVIDERS];
export type ClaudeModel = typeof PROVIDER_MODELS[typeof PROVIDERS.CLAUDE][keyof typeof PROVIDER_MODELS[typeof PROVIDERS.CLAUDE]];
export type OpenAIModel = typeof PROVIDER_MODELS[typeof PROVIDERS.OPENAI][keyof typeof PROVIDER_MODELS[typeof PROVIDERS.OPENAI]];