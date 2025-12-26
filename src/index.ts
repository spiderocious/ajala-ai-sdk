/**
 * Ajala AI SDK
 * A unified TypeScript SDK for multiple AI providers
 */

export { initialize } from './core/ajala';
export { Ajala } from './core/ajala';

// Export types
export type { AjalaConfig, AuthConfig, SettingsConfig } from './types/config';
export type {
  ProviderKeyConfig,
  ProviderResponse,
  PromptOptions,
  ResponseMetadata,
  TokenUsage,
} from './types/provider';
export type {
  JsonStructure,
  JsonFieldSchema,
  ValidationResult,
  ValidationError,
  JsonValidationOptions,
} from './types/validation';

// Export utilities
export { VariableInterpolator, interpolate, extractVariables } from './utils/variable-interpolator';
export { JSONParser, parseJSON, extractJSON } from './utils/json-parser';
export { JSONValidator, validateJSON } from './utils/json-validator';

// Export providers (for advanced usage)
export { ClaudeProvider } from './providers/claude/claude-provider';
export { OpenAIProvider } from './providers/openai/openai-provider';
export { BaseProvider } from './providers/base-provider';

// Export constants
export { PROVIDERS, PROVIDER_MODELS, DEFAULT_MODELS } from './constants/providers';
export { FORMATS } from './constants/formats';

// Default export
import { initialize } from './core/ajala';
export default { initialize };
