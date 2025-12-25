/**
 * JSON Schema Validator
 *
 * Validates JSON data against schemas with comprehensive validation rules
 */

import {
  JsonStructure,
  JsonFieldSchema,
  ValidationResult,
  ValidationError,
  ValidationContext,
  JsonValidationOptions,
  JsonValueType,
} from '../types/validation';
import { FORMATS } from '../constants/formats';

export class JSONValidator {
  /**
   * Validate data against a schema
   *
   * @param data - Data to validate
   * @param schema - JSON schema
   * @param options - Validation options
   * @returns Validation result
   */
  static validate(
    data: any,
    schema: JsonStructure,
    options: JsonValidationOptions = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    let validatedData = data;

    // Apply defaults and transformations
    if (options.useDefaults) {
      validatedData = this.applyDefaults(data, schema);
    }

    // Validate each field in schema
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const fieldPath = fieldName;
      const fieldValue = validatedData?.[fieldName];

      const context: ValidationContext = {
        root: validatedData,
        parent: validatedData,
        path: [fieldName],
        field: fieldName,
      };

      // Check if required field is missing
      if (fieldSchema.required && (fieldValue === undefined || fieldValue === null)) {
        errors.push({
          path: fieldPath,
          field: fieldName,
          code: 'MISSING_REQUIRED',
          expected: `${fieldSchema.type} (required)`,
          received: fieldValue,
          message: `Field '${fieldName}' is required but was ${fieldValue === undefined ? 'undefined' : 'null'}`,
          rule: 'required',
        });
        continue;
      }

      // Skip validation if field is not present and not required
      if (fieldValue === undefined || fieldValue === null) {
        continue;
      }

      // Validate the field
      const fieldErrors = this.validateField(
        fieldValue,
        fieldSchema,
        context,
        options
      );
      errors.push(...fieldErrors);
    }

