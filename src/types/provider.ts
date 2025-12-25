/**
 * Provider types
 */

/**
 * Provider key configuration
 */
export interface ProviderKeyConfig {
  /** Public/API key */
  public: string;
  /** Private/secret key */
  private: string;
  /** Optional model override */
  model?: string;
  /** Optional endpoint override */
  endpoint?: string;
}

/**
 * Provider response
 */
export interface ProviderResponse {
  /** Response content */
  content: string;
  /** Provider that generated the response */
  provider: string;
  /** Model used */
  model: string;
  /** Response metadata */
  metadata: ResponseMetadata;
  /** Raw provider response */
  raw?: any;
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  /** Request timestamp */
  timestamp: number;
  /** Response latency in ms */
  latency: number;
  /** Token usage */
  usage?: TokenUsage;
  /** Request ID */
  requestId: string;
  /** Whether response was cached */
  cached?: boolean;
}

/**
 * Token usage
 */
export interface TokenUsage {
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Total tokens */
  totalTokens: number;
  /** Estimated cost in USD */
  estimatedCost?: number;
}

/**
 * Prompt options for providers
 */
export interface PromptOptions {
  /** Expect JSON response */
  expectJson?: boolean;
  /** JSON structure for validation */
  jsonStructure?: any;
  /** Validate JSON */
  validateJSON?: boolean;
  /** Error on invalid JSON */
  errorOnInvalidJSON?: boolean;
  /** Provider override */
  provider?: string;
  /** Model override */
  model?: string;
  /** Timeout in ms */
  timeout?: number;
  /** Provider-specific options */
  providerOptions?: Record<string, any>;
}
