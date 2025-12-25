/**
 * JSON Parser with Auto-Fix
 *
 * Parses JSON with automatic fixing of common formatting issues from AI responses
 */

export class JSONParser {
  /**
   * Parse JSON string with automatic fixing
   *
   * @param text - JSON string (possibly malformed)
   * @param options - Parsing options
   * @returns Parsed JSON object
   * @throws Error if JSON cannot be parsed or fixed
   */
  static parse(text: string, options: JSONParseOptions = {}): any {
    const { strict = false, autoFix = true } = options;

    // Try parsing as-is first
    try {
      return JSON.parse(text);
    } catch (error) {
      if (!autoFix || strict) {
        throw error;
      }
    }

    // Try extracting from markdown code blocks
    let cleaned = this.extractFromMarkdown(text);

    // Apply fixes
    cleaned = this.removeComments(cleaned);
    cleaned = this.fixTrailingCommas(cleaned);
    cleaned = this.fixQuotes(cleaned);
    cleaned = this.trimWhitespace(cleaned);

    // Try parsing again
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      // If still failing, try more aggressive fixes
      cleaned = this.fixUnclosedBrackets(cleaned);

      try {
        return JSON.parse(cleaned);
      } catch (finalError) {
        throw new Error(
          `Failed to parse JSON even after auto-fix attempts. Original error: ${
            finalError instanceof Error ? finalError.message : String(finalError)
          }`
        );
      }
    }
  }

  /**
   * Extract JSON from markdown code blocks
   *
   * @param text - Text that may contain markdown
   * @returns Extracted JSON string
   */
  static extractFromMarkdown(text: string): string {
    // Match ```json ... ``` or ``` ... ```
    const codeBlockPattern = /```(?:json)?\s*\n?([\s\S]*?)```/;
    const match = text.match(codeBlockPattern);

    if (match && match[1]) {
      return match[1].trim();
    }

    return text;
  }

  /**
   * Remove single-line and multi-line comments
   *
   * @param text - JSON string with comments
   * @returns JSON string without comments
   */
  static removeComments(text: string): string {
    // Remove multi-line comments /* ... */
    let result = text.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments //
    // But be careful not to remove // inside strings
    result = result.replace(/\/\/.*$/gm, '');

    return result;
  }

  /**
   * Fix trailing commas in objects and arrays
   *
   * @param text - JSON string with trailing commas
   * @returns JSON string without trailing commas
   */
  static fixTrailingCommas(text: string): string {
    // Remove trailing comma before closing brace }
    let result = text.replace(/,(\s*})/g, '$1');

    // Remove trailing comma before closing bracket ]
    result = result.replace(/,(\s*])/g, '$1');

    return result;
  }

  /**
   * Fix single quotes to double quotes
   *
   * @param text - JSON string with single quotes
   * @returns JSON string with double quotes
   */
  static fixQuotes(text: string): string {
    // This is a simple implementation
    // A more robust version would need to handle escaped quotes
    // and not replace single quotes inside double-quoted strings

    // Replace single quotes around keys and values
    // This pattern looks for 'word' and replaces with "word"
    return text.replace(/'([^']*?)'/g, '"$1"');
  }

  /**
   * Trim leading and trailing whitespace
   *
   * @param text - JSON string
   * @returns Trimmed JSON string
   */
  static trimWhitespace(text: string): string {
    return text.trim();
  }

  /**
   * Attempt to fix unclosed brackets and braces (best effort)
   * Uses a stack to properly close brackets in correct order
   *
   * @param text - JSON string
   * @returns JSON string with balanced brackets
   */
  static fixUnclosedBrackets(text: string): string {
    const stack: string[] = [];

    // Track what brackets/braces are open
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '{') {
        stack.push('}');
      } else if (char === '[') {
        stack.push(']');
      } else if (char === '}' || char === ']') {
        // Check if this closes the most recent opening
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }

    // Add missing closing brackets in reverse order (LIFO)
    return text + stack.reverse().join('');
  }

  /**
   * Check if a string is valid JSON
   *
   * @param text - String to check
   * @returns True if valid JSON
   */
  static isValidJSON(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * JSON parsing options
 */
export interface JSONParseOptions {
  /** Strict parsing (no auto-fix) */
  strict?: boolean;
  /** Automatically fix common issues */
  autoFix?: boolean;
}

/**
 * Convenience function for JSON parsing with auto-fix
 *
 * @param text - JSON string
 * @param options - Parsing options
 * @returns Parsed JSON object
 */
export function parseJSON(text: string, options: JSONParseOptions = {}): any {
  return JSONParser.parse(text, options);
}

/**
 * Convenience function to extract JSON from markdown
 *
 * @param text - Text with markdown
 * @returns Extracted JSON string
 */
export function extractJSON(text: string): string {
  return JSONParser.extractFromMarkdown(text);
}
