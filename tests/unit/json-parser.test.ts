import { describe, it, expect } from '@jest/globals';
import { JSONParser, parseJSON, extractJSON } from '../../src/utils/json-parser';

describe('JSONParser', () => {
  describe('parse()', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "John", "age": 25}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should parse nested objects', () => {
      const json = '{"user": {"name": "John", "email": "john@example.com"}}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({
        user: { name: 'John', email: 'john@example.com' }
      });
    });

    it('should parse arrays', () => {
      const json = '["apple", "banana", "cherry"]';
      const result = JSONParser.parse(json);
      expect(result).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should fix trailing comma in object', () => {
      const json = '{"name": "John", "age": 25,}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should fix trailing comma in array', () => {
      const json = '["apple", "banana",]';
      const result = JSONParser.parse(json);
      expect(result).toEqual(['apple', 'banana']);
    });

    it('should fix multiple trailing commas', () => {
      const json = '{"items": ["a", "b",], "count": 2,}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ items: ['a', 'b'], count: 2 });
    });

    it('should remove single-line comments', () => {
      const json = `{
  "name": "John", // This is a name
  "age": 25 // This is an age
}`;
      const result = JSONParser.parse(json);
      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should remove multi-line comments', () => {
      const json = `{
  /* This is a comment */
  "name": "John",
  /* Another
     multi-line
     comment */
  "age": 25
}`;
      const result = JSONParser.parse(json);
      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should extract JSON from markdown code block with json tag', () => {
      const markdown = '```json\n{"name": "John", "age": 25}\n```';
      const result = JSONParser.parse(markdown);
      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should extract JSON from markdown code block without language tag', () => {
      const markdown = '```\n{"name": "John", "age": 25}\n```';
      const result = JSONParser.parse(markdown);
      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should extract JSON from markdown with surrounding text', () => {
      const markdown = 'Here is the result:\n```json\n{"name": "John"}\n```\nDone!';
      const result = JSONParser.parse(markdown);
      expect(result).toEqual({ name: 'John' });
    });

    it('should fix single quotes to double quotes', () => {
      const json = "{'name': 'John', 'age': 25}";
      const result = JSONParser.parse(json);
      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should handle whitespace', () => {
      const json = '  \n  {"name": "John"}  \n  ';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ name: 'John' });
    });

    it('should fix unclosed braces', () => {
      const json = '{"name": "John", "age": 25';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should fix unclosed brackets', () => {
      const json = '["apple", "banana"';
      const result = JSONParser.parse(json);
      expect(result).toEqual(['apple', 'banana']);
    });

    it('should fix multiple unclosed brackets and braces', () => {
      const json = '{"items": ["a", "b"';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ items: ['a', 'b'] });
    });

    it('should handle combination of fixes', () => {
      const json = `{
  "name": "John", // comment
  "items": ['a', 'b',], /* comment */
  "age": 25,
}`;
      const result = JSONParser.parse(json);
      expect(result).toEqual({
        name: 'John',
        items: ['a', 'b'],
        age: 25
      });
    });

    it('should throw error when strict mode is enabled and JSON is invalid', () => {
      const json = '{"name": "John",}';
      expect(() => {
        JSONParser.parse(json, { strict: true });
      }).toThrow();
    });

    it('should throw error when autoFix is disabled and JSON is invalid', () => {
      const json = '{"name": "John",}';
      expect(() => {
        JSONParser.parse(json, { autoFix: false });
      }).toThrow();
    });

    it('should throw error when JSON is completely invalid', () => {
      const json = 'This is not JSON at all';
      expect(() => {
        JSONParser.parse(json);
      }).toThrow('Failed to parse JSON');
    });

    it('should handle empty object', () => {
      const json = '{}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({});
    });

    it('should handle empty array', () => {
      const json = '[]';
      const result = JSONParser.parse(json);
      expect(result).toEqual([]);
    });

    it('should handle boolean values', () => {
      const json = '{"active": true, "verified": false}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ active: true, verified: false });
    });

    it('should handle null values', () => {
      const json = '{"value": null}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ value: null });
    });

    it('should handle numbers', () => {
      const json = '{"int": 42, "float": 3.14, "negative": -10}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ int: 42, float: 3.14, negative: -10 });
    });

    it('should preserve nested arrays', () => {
      const json = '{"matrix": [[1, 2], [3, 4]]}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ matrix: [[1, 2], [3, 4]] });
    });

    it('should handle escaped characters in strings', () => {
      const json = '{"text": "Line 1\\nLine 2\\tTabbed"}';
      const result = JSONParser.parse(json);
      expect(result).toEqual({ text: 'Line 1\nLine 2\tTabbed' });
    });
  });

  describe('extractFromMarkdown()', () => {
    it('should extract JSON from code block with json tag', () => {
      const markdown = '```json\n{"name": "John"}\n```';
      const result = JSONParser.extractFromMarkdown(markdown);
      expect(result).toBe('{"name": "John"}');
    });

    it('should extract JSON from code block without language tag', () => {
      const markdown = '```\n{"name": "John"}\n```';
      const result = JSONParser.extractFromMarkdown(markdown);
      expect(result).toBe('{"name": "John"}');
    });

    it('should return original text if no code block found', () => {
      const text = '{"name": "John"}';
      const result = JSONParser.extractFromMarkdown(text);
      expect(result).toBe('{"name": "John"}');
    });

    it('should handle multi-line JSON in code block', () => {
      const markdown = '```json\n{\n  "name": "John",\n  "age": 25\n}\n```';
      const result = JSONParser.extractFromMarkdown(markdown);
      expect(result).toContain('"name": "John"');
      expect(result).toContain('"age": 25');
    });

    it('should extract first code block if multiple exist', () => {
      const markdown = '```json\n{"first": true}\n```\ntext\n```json\n{"second": true}\n```';
      const result = JSONParser.extractFromMarkdown(markdown);
      expect(result).toBe('{"first": true}');
    });
  });

  describe('removeComments()', () => {
    it('should remove single-line comments', () => {
      const text = '{"name": "John"} // comment';
      const result = JSONParser.removeComments(text);
      expect(result).not.toContain('// comment');
    });

    it('should remove multi-line comments', () => {
      const text = '{"name": /* comment */ "John"}';
      const result = JSONParser.removeComments(text);
      expect(result).not.toContain('/* comment */');
    });

    it('should remove multiple comments', () => {
      const text = `{
  // comment 1
  "name": "John", /* comment 2 */
  "age": 25 // comment 3
}`;
      const result = JSONParser.removeComments(text);
      expect(result).not.toContain('comment');
    });

    it('should handle text without comments', () => {
      const text = '{"name": "John"}';
      const result = JSONParser.removeComments(text);
      expect(result).toBe('{"name": "John"}');
    });
  });

  describe('fixTrailingCommas()', () => {
    it('should fix trailing comma in object', () => {
      const text = '{"name": "John",}';
      const result = JSONParser.fixTrailingCommas(text);
      expect(result).toBe('{"name": "John"}');
    });

    it('should fix trailing comma in array', () => {
      const text = '["a", "b",]';
      const result = JSONParser.fixTrailingCommas(text);
      expect(result).toBe('["a", "b"]');
    });

    it('should fix multiple trailing commas', () => {
      const text = '{"items": ["a",], "count": 2,}';
      const result = JSONParser.fixTrailingCommas(text);
      expect(result).toBe('{"items": ["a"], "count": 2}');
    });

    it('should preserve valid commas', () => {
      const text = '{"name": "John", "age": 25}';
      const result = JSONParser.fixTrailingCommas(text);
      expect(result).toBe('{"name": "John", "age": 25}');
    });
  });

  describe('fixQuotes()', () => {
    it('should fix single quotes to double quotes', () => {
      const text = "{'name': 'John'}";
      const result = JSONParser.fixQuotes(text);
      expect(result).toBe('{"name": "John"}');
    });

    it('should handle multiple single quotes', () => {
      const text = "{'a': '1', 'b': '2'}";
      const result = JSONParser.fixQuotes(text);
      expect(result).toBe('{"a": "1", "b": "2"}');
    });

    it('should preserve already valid double quotes', () => {
      const text = '{"name": "John"}';
      const result = JSONParser.fixQuotes(text);
      expect(result).toBe('{"name": "John"}');
    });
  });

  describe('fixUnclosedBrackets()', () => {
    it('should add missing closing brace', () => {
      const text = '{"name": "John"';
      const result = JSONParser.fixUnclosedBrackets(text);
      expect(result).toBe('{"name": "John"}');
    });

    it('should add missing closing bracket', () => {
      const text = '["a", "b"';
      const result = JSONParser.fixUnclosedBrackets(text);
      expect(result).toBe('["a", "b"]');
    });

    it('should add multiple missing brackets', () => {
      const text = '{"items": ["a", "b"';
      const result = JSONParser.fixUnclosedBrackets(text);
      expect(result).toBe('{"items": ["a", "b"]}');
    });

    it('should not modify already balanced brackets', () => {
      const text = '{"name": "John"}';
      const result = JSONParser.fixUnclosedBrackets(text);
      expect(result).toBe('{"name": "John"}');
    });
  });

  describe('isValidJSON()', () => {
    it('should return true for valid JSON', () => {
      expect(JSONParser.isValidJSON('{"name": "John"}')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(JSONParser.isValidJSON('{"name": "John",}')).toBe(false);
    });

    it('should return true for arrays', () => {
      expect(JSONParser.isValidJSON('["a", "b"]')).toBe(true);
    });

    it('should return true for primitives', () => {
      expect(JSONParser.isValidJSON('42')).toBe(true);
      expect(JSONParser.isValidJSON('"string"')).toBe(true);
      expect(JSONParser.isValidJSON('true')).toBe(true);
      expect(JSONParser.isValidJSON('null')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(JSONParser.isValidJSON('not json')).toBe(false);
    });
  });

  describe('convenience functions', () => {
    it('parseJSON() should work as wrapper', () => {
      const result = parseJSON('{"name": "John",}');
      expect(result).toEqual({ name: 'John' });
    });

    it('extractJSON() should work as wrapper', () => {
      const result = extractJSON('```json\n{"name": "John"}\n```');
      expect(result).toBe('{"name": "John"}');
    });
  });
});
