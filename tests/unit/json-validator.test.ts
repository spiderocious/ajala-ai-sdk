import { describe, it, expect } from '@jest/globals';
import { JSONValidator, validateJSON } from '../../src/utils/json-validator';

describe('JSONValidator', () => {
  describe('Type validation', () => {
    it('should validate string type', () => {
      const schema = { name: { type: 'string' as const } };
      const result = JSONValidator.validate({ name: 'John' }, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate number type', () => {
      const schema = { age: { type: 'number' as const } };
      const result = JSONValidator.validate({ age: 25 }, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate integer type', () => {
      const schema = { count: { type: 'integer' as const } };
      const result = JSONValidator.validate({ count: 10 }, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate boolean type', () => {
      const schema = { active: { type: 'boolean' as const } };
      const result = JSONValidator.validate({ active: true }, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate array type', () => {
      const schema = { items: { type: 'array' as const } };
      const result = JSONValidator.validate({ items: [1, 2, 3] }, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate object type', () => {
      const schema = { config: { type: 'object' as const } };
      const result = JSONValidator.validate({ config: {} }, schema);
      expect(result.valid).toBe(true);
    });

    it('should fail validation for wrong type', () => {
      const schema = { age: { type: 'number' as const } };
      const result = JSONValidator.validate({ age: 'twenty' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('INVALID_TYPE');
    });
  });

  describe('Required fields', () => {
    it('should pass when required field is present', () => {
      const schema = { name: { type: 'string' as const, required: true } };
      const result = JSONValidator.validate({ name: 'John' }, schema);
      expect(result.valid).toBe(true);
    });

    it('should fail when required field is missing', () => {
      const schema = { name: { type: 'string' as const, required: true } };
      const result = JSONValidator.validate({}, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('MISSING_REQUIRED');
    });

    it('should pass when optional field is missing', () => {
      const schema = { name: { type: 'string' as const } };
      const result = JSONValidator.validate({}, schema);
      expect(result.valid).toBe(true);
    });
  });

  describe('String validation', () => {
    it('should validate minLength', () => {
      const schema = { name: { type: 'string' as const, minLength: 3 } };
      const result = JSONValidator.validate({ name: 'Jo' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('INVALID_LENGTH');
    });

    it('should validate maxLength', () => {
      const schema = { name: { type: 'string' as const, maxLength: 5 } };
      const result = JSONValidator.validate({ name: 'Jonathan' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('INVALID_LENGTH');
    });

    it('should validate pattern', () => {
      const schema = { code: { type: 'string' as const, pattern: '^[A-Z]{3}$' } };
      const result = JSONValidator.validate({ code: 'abc' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('INVALID_PATTERN');
    });

    it('should validate email format', () => {
      const schema = { email: { type: 'string' as const, format: 'email' as const } };
      const valid = JSONValidator.validate({ email: 'test@example.com' }, schema);
      expect(valid.valid).toBe(true);

      const invalid = JSONValidator.validate({ email: 'not-an-email' }, schema);
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]?.code).toBe('INVALID_FORMAT');
    });

    it('should validate enum', () => {
      const schema = { status: { type: 'string' as const, enum: ['active', 'inactive'] } };
      const valid = JSONValidator.validate({ status: 'active' }, schema);
      expect(valid.valid).toBe(true);

      const invalid = JSONValidator.validate({ status: 'pending' }, schema);
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]?.code).toBe('INVALID_ENUM');
    });
  });

  describe('Number validation', () => {
    it('should validate minimum', () => {
      const schema = { age: { type: 'number' as const, minimum: 18 } };
      const result = JSONValidator.validate({ age: 16 }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('OUT_OF_RANGE');
    });

    it('should validate maximum', () => {
      const schema = { age: { type: 'number' as const, maximum: 100 } };
      const result = JSONValidator.validate({ age: 150 }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('OUT_OF_RANGE');
    });

    it('should validate exclusiveMinimum', () => {
      const schema = { score: { type: 'number' as const, exclusiveMinimum: 0 } };
      const result = JSONValidator.validate({ score: 0 }, schema);
      expect(result.valid).toBe(false);
    });

    it('should validate exclusiveMaximum', () => {
      const schema = { score: { type: 'number' as const, exclusiveMaximum: 100 } };
      const result = JSONValidator.validate({ score: 100 }, schema);
      expect(result.valid).toBe(false);
    });

    it('should validate multipleOf', () => {
      const schema = { count: { type: 'number' as const, multipleOf: 5 } };
      const valid = JSONValidator.validate({ count: 15 }, schema);
      expect(valid.valid).toBe(true);

      const invalid = JSONValidator.validate({ count: 17 }, schema);
      expect(invalid.valid).toBe(false);
    });
  });

  describe('Array validation', () => {
    it('should validate minItems', () => {
      const schema = { tags: { type: 'array' as const, minItems: 2 } };
      const result = JSONValidator.validate({ tags: ['one'] }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('INVALID_LENGTH');
    });

    it('should validate maxItems', () => {
      const schema = { tags: { type: 'array' as const, maxItems: 3 } };
      const result = JSONValidator.validate({ tags: [1, 2, 3, 4] }, schema);
      expect(result.valid).toBe(false);
    });

    it('should validate uniqueItems', () => {
      const schema = { tags: { type: 'array' as const, uniqueItems: true } };
      const result = JSONValidator.validate({ tags: ['a', 'b', 'a'] }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('DUPLICATE_ITEMS');
    });

    it('should validate array item schema', () => {
      const schema = {
        numbers: {
          type: 'array' as const,
          items: { type: 'number' as const, minimum: 0 }
        }
      };
      const result = JSONValidator.validate({ numbers: [1, -5, 3] }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('OUT_OF_RANGE');
    });
  });

  describe('Object validation', () => {
    it('should validate nested properties', () => {
      const schema = {
        user: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            age: { type: 'number' as const }
          }
        }
      };
      const result = JSONValidator.validate({
        user: { name: 'John', age: 25 }
      }, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate required properties in object', () => {
      const schema = {
        user: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            email: { type: 'string' as const }
          },
          requiredProperties: ['email']
        }
      };
      const result = JSONValidator.validate({
        user: { name: 'John' }
      }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe('MISSING_REQUIRED');
    });
  });

  describe('Options', () => {
    it('should apply default values when useDefaults is true', () => {
      const schema = {
        name: { type: 'string' as const, default: 'Anonymous' },
        age: { type: 'number' as const, default: 0 }
      };
      const result = JSONValidator.validate({}, schema, { useDefaults: true });
      expect(result.data.name).toBe('Anonymous');
      expect(result.data.age).toBe(0);
    });

    it.skip('should coerce types when coerceTypes is true (TODO: implement data transformation)', () => {
      const schema = { age: { type: 'number' as const } };
      const result = JSONValidator.validate({ age: '25' }, schema, { coerceTypes: true });
      expect(result.valid).toBe(true);
      expect(result.data.age).toBe(25);
    });

    it('should remove additional properties when removeAdditional is true', () => {
      const schema = { name: { type: 'string' as const } };
      const result = JSONValidator.validate(
        { name: 'John', extra: 'field' },
        schema,
        { removeAdditional: true }
      );
      expect(result.data).toEqual({ name: 'John' });
      expect(result.data.extra).toBeUndefined();
    });
  });

  describe('Complex schemas', () => {
    it('should validate complex nested structure', () => {
      const schema = {
        user: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const, required: true },
            email: { type: 'string' as const, format: 'email' as const },
            tags: {
              type: 'array' as const,
              items: { type: 'string' as const },
              uniqueItems: true
            },
            settings: {
              type: 'object' as const,
              properties: {
                theme: { type: 'string' as const, enum: ['light', 'dark'] }
              }
            }
          },
          requiredProperties: ['name']
        }
      };

      const validData = {
        user: {
          name: 'John',
          email: 'john@example.com',
          tags: ['developer', 'writer'],
          settings: { theme: 'dark' }
        }
      };

      const result = JSONValidator.validate(validData, schema);
      expect(result.valid).toBe(true);
    });
  });

  describe('Custom validation', () => {
    it('should run custom validation function', () => {
      const schema = {
        password: {
          type: 'string' as const,
          validate: (value: string) => value.length >= 8 && /[A-Z]/.test(value)
        }
      };

      const weak = JSONValidator.validate({ password: 'weak' }, schema);
      expect(weak.valid).toBe(false);

      const strong = JSONValidator.validate({ password: 'StrongPass123' }, schema);
      expect(strong.valid).toBe(true);
    });
  });

  describe('Convenience function', () => {
    it('should work as wrapper', () => {
      const schema = { name: { type: 'string' as const } };
      const result = validateJSON({ name: 'John' }, schema);
      expect(result.valid).toBe(true);
    });
  });
});
