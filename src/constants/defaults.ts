import { PROVIDERS, DEFAULT_MODELS } from './providers';

export const DEFAULT_SETTINGS = {
  retryOnFail: true,
  cachable: false,
  trimPrompt: true,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  debug: false,
} as const;

export const DEFAULT_JSON_OPTIONS = {
  strict: false,
  autoFix: true,
  useDefaults: true,
  coerceTypes: true,
  removeAdditional: false,
  failFast: false,
} as const;

export const DEFAULT_PROMPT_OPTIONS = {
  expectJson: false,
  validateJSON: false,
  errorOnInvalidJSON: false,
  retryOnFail: undefined, // Will use global setting
  cachable: undefined, // Will use global setting
  trimPrompt: undefined, // Will use global setting
  timeout: undefined, // Will use global setting
} as const;

export const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'RATE_LIMIT_ERROR',
    'PROVIDER_UNAVAILABLE',
  ],
} as const;

export const DEFAULT_CACHE_CONFIG = {
  ttl: 300000, // 5 minutes
  maxSize: 1000,
  maxAge: 3600000, // 1 hour
} as const;

export const DEFAULT_VALIDATION_CONFIG = {
  maxDepth: 100,
  maxProperties: 1000,
  maxArrayLength: 10000,
  maxStringLength: 1000000,
  enableTransformations: true,
  enableWarnings: true,
} as const;

export const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;
export const VARIABLE_EXTRACTION_PATTERN = /\{\{([^}]+)\}\}/g;

export const HTTP_STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const MIME_TYPES = {
  JSON: 'application/json',
  TEXT: 'text/plain',
  HTML: 'text/html',
} as const;