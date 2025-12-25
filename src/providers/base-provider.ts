/**
 * Base Provider
 */

import { ProviderKeyConfig, ProviderResponse, PromptOptions } from '../types/provider';

export abstract class BaseProvider {
  /** Provider name */
  abstract readonly name: string;

  /** Provider configuration */
  protected config: ProviderKeyConfig;

  constructor(config: ProviderKeyConfig) {
    this.config = config;
  }

  /**
   * Authenticate with the provider
   */
  abstract authenticate(): Promise<void>;

  /**
   * Send a prompt to the provider
   */
  abstract sendPrompt(prompt: string, options?: PromptOptions): Promise<ProviderResponse>;

  /**
   * Get the model to use
   */
  protected getModel(options?: PromptOptions): string {
    return options?.model || this.config.model || this.getDefaultModel();
  }

  /**
   * Get default model for this provider
   */
  protected abstract getDefaultModel(): string;
}
