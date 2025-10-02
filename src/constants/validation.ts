export const VALIDATION_ERROR_CODES = {
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  INVALID_LENGTH: 'INVALID_LENGTH',
  INVALID_PATTERN: 'INVALID_PATTERN',
  INVALID_ENUM: 'INVALID_ENUM',
  DUPLICATE_ITEMS: 'DUPLICATE_ITEMS',
  INVALID_STRUCTURE: 'INVALID_STRUCTURE',
  CUSTOM_VALIDATION_FAILED: 'CUSTOM_VALIDATION_FAILED',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  SCHEMA_ERROR: 'SCHEMA_ERROR',
} as const;

export const JSON_VALUE_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  NULL: 'null',
  ANY: 'any',
} as const;

export const STRING_FORMATS = {
  EMAIL: 'email',
  URL: 'url',
  DATE: 'date',
  DATETIME: 'datetime',
  UUID: 'uuid',
  IPV4: 'ipv4',
  IPV6: 'ipv6',
  STRING: 'string',
} as const;

export const VALIDATION_SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
} as const;

export const TRANSFORMATION_TYPES = {
  COERCION: 'coercion',
  DEFAULT: 'default',
  CUSTOM: 'custom',
} as const;

export const VALIDATION_LIMITS = {
  MAX_DEPTH: 100,
  MAX_PROPERTIES: 1000,
  MAX_ARRAY_LENGTH: 10000,
  MAX_STRING_LENGTH: 1000000,
  MAX_NUMBER: Number.MAX_SAFE_INTEGER,
  MIN_NUMBER: Number.MIN_SAFE_INTEGER,
} as const;

export type ValidationErrorCode = typeof VALIDATION_ERROR_CODES[keyof typeof VALIDATION_ERROR_CODES];
export type JsonValueType = typeof JSON_VALUE_TYPES[keyof typeof JSON_VALUE_TYPES];
export type StringFormat = typeof STRING_FORMATS[keyof typeof STRING_FORMATS];
export type ValidationSeverity = typeof VALIDATION_SEVERITY[keyof typeof VALIDATION_SEVERITY];
export type TransformationType = typeof TRANSFORMATION_TYPES[keyof typeof TRANSFORMATION_TYPES];