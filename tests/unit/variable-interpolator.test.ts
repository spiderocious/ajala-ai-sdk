import { describe, it, expect } from '@jest/globals';
import { VariableInterpolator, interpolate, extractVariables } from '../../src/utils/variable-interpolator';

describe('VariableInterpolator', () => {
  describe('interpolate()', () => {
    it('should replace simple variable with string value', () => {
      const template = 'Hello {{name}}';
      const variables = { name: 'John' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Hello John');
    });

    it('should replace multiple variables in template', () => {
      const template = 'Hello {{name}}, you are {{age}} years old';
      const variables = { name: 'John', age: 25 };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Hello John, you are 25 years old');
    });

    it('should replace same variable multiple times', () => {
      const template = '{{name}} says hello. {{name}} is happy.';
      const variables = { name: 'Alice' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Alice says hello. Alice is happy.');
    });

    it('should handle nested object access with dot notation', () => {
      const template = 'Email: {{user.email}}, City: {{user.address.city}}';
      const variables = {
        user: {
          email: 'john@example.com',
          address: {
            city: 'New York'
          }
        }
      };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Email: john@example.com, City: New York');
    });

    it('should handle number values', () => {
      const template = 'Count: {{count}}, Price: {{price}}';
      const variables = { count: 42, price: 19.99 };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Count: 42, Price: 19.99');
    });

    it('should handle boolean values', () => {
      const template = 'Active: {{active}}, Verified: {{verified}}';
      const variables = { active: true, verified: false };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Active: true, Verified: false');
    });

    it('should handle array values by joining with commas', () => {
      const template = 'Tags: {{tags}}';
      const variables = { tags: ['javascript', 'typescript', 'nodejs'] };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Tags: javascript, typescript, nodejs');
    });

    it('should handle object values by converting to JSON', () => {
      const template = 'Config: {{config}}';
      const variables = { config: { api: 'v1', debug: true } };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Config: {"api":"v1","debug":true}');
    });

    it('should handle null values', () => {
      const template = 'Value: {{value}}';
      const variables = { value: null };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Value: null');
    });

    it('should return template as-is when no variables present', () => {
      const template = 'Hello World';
      const variables = { name: 'John' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Hello World');
    });

    it('should return template as-is when empty variables object', () => {
      const template = 'Hello World';
      const variables = {};
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Hello World');
    });

    it('should handle empty string template', () => {
      const template = '';
      const variables = { name: 'John' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('');
    });

    it('should handle template with only variable', () => {
      const template = '{{message}}';
      const variables = { message: 'Hello World' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Hello World');
    });

    it('should preserve whitespace and formatting', () => {
      const template = 'Line 1: {{line1}}\n  Line 2: {{line2}}\t\tLine 3: {{line3}}';
      const variables = { line1: 'First', line2: 'Second', line3: 'Third' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Line 1: First\n  Line 2: Second\t\tLine 3: Third');
    });

    it('should handle variables with numbers in names', () => {
      const template = 'Item {{item1}}, Item {{item2}}';
      const variables = { item1: 'First', item2: 'Second' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Item First, Item Second');
    });

    it('should handle variables with underscores in names', () => {
      const template = 'User: {{user_name}}, ID: {{user_id}}';
      const variables = { user_name: 'Alice', user_id: 12345 };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('User: Alice, ID: 12345');
    });

    it('should throw error when required variable is missing', () => {
      const template = 'Hello {{name}}';
      const variables = { age: 25 };
      expect(() => {
        VariableInterpolator.interpolate(template, variables);
      }).toThrow('Missing required variable: {{name}}');
    });

    it('should throw error when nested variable is missing', () => {
      const template = 'Email: {{user.email}}';
      const variables = { user: {} };
      expect(() => {
        VariableInterpolator.interpolate(template, variables);
      }).toThrow('Missing required variable: {{user.email}}');
    });

    it('should throw error when parent object is missing', () => {
      const template = 'Email: {{user.email}}';
      const variables = {};
      expect(() => {
        VariableInterpolator.interpolate(template, variables);
      }).toThrow('Missing required variable: {{user.email}}');
    });

    it('should handle extra variables without error', () => {
      const template = 'Hello {{name}}';
      const variables = { name: 'John', age: 25, city: 'NYC' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Hello John');
    });

    it('should handle complex nested structures', () => {
      const template = 'API: {{config.api.endpoint}}, Key: {{config.api.key}}';
      const variables = {
        config: {
          api: {
            endpoint: 'https://api.example.com',
            key: 'secret123'
          }
        }
      };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('API: https://api.example.com, Key: secret123');
    });

    it('should handle array of objects', () => {
      const template = 'Users: {{users}}';
      const variables = {
        users: [
          { name: 'Alice', age: 25 },
          { name: 'Bob', age: 30 }
        ]
      };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });

    it('should handle zero as a valid value', () => {
      const template = 'Count: {{count}}';
      const variables = { count: 0 };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Count: 0');
    });

    it('should handle empty string as a valid value', () => {
      const template = 'Value: {{value}}';
      const variables = { value: '' };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Value: ');
    });

    it('should handle false as a valid value', () => {
      const template = 'Flag: {{flag}}';
      const variables = { flag: false };
      const result = VariableInterpolator.interpolate(template, variables);
      expect(result).toBe('Flag: false');
    });
  });

  describe('extractVariables()', () => {
    it('should extract single variable from template', () => {
      const template = 'Hello {{name}}';
      const variables = VariableInterpolator.extractVariables(template);
      expect(variables).toEqual(['name']);
    });

    it('should extract multiple variables from template', () => {
      const template = 'Hello {{name}}, you are {{age}} years old';
      const variables = VariableInterpolator.extractVariables(template);
      expect(variables).toContain('name');
      expect(variables).toContain('age');
      expect(variables).toHaveLength(2);
    });

    it('should extract nested variable paths', () => {
      const template = 'Email: {{user.email}}';
      const variables = VariableInterpolator.extractVariables(template);
      expect(variables).toEqual(['user.email']);
    });

    it('should deduplicate repeated variables', () => {
      const template = '{{name}} says hello. {{name}} is happy. {{age}}';
      const variables = VariableInterpolator.extractVariables(template);
      expect(variables).toContain('name');
      expect(variables).toContain('age');
      expect(variables).toHaveLength(2);
    });

    it('should return empty array when no variables in template', () => {
      const template = 'Hello World';
      const variables = VariableInterpolator.extractVariables(template);
      expect(variables).toEqual([]);
    });

    it('should extract variables with numbers and underscores', () => {
      const template = '{{user_name}}, {{item1}}, {{config_v2}}';
      const variables = VariableInterpolator.extractVariables(template);
      expect(variables).toContain('user_name');
      expect(variables).toContain('item1');
      expect(variables).toContain('config_v2');
    });

    it('should extract deeply nested paths', () => {
      const template = '{{config.api.v2.endpoint}}';
      const variables = VariableInterpolator.extractVariables(template);
      expect(variables).toEqual(['config.api.v2.endpoint']);
    });
  });

  describe('validateVariables()', () => {
    it('should not throw when all required variables are provided', () => {
      const required = ['name', 'age'];
      const provided = { name: 'John', age: 25 };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).not.toThrow();
    });

    it('should throw when required variable is missing', () => {
      const required = ['name', 'age'];
      const provided = { name: 'John' };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).toThrow('Missing required variable: {{age}}');
    });

    it('should throw when nested variable is missing', () => {
      const required = ['user.email'];
      const provided = { user: { name: 'John' } };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).toThrow('Missing required variable: {{user.email}}');
    });

    it('should not throw when extra variables are provided', () => {
      const required = ['name'];
      const provided = { name: 'John', age: 25, city: 'NYC' };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).not.toThrow();
    });

    it('should not throw when no variables required', () => {
      const required: string[] = [];
      const provided = { name: 'John' };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).not.toThrow();
    });

    it('should accept zero as a valid value', () => {
      const required = ['count'];
      const provided = { count: 0 };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).not.toThrow();
    });

    it('should accept empty string as a valid value', () => {
      const required = ['value'];
      const provided = { value: '' };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).not.toThrow();
    });

    it('should accept false as a valid value', () => {
      const required = ['flag'];
      const provided = { flag: false };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).not.toThrow();
    });

    it('should accept null as a valid value', () => {
      const required = ['value'];
      const provided = { value: null };
      expect(() => {
        VariableInterpolator.validateVariables(required, provided);
      }).not.toThrow();
    });
  });

  describe('convenience functions', () => {
    it('interpolate() should work as convenience wrapper', () => {
      const result = interpolate('Hello {{name}}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('extractVariables() should work as convenience wrapper', () => {
      const variables = extractVariables('Hello {{name}}, {{age}}');
      expect(variables).toContain('name');
      expect(variables).toContain('age');
    });
  });
});
