/**
 * Core Ajala SDK Class
 */

import { AjalaConfig } from '../types/config';
import { PromptOptions } from '../types/provider';
import { BaseProvider } from '../providers/base-provider';
import { ClaudeProvider } from '../providers/claude/claude-provider';
import { OpenAIProvider } from '../providers/openai/openai-provider';
import { VariableInterpolator } from '../utils/variable-interpolator';
import { JSONParser } from '../utils/json-parser';
import { JSONValidator } from '../utils/json-validator';
import { JsonStructure } from '../types/validation';

export class Ajala {
  private config: AjalaConfig;
  private providers: Map<string, BaseProvider> = new Map();
  private defaultProvider: BaseProvider | null = null;

  constructor(config: AjalaConfig) {
    this.config = config;
    this.validateConfig(config);
    this.initializeProviders();
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: AjalaConfig): void {
    if (!config.auth) {
      throw new Error('Authentication configuration is required');
    }

    if (config.auth.type === 'embedded') {
      if (!config.auth.keys || Object.keys(config.auth.keys).length === 0) {
        throw new Error('Embedded auth requires at least one provider key');
      }
    }

    if (config.auth.type === 'remote') {
      if (!config.auth.remoteUrl) {
        throw new Error('Remote auth requires remoteUrl');
      }
    }
  }

  /**
   * Initialize provider instances
   */
  private initializeProviders(): void {
    if (this.config.auth.type === 'embedded' && this.config.auth.keys) {
      const { claude, openai } = this.config.auth.keys;

      if (claude) {
        const claudeProvider = new ClaudeProvider(claude);
        this.providers.set('claude', claudeProvider);
      }

      if (openai) {
        const openaiProvider = new OpenAIProvider(openai);
        this.providers.set('openai', openaiProvider);
      }

      // Set default provider
      const defaultProviderName =
        this.config.settings?.defaultProvider ||
        (claude ? 'claude' : openai ? 'openai' : null);

      if (defaultProviderName) {
        this.defaultProvider = this.providers.get(defaultProviderName) || null;
      }

      if (!this.defaultProvider && this.providers.size > 0) {
        // Use first available provider as default
        this.defaultProvider = Array.from(this.providers.values())[0] || null;
      }
    }
  }

  /**
   * Send a prompt to AI and get text response or JSON object
   *
   * @param prompt - The prompt text (can include {{variables}})
   * @param options - Prompt options
   * @param variables - Variables for interpolation
   * @returns Text response from AI or parsed JSON object
   */
  async prompt(
    prompt: string,
    options: PromptOptions = {},
    variables?: Record<string, any>
  ): Promise<string | any> {
    // Apply variable substitution if variables provided
    let processedPrompt = prompt;
    if (variables) {
      processedPrompt = VariableInterpolator.interpolate(prompt, variables);
    }

    // Trim prompt if configured
    if (this.config.settings?.trimPrompt !== false) {
      processedPrompt = processedPrompt.trim();
    }

    // Get provider
    const provider = this.getProvider(options.provider);

    if (!provider) {
      throw new Error('No provider available');
    }

    // Send prompt to provider
    const response = await provider.sendPrompt(processedPrompt, options);

    // Parse JSON if requested
    if (options.expectJson) {
      let parsedJson: any;

      try {
        parsedJson = JSONParser.parse(response.content, { autoFix: true });
      } catch (error) {
        throw new Error(
          `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Validate JSON if schema provided
      if (options.jsonStructure) {
        const validationResult = JSONValidator.validate(parsedJson, options.jsonStructure as JsonStructure, {
          useDefaults: true,
          removeAdditional: false,
        });

        if (!validationResult.valid) {
          const errors = validationResult.errors
            .map(err => `${err.path}: ${err.message}`)
            .join(', ');
          throw new Error(`JSON validation failed: ${errors}`);
        }

        return validationResult.data;
      }

      return parsedJson;
    }

    // Return text content
    return response.content;
  }

  /**
   * Get provider instance by name
   */
  private getProvider(providerName?: string): BaseProvider | null {
    if (providerName) {
      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new Error(`Provider '${providerName}' not configured`);
      }
      return provider;
    }

    return this.defaultProvider;
  }
}

/**
 * Initialize Ajala SDK
 *
 * @param config - SDK configuration
 * @returns Ajala instance
 */
export function initialize(config: AjalaConfig): Ajala {
  return new Ajala(config);
}