    // Remove additional properties if requested
    if (options.removeAdditional && validatedData && typeof validatedData === 'object') {
      const schemaKeys = Object.keys(schema);
      const dataKeys = Object.keys(validatedData);
      for (const key of dataKeys) {
        if (!schemaKeys.includes(key)) {
          delete validatedData[key];
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: validatedData,
    };
  }

  /**
   * Validate a single field
   */
  private static validateField(
    value: any,
    schema: JsonFieldSchema,
    context: ValidationContext,
    options: JsonValidationOptions
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type coercion if enabled
    let coercedValue = value;
    if (options.coerceTypes) {
      coercedValue = this.coerceType(value, schema.type);
    }

    // Type validation
    if (!this.validateType(coercedValue, schema.type)) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'INVALID_TYPE',
        expected: schema.type,
        received: typeof value,
        message: `Expected type '${schema.type}' but received '${typeof value}'`,
        rule: 'type',
      });
      return errors; // Don't continue if type is wrong
    }

    // String validations
    if (schema.type === 'string' && typeof coercedValue === 'string') {
      errors.push(...this.validateString(coercedValue, schema, context));
    }

    // Number validations
    if ((schema.type === 'number' || schema.type === 'integer') && typeof coercedValue === 'number') {
      errors.push(...this.validateNumber(coercedValue, schema, context));
    }

    // Array validations
    if (schema.type === 'array' && Array.isArray(coercedValue)) {
      errors.push(...this.validateArray(coercedValue, schema, context, options));
    }

    // Object validations
    if (schema.type === 'object' && typeof coercedValue === 'object' && coercedValue !== null) {
      errors.push(...this.validateObject(coercedValue, schema, context, options));
    }

    // Custom validation
    if (schema.validate) {
      const customResult = schema.validate(coercedValue, context);
      if (customResult === false) {
        errors.push({
          path: context.path.join('.'),
          field: context.field,
          code: 'CUSTOM_VALIDATION_FAILED',
          expected: 'custom validation to pass',
          received: coercedValue,
          message: `Custom validation failed for field '${context.field}'`,
          rule: 'custom',
        });
      } else if (Array.isArray(customResult)) {
        errors.push(...customResult);
      }
    }

    return errors;
  }

  /**
   * Validate type
   */
  private static validateType(value: any, type: JsonValueType): boolean {
    if (type === 'any') return true;
    if (type === 'null') return value === null;
    if (type === 'array') return Array.isArray(value);
    if (type === 'integer') return Number.isInteger(value);
    if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
    return typeof value === type;
  }

  /**
   * Validate string
   */
  private static validateString(
    value: string,
    schema: JsonFieldSchema,
    context: ValidationContext
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Length validations
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'INVALID_LENGTH',
        expected: `string with length >= ${schema.minLength}`,
        received: value.length,
        message: `String length ${value.length} is less than minimum ${schema.minLength}`,
        rule: 'minLength',
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'INVALID_LENGTH',
        expected: `string with length <= ${schema.maxLength}`,
        received: value.length,
        message: `String length ${value.length} exceeds maximum ${schema.maxLength}`,
        rule: 'maxLength',
      });
    }

    // Pattern validation
    if (schema.pattern) {
      const pattern = typeof schema.pattern === 'string' ? new RegExp(schema.pattern) : schema.pattern;
      if (!pattern.test(value)) {
        errors.push({
          path: context.path.join('.'),
          field: context.field,
          code: 'INVALID_PATTERN',
          expected: `string matching pattern ${pattern.source}`,
          received: value,
          message: `String does not match required pattern`,
          rule: 'pattern',
        });
      }
    }

    // Format validation
    if (schema.format) {
      const validator = FORMATS.validators[schema.format];
      if (validator && !validator(value)) {
        errors.push({
          path: context.path.join('.'),
          field: context.field,
          code: 'INVALID_FORMAT',
          expected: `valid ${schema.format}`,
          received: value,
          message: `String is not a valid ${schema.format}`,
          rule: 'format',
        });
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'INVALID_ENUM',
        expected: `one of: ${schema.enum.join(', ')}`,
        received: value,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        rule: 'enum',
      });
    }

    return errors;
  }

  /**
   * Validate number
   */
  private static validateNumber(
    value: number,
    schema: JsonFieldSchema,
    context: ValidationContext
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Range validations
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'OUT_OF_RANGE',
        expected: `>= ${schema.minimum}`,
        received: value,
        message: `Value ${value} is less than minimum ${schema.minimum}`,
        rule: 'minimum',
      });
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'OUT_OF_RANGE',
        expected: `<= ${schema.maximum}`,
        received: value,
        message: `Value ${value} exceeds maximum ${schema.maximum}`,
        rule: 'maximum',
      });
    }

    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'OUT_OF_RANGE',
        expected: `> ${schema.exclusiveMinimum}`,
        received: value,
        message: `Value ${value} must be greater than ${schema.exclusiveMinimum}`,
        rule: 'exclusiveMinimum',
      });
    }

    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'OUT_OF_RANGE',
        expected: `< ${schema.exclusiveMaximum}`,
        received: value,
        message: `Value ${value} must be less than ${schema.exclusiveMaximum}`,
        rule: 'exclusiveMaximum',
      });
    }

    // Multiple of validation
    if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'OUT_OF_RANGE',
        expected: `multiple of ${schema.multipleOf}`,
        received: value,
        message: `Value ${value} is not a multiple of ${schema.multipleOf}`,
        rule: 'multipleOf',
      });
    }

    return errors;
  }

  /**
   * Validate array
   */
  private static validateArray(
    value: any[],
    schema: JsonFieldSchema,
    context: ValidationContext,
    options: JsonValidationOptions
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Length validations
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'INVALID_LENGTH',
        expected: `array with length >= ${schema.minItems}`,
        received: value.length,
        message: `Array length ${value.length} is less than minimum ${schema.minItems}`,
        rule: 'minItems',
      });
    }

    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({
        path: context.path.join('.'),
        field: context.field,
        code: 'INVALID_LENGTH',
        expected: `array with length <= ${schema.maxItems}`,
        received: value.length,
        message: `Array length ${value.length} exceeds maximum ${schema.maxItems}`,
        rule: 'maxItems',
      });
    }

    // Unique items validation
    if (schema.uniqueItems) {
      const seen = new Set();
      const duplicates: any[] = [];
      for (const item of value) {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
          duplicates.push(item);
        }
        seen.add(key);
      }
      if (duplicates.length > 0) {
        errors.push({
          path: context.path.join('.'),
          field: context.field,
          code: 'DUPLICATE_ITEMS',
          expected: 'unique items',
          received: duplicates,
          message: `Array contains duplicate items`,
          rule: 'uniqueItems',
        });
      }
    }

    // Validate each item
    if (schema.items) {
      value.forEach((item, index) => {
        const itemContext: ValidationContext = {
          ...context,
          path: [...context.path, String(index)],
          field: `${context.field}[${index}]`,
        };
        const itemErrors = this.validateField(item, schema.items!, itemContext, options);
        errors.push(...itemErrors);
      });
    }

    return errors;
  }

  /**
   * Validate object
   */
  private static validateObject(
    value: any,
    schema: JsonFieldSchema,
    context: ValidationContext,
    options: JsonValidationOptions
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate nested properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const propValue = value[propName];
        const propContext: ValidationContext = {
          root: context.root,
          parent: value,
          path: [...context.path, propName],
          field: propName,
        };

        // Check required properties
        if (schema.requiredProperties?.includes(propName)) {
          if (propValue === undefined || propValue === null) {
            errors.push({
              path: propContext.path.join('.'),
              field: propName,
              code: 'MISSING_REQUIRED',
              expected: `${propSchema.type} (required)`,
              received: propValue,
              message: `Required property '${propName}' is missing`,
              rule: 'requiredProperties',
            });
            continue;
          }
        }

        // Validate property if present
        if (propValue !== undefined && propValue !== null) {
          const propErrors = this.validateField(propValue, propSchema, propContext, options);
          errors.push(...propErrors);
        }
      }
    }

    return errors;
  }

  /**
   * Apply default values
   */
  private static applyDefaults(data: any, schema: JsonStructure): any {
    const result = { ...data };

    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      if (fieldSchema.default !== undefined && (result[fieldName] === undefined || result[fieldName] === null)) {
        result[fieldName] = fieldSchema.default;
      }
    }

    return result;
  }

  /**
   * Coerce type
   */
  private static coerceType(value: any, type: JsonValueType): any {
    if (type === 'number' || type === 'integer') {
      const num = Number(value);
      if (!isNaN(num)) {
        return type === 'integer' ? Math.floor(num) : num;
      }
    }

    if (type === 'string') {
      return String(value);
    }

    if (type === 'boolean') {
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return Boolean(value);
    }

    return value;
  }
}

/**
 * Convenience function for validation
 */
export function validateJSON(
  data: any,
  schema: JsonStructure,
  options?: JsonValidationOptions
): ValidationResult {
  return JSONValidator.validate(data, schema, options);
}
