/**
 * Validation types for JSON schema validation
 */

/**
 * JSON value types
 */
export type JsonValueType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null'
  | 'any';

/**
 * String formats for validation
 */
export type StringFormat =
  | 'email'
  | 'url'
  | 'date'
  | 'datetime'
  | 'uuid'
  | 'ipv4'
  | 'ipv6';

/**
 * JSON field schema for validation
 */
export interface JsonFieldSchema {
  /** Field type */
  type: JsonValueType;
  /** Human-readable description */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Default value if field is missing */
  default?: any;

  // String validations
  /** Minimum string length */
  minLength?: number;
  /** Maximum string length */
  maxLength?: number;
  /** Regular expression pattern */
  pattern?: string | RegExp;
  /** String format validation */
  format?: StringFormat;
  /** Allowed string values (enum) */
  enum?: string[];

  // Number validations
  /** Minimum numeric value */
  minimum?: number;
  /** Maximum numeric value */
  maximum?: number;
  /** Exclusive minimum */
  exclusiveMinimum?: number;
  /** Exclusive maximum */
  exclusiveMaximum?: number;
  /** Number must be multiple of this value */
  multipleOf?: number;

  // Array validations
  /** Schema for array items */
  items?: JsonFieldSchema;
  /** Minimum number of items */
  minItems?: number;
  /** Maximum number of items */
  maxItems?: number;
  /** Whether array items must be unique */
  uniqueItems?: boolean;

  // Object validations
  /** Schema for object properties */
  properties?: JsonStructure;
  /** Required properties in object */
  requiredProperties?: string[];
  /** Allow additional properties */
  additionalProperties?: boolean | JsonFieldSchema;

  // Custom validation
  /** Custom validation function */
  validate?: (value: any, context?: ValidationContext) => boolean | ValidationError[];
  /** Custom transformation function */
  transform?: (value: any, context?: ValidationContext) => any;
}

/**
 * JSON structure definition
 */
export type JsonStructure = {
  [key: string]: JsonFieldSchema;
};

/**
 * Validation context
 */
export interface ValidationContext {
  /** Full object being validated */
  root: any;
  /** Current object being validated */
  parent: any;
  /** Path to current field */
  path: string[];
  /** Field name */
  field: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validated/transformed data */
  data: any;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Path to the invalid field */
  path: string;
  /** Field name */
  field: string;
  /** Error code */
  code: ValidationErrorCode;
  /** Expected type or value */
  expected: string;
  /** Actual value */
  received: any;
  /** Human-readable error message */
  message: string;
  /** Schema rule that failed */
  rule: string;
}

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'MISSING_REQUIRED'
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'OUT_OF_RANGE'
  | 'INVALID_LENGTH'
  | 'INVALID_PATTERN'
  | 'INVALID_ENUM'
  | 'DUPLICATE_ITEMS'
  | 'INVALID_STRUCTURE'
  | 'CUSTOM_VALIDATION_FAILED';

/**
 * JSON validation options
 */
export interface JsonValidationOptions {
  /** Apply default values for missing fields */
  useDefaults?: boolean;
  /** Coerce types when possible */
  coerceTypes?: boolean;
  /** Remove additional properties not in schema */
  removeAdditional?: boolean;
}
