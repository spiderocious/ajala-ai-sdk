/**
 * Variable Interpolator
 *
 * Replaces {{VARIABLE}} placeholders in template strings with actual values.
 * Supports nested object access (e.g., {{user.name}}, {{config.api.key}})
 */

export class VariableInterpolator {
  /**
   * Pattern to match {{VARIABLE}} syntax
   * Matches: {{variable}}, {{user.name}}, {{config.api.key}}
   */
  private static readonly VARIABLE_PATTERN = /\{\{([a-zA-Z0-9_.]+)\}\}/g;

  /**
   * Interpolate variables in a template string
   *
   * @param template - String template with {{variable}} placeholders
   * @param variables - Object containing variable values
   * @returns String with variables replaced
   * @throws Error if required variable is missing
   */
  static interpolate(template: string, variables: Record<string, any> = {}): string {
    // If no variables in template, return as-is
    if (!template.includes('{{')) {
      return template;
    }

    // Extract all variables from template
    const requiredVariables = this.extractVariables(template);

    // Validate all required variables are provided
    this.validateVariables(requiredVariables, variables);

    // Replace all {{variable}} with actual values
    return template.replace(this.VARIABLE_PATTERN, (match, variablePath) => {
      const value = this.resolveNestedPath(variablePath, variables);
      return this.formatValue(value);
    });
  }

  /**
   * Extract all {{VARIABLE}} names from template
   *
   * @param template - Template string
   * @returns Array of variable names (e.g., ['name', 'user.email'])
   */
  static extractVariables(template: string): string[] {
    const matches = template.matchAll(this.VARIABLE_PATTERN);
    const variables = new Set<string>();

    for (const match of matches) {
      variables.add(match[1] ?? '');
    }

    return Array.from(variables);
  }

  /**
   * Validate that all required variables are provided
   *
   * @param requiredVariables - Array of required variable paths
   * @param providedVariables - Object containing provided variables
   * @throws Error if any required variable is missing
   */
  static validateVariables(
    requiredVariables: string[],
    providedVariables: Record<string, any>
  ): void {
    for (const variablePath of requiredVariables) {
      try {
        const value = this.resolveNestedPath(variablePath, providedVariables);

        // Check if value is undefined (variable missing)
        if (value === undefined) {
          throw new Error(`Missing required variable: {{${variablePath}}}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Missing required variable')) {
          throw error;
        }
        // If error during resolution, variable is missing
        throw new Error(`Missing required variable: {{${variablePath}}}`);
      }
    }
  }

  /**
   * Resolve nested object path (e.g., 'user.name' -> variables.user.name)
   *
   * @param path - Dot-separated path (e.g., 'user.name')
   * @param obj - Object to resolve path in
   * @returns Resolved value
   */
  private static resolveNestedPath(path: string, obj: Record<string, any>): any {
    const parts = path.split('.');
    let current: any = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Format value for string interpolation
   *
   * @param value - Value to format
   * @returns String representation of value
   */
  private static formatValue(value: any): string {
    // Handle null and undefined
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }

    // Handle primitives
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.formatValue(item)).join(', ');
    }

    // Handle objects (convert to JSON)
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[object Object]';
      }
    }

    // Fallback
    return String(value);
  }
}

/**
 * Convenience function for variable interpolation
 *
 * @param template - String template with {{variable}} placeholders
 * @param variables - Object containing variable values
 * @returns String with variables replaced
 */
export function interpolate(template: string, variables: Record<string, any> = {}): string {
  return VariableInterpolator.interpolate(template, variables);
}

/**
 * Convenience function to extract variables from template
 *
 * @param template - Template string
 * @returns Array of variable names
 */
export function extractVariables(template: string): string[] {
  return VariableInterpolator.extractVariables(template);
}
