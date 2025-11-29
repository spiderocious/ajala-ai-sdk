export const ERROR_CODES = {
  // Core errors
  MISSING_VARIABLE: "AJALA_001",
  INVALID_JSON: "AJALA_002",
  API_ERROR: "AJALA_003",
  NETWORK_ERROR: "AJALA_004",
  AUTH_ERROR: "AJALA_005",
  VALIDATION_ERROR: "AJALA_006",
  RATE_LIMIT_ERROR: "AJALA_007",
  SCHEMA_ERROR: "AJALA_008",
  TIMEOUT_ERROR: "AJALA_009",
  PROVIDER_ERROR: "AJALA_010",
  PARSING_ERROR: "AJALA_011",

  // Configuration errors
  INVALID_CONFIG: "AJALA_020",
  MISSING_AUTH: "AJALA_021",
  INVALID_PROVIDER: "AJALA_022",
  UNSUPPORTED_MODEL: "AJALA_023",
  MISSING_KEYS: "AJALA_024",
  KEY_FETCH_ERROR: "AJALA_025",

  // Runtime errors
  PROVIDER_UNAVAILABLE: "AJALA_030",
  REQUEST_FAILED: "AJALA_031",
  RESPONSE_INVALID: "AJALA_032",
  MIDDLEWARE_ERROR: "AJALA_033",
} as const;

export const ERRORS = {
  AUTHENTICATION: {
    CODE: ERROR_CODES.AUTH_ERROR,
    MESSAGE: "Authentication failed",
    ERRORS: [
      {
        code: ERROR_CODES.MISSING_AUTH,
        message: "Authentication configuration missing",
      },
      {
        code: ERROR_CODES.INVALID_CONFIG,
        message: "Invalid configuration provided",
      },
      {
        code: ERROR_CODES.KEY_FETCH_ERROR,
        message: "Failed to fetch authentication keys",
      },
      {
        code: ERROR_CODES.MISSING_KEYS,
        message: "Missing authentication keys",
      },
      {
        code: ERROR_CODES.INVALID_PROVIDER,
        message: "Invalid or unsupported provider",
      },
      {
        code: ERROR_CODES.UNSUPPORTED_MODEL,
        message: "Model not supported by provider",
      },
    ],
  },
};

export const ALL_ERRORS = Object.values(ERRORS).flatMap((category) => {
  return category.ERRORS.map((error) => ({
    ...error,
    categoryCode: category.CODE,
    categoryMessage: category.MESSAGE,
  }));
});

export const ERROR_MESSAGES = {
  [ERROR_CODES.MISSING_VARIABLE]: "Required variable not provided",
  [ERROR_CODES.INVALID_JSON]: "Response does not match expected JSON structure",
  [ERROR_CODES.API_ERROR]: "AI provider returned an error",
  [ERROR_CODES.NETWORK_ERROR]: "Network request failed",
  [ERROR_CODES.AUTH_ERROR]: "Authentication failed",
  [ERROR_CODES.VALIDATION_ERROR]: "Input validation failed",
  [ERROR_CODES.RATE_LIMIT_ERROR]: "Rate limit exceeded",
  [ERROR_CODES.SCHEMA_ERROR]: "Schema validation error",
  [ERROR_CODES.TIMEOUT_ERROR]: "Request timeout",
  [ERROR_CODES.PROVIDER_ERROR]: "Provider-specific error",
  [ERROR_CODES.PARSING_ERROR]: "Failed to parse response",
  [ERROR_CODES.INVALID_CONFIG]: "Invalid configuration provided",
  [ERROR_CODES.MISSING_AUTH]: "Authentication configuration missing",
  [ERROR_CODES.INVALID_PROVIDER]: "Invalid or unsupported provider",
  [ERROR_CODES.UNSUPPORTED_MODEL]: "Model not supported by provider",
  [ERROR_CODES.PROVIDER_UNAVAILABLE]: "Provider is currently unavailable",
  [ERROR_CODES.REQUEST_FAILED]: "Request execution failed",
  [ERROR_CODES.RESPONSE_INVALID]: "Provider response is invalid",
  [ERROR_CODES.MIDDLEWARE_ERROR]: "Middleware processing error",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
