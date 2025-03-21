import logger from './logger.js';

/**
 * Data validation utility
 * This utility provides methods for validating data
 */
export class ValidationUtil {
  /**
   * Validate a string value
   * @param value The value to validate
   * @param options Validation options
   * @returns The validated value
   * @throws Error if the value is invalid
   */
  public validateString(
    value: unknown,
    options: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      allowEmpty?: boolean;
      defaultValue?: string;
    } = {}
  ): string {
    // If the value is undefined or null and not required, return the default value or an empty string
    if ((value === undefined || value === null) && !options.required) {
      return options.defaultValue !== undefined ? options.defaultValue : '';
    }

    // If the value is undefined or null and required, throw an error
    if ((value === undefined || value === null) && options.required) {
      throw new Error('Value is required');
    }

    // Convert the value to a string
    const stringValue = String(value);

    // Check if the value is empty
    if (stringValue === '' && !options.allowEmpty && options.required) {
      throw new Error('Value cannot be empty');
    }

    // Check if the value is too short
    if (options.minLength !== undefined && stringValue.length < options.minLength) {
      throw new Error(`Value must be at least ${options.minLength} characters long`);
    }

    // Check if the value is too long
    if (options.maxLength !== undefined && stringValue.length > options.maxLength) {
      throw new Error(`Value must be at most ${options.maxLength} characters long`);
    }

    // Check if the value matches the pattern
    if (options.pattern !== undefined && !options.pattern.test(stringValue)) {
      throw new Error('Value does not match the required pattern');
    }

    return stringValue;
  }

  /**
   * Validate a number value
   * @param value The value to validate
   * @param options Validation options
   * @returns The validated value
   * @throws Error if the value is invalid
   */
  public validateNumber(
    value: unknown,
    options: {
      required?: boolean;
      min?: number;
      max?: number;
      integer?: boolean;
      defaultValue?: number;
    } = {}
  ): number {
    // If the value is undefined or null and not required, return the default value or 0
    if ((value === undefined || value === null) && !options.required) {
      return options.defaultValue !== undefined ? options.defaultValue : 0;
    }

    // If the value is undefined or null and required, throw an error
    if ((value === undefined || value === null) && options.required) {
      throw new Error('Value is required');
    }

    // Convert the value to a number
    const numberValue = Number(value);

    // Check if the value is a valid number
    if (isNaN(numberValue)) {
      throw new Error('Value must be a valid number');
    }

    // Check if the value is an integer
    if (options.integer && !Number.isInteger(numberValue)) {
      throw new Error('Value must be an integer');
    }

    // Check if the value is too small
    if (options.min !== undefined && numberValue < options.min) {
      throw new Error(`Value must be at least ${options.min}`);
    }

    // Check if the value is too large
    if (options.max !== undefined && numberValue > options.max) {
      throw new Error(`Value must be at most ${options.max}`);
    }

    return numberValue;
  }

  /**
   * Validate a boolean value
   * @param value The value to validate
   * @param options Validation options
   * @returns The validated value
   * @throws Error if the value is invalid
   */
  public validateBoolean(
    value: unknown,
    options: {
      required?: boolean;
      defaultValue?: boolean;
    } = {}
  ): boolean {
    // If the value is undefined or null and not required, return the default value or false
    if ((value === undefined || value === null) && !options.required) {
      return options.defaultValue !== undefined ? options.defaultValue : false;
    }

    // If the value is undefined or null and required, throw an error
    if ((value === undefined || value === null) && options.required) {
      throw new Error('Value is required');
    }

    // Convert the value to a boolean
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
        return true;
      }
      if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
        return false;
      }
    }

    return Boolean(value);
  }

  /**
   * Validate an array value
   * @param value The value to validate
   * @param options Validation options
   * @returns The validated value
   * @throws Error if the value is invalid
   */
  public validateArray<T>(
    value: unknown,
    options: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      itemValidator?: (item: unknown) => T;
      defaultValue?: T[];
    } = {}
  ): T[] {
    // If the value is undefined or null and not required, return the default value or an empty array
    if ((value === undefined || value === null) && !options.required) {
      return options.defaultValue !== undefined ? options.defaultValue : [];
    }

    // If the value is undefined or null and required, throw an error
    if ((value === undefined || value === null) && options.required) {
      throw new Error('Value is required');
    }

    // Check if the value is an array
    if (!Array.isArray(value)) {
      throw new Error('Value must be an array');
    }

    // Check if the array is too short
    if (options.minLength !== undefined && value.length < options.minLength) {
      throw new Error(`Array must contain at least ${options.minLength} items`);
    }

    // Check if the array is too long
    if (options.maxLength !== undefined && value.length > options.maxLength) {
      throw new Error(`Array must contain at most ${options.maxLength} items`);
    }

    // Validate each item in the array
    if (options.itemValidator) {
      return value.map((item) => options.itemValidator!(item));
    }

    return value as T[];
  }

  /**
   * Validate an object value
   * @param value The value to validate
   * @param options Validation options
   * @returns The validated value
   * @throws Error if the value is invalid
   */
  public validateObject<T extends Record<string, any>>(
    value: unknown,
    options: {
      required?: boolean;
      properties?: {
        [K in keyof T]?: {
          required?: boolean;
          validator: (value: unknown) => T[K];
        };
      };
      defaultValue?: T;
    } = {}
  ): T {
    // If the value is undefined or null and not required, return the default value or an empty object
    if ((value === undefined || value === null) && !options.required) {
      return options.defaultValue !== undefined ? options.defaultValue : ({} as T);
    }

    // If the value is undefined or null and required, throw an error
    if ((value === undefined || value === null) && options.required) {
      throw new Error('Value is required');
    }

    // Check if the value is an object
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Value must be an object');
    }

    // Create a new object with the validated properties
    const result: Record<string, any> = {};

    // Validate each property
    if (options.properties) {
      for (const [key, propertyOptions] of Object.entries(options.properties)) {
        try {
          // Get the property value
          const propertyValue = (value as Record<string, any>)[key];

          // If the property is required and not present, throw an error
          if (propertyOptions.required && propertyValue === undefined) {
            throw new Error(`Property '${key}' is required`);
          }

          // Validate the property value
          if (propertyValue !== undefined) {
            result[key] = propertyOptions.validator(propertyValue);
          }
        } catch (error: any) {
          throw new Error(`Invalid property '${key}': ${error.message}`);
        }
      }
    }

    return result as T;
  }

  /**
   * Validate a value against a custom validator function
   * @param value The value to validate
   * @param validator The validator function
   * @returns The validated value
   * @throws Error if the value is invalid
   */
  public validateCustom<T>(value: unknown, validator: (value: unknown) => T): T {
    try {
      return validator(value);
    } catch (error: any) {
      logger.error('Validation failed', {
        error: error.message,
        stack: error.stack,
        value,
      });
      throw error;
    }
  }

  /**
   * Validate a value against a custom validator function and return a result object
   * @param value The value to validate
   * @param validator The validator function
   * @returns An object with the validation result and errors (if any)
   */
  public validateWithResult<T>(
    value: unknown,
    validator: (value: unknown) => T
  ): { valid: boolean; data?: T; errors?: string[] } {
    try {
      const validatedValue = validator(value);
      return {
        valid: true,
        data: validatedValue,
      };
    } catch (error: any) {
      logger.error('Validation failed', {
        error: error.message,
        stack: error.stack,
        value,
      });
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }
}

// Export a singleton instance
export const validationUtil = new ValidationUtil();
