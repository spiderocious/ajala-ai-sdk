/**
 * Configuration Types for Ajala SDK
 */

import { ProviderKeyConfig } from './provider';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Authentication type */
  type: 'embedded' | 'remote';

  /** Provider keys for embedded auth */
  keys?: {
    claude?: ProviderKeyConfig;
    openai?: ProviderKeyConfig;
  };

  /** Remote key fetching URL for remote auth */
  remoteUrl?: string;
}

/**
 * SDK Settings configuration
 */
export interface SettingsConfig {
  /** Auto-trim whitespace from prompts */
  trimPrompt?: boolean;

  /** Default provider to use */
  defaultProvider?: 'claude' | 'openai';

  /** Enable debug logging */
  debug?: boolean;

  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Main SDK configuration
 */
export interface AjalaConfig {
  /** Authentication configuration */
  auth: AuthConfig;

  /** Settings configuration */
  settings?: SettingsConfig;
}
