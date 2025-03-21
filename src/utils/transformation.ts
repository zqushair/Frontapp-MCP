import logger from './logger.js';

/**
 * Data transformation utility
 * This utility provides methods for transforming data between different formats
 */
export class TransformationUtil {
  /**
   * Transform an object by mapping its properties
   * @param obj The object to transform
   * @param mapping The property mapping
   * @returns The transformed object
   */
  public transformObject<T extends Record<string, any>, U extends Record<string, any>>(
    obj: T,
    mapping: {
      [K in keyof U]?: keyof T | ((obj: T) => U[K]);
    }
  ): U {
    const result: Record<string, any> = {};

    try {
      // Apply the mapping to each property
      for (const [targetKey, sourceKeyOrFn] of Object.entries(mapping)) {
        try {
          if (typeof sourceKeyOrFn === 'function') {
            // If the mapping is a function, call it with the object
            result[targetKey] = sourceKeyOrFn(obj);
          } else if (sourceKeyOrFn !== undefined) {
            // If the mapping is a property key, copy the value
            result[targetKey] = obj[sourceKeyOrFn as keyof T];
          }
        } catch (error: any) {
          logger.error(`Error transforming property '${targetKey}'`, {
            error: error.message,
            stack: error.stack,
          });
          throw new Error(`Error transforming property '${targetKey}': ${error.message}`);
        }
      }

      return result as U;
    } catch (error: any) {
      logger.error('Error transforming object', {
        error: error.message,
        stack: error.stack,
        obj,
        mapping,
      });
      throw error;
    }
  }

  /**
   * Transform an array of objects by mapping their properties
   * @param arr The array to transform
   * @param mapping The property mapping
   * @returns The transformed array
   */
  public transformArray<T extends Record<string, any>, U extends Record<string, any>>(
    arr: T[],
    mapping: {
      [K in keyof U]?: keyof T | ((obj: T) => U[K]);
    }
  ): U[] {
    try {
      // Transform each object in the array
      return arr.map((obj) => this.transformObject(obj, mapping));
    } catch (error: any) {
      logger.error('Error transforming array', {
        error: error.message,
        stack: error.stack,
        arr,
        mapping,
      });
      throw error;
    }
  }

  /**
   * Transform a value using a custom transformer function
   * @param value The value to transform
   * @param transformer The transformer function
   * @returns The transformed value
   */
  public transformValue<T, U>(value: T, transformer: (value: T) => U): U {
    try {
      return transformer(value);
    } catch (error: any) {
      logger.error('Error transforming value', {
        error: error.message,
        stack: error.stack,
        value,
      });
      throw error;
    }
  }

  /**
   * Transform a date to an ISO string
   * @param date The date to transform
   * @returns The ISO string representation of the date
   */
  public dateToISOString(date: Date | number | string): string {
    try {
      // Convert the date to a Date object
      const dateObj = date instanceof Date ? date : new Date(date);

      // Convert the Date object to an ISO string
      return dateObj.toISOString();
    } catch (error: any) {
      logger.error('Error transforming date to ISO string', {
        error: error.message,
        stack: error.stack,
        date,
      });
      throw new Error(`Invalid date: ${error.message}`);
    }
  }

  /**
   * Transform a date to a Unix timestamp (seconds since epoch)
   * @param date The date to transform
   * @returns The Unix timestamp
   */
  public dateToUnixTimestamp(date: Date | number | string): number {
    try {
      // Convert the date to a Date object
      const dateObj = date instanceof Date ? date : new Date(date);

      // Convert the Date object to a Unix timestamp (seconds since epoch)
      return Math.floor(dateObj.getTime() / 1000);
    } catch (error: any) {
      logger.error('Error transforming date to Unix timestamp', {
        error: error.message,
        stack: error.stack,
        date,
      });
      throw new Error(`Invalid date: ${error.message}`);
    }
  }

  /**
   * Transform a Unix timestamp to a Date object
   * @param timestamp The Unix timestamp (seconds since epoch)
   * @returns The Date object
   */
  public unixTimestampToDate(timestamp: number): Date {
    try {
      // Convert the Unix timestamp to a Date object
      return new Date(timestamp * 1000);
    } catch (error: any) {
      logger.error('Error transforming Unix timestamp to Date', {
        error: error.message,
        stack: error.stack,
        timestamp,
      });
      throw new Error(`Invalid timestamp: ${error.message}`);
    }
  }

  /**
   * Transform a string to camelCase
   * @param str The string to transform
   * @returns The camelCase string
   */
  public toCamelCase(str: string): string {
    try {
      // Convert the string to camelCase
      return str
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
    } catch (error: any) {
      logger.error('Error transforming string to camelCase', {
        error: error.message,
        stack: error.stack,
        str,
      });
      throw new Error(`Invalid string: ${error.message}`);
    }
  }

  /**
   * Transform a string to snake_case
   * @param str The string to transform
   * @returns The snake_case string
   */
  public toSnakeCase(str: string): string {
    try {
      // Convert the string to snake_case
      return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
    } catch (error: any) {
      logger.error('Error transforming string to snake_case', {
        error: error.message,
        stack: error.stack,
        str,
      });
      throw new Error(`Invalid string: ${error.message}`);
    }
  }

  /**
   * Transform a string to kebab-case
   * @param str The string to transform
   * @returns The kebab-case string
   */
  public toKebabCase(str: string): string {
    try {
      // Convert the string to kebab-case
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    } catch (error: any) {
      logger.error('Error transforming string to kebab-case', {
        error: error.message,
        stack: error.stack,
        str,
      });
      throw new Error(`Invalid string: ${error.message}`);
    }
  }

  /**
   * Transform an object's keys to camelCase
   * @param obj The object to transform
   * @returns The transformed object with camelCase keys
   */
  public objectKeysToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
    try {
      // If the object is null or not an object, return it as is
      if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
      }

      // Create a new object with camelCase keys
      const result: Record<string, any> = {};

      // Transform each key in the object
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = this.toCamelCase(key);

        // Recursively transform nested objects
        if (value !== null && typeof value === 'object') {
          if (Array.isArray(value)) {
            // Transform each item in the array
            result[camelKey] = value.map((item) =>
              typeof item === 'object' && item !== null ? this.objectKeysToCamelCase(item) : item
            );
          } else {
            // Transform the nested object
            result[camelKey] = this.objectKeysToCamelCase(value);
          }
        } else {
          // Copy the value as is
          result[camelKey] = value;
        }
      }

      return result;
    } catch (error: any) {
      logger.error('Error transforming object keys to camelCase', {
        error: error.message,
        stack: error.stack,
        obj,
      });
      throw error;
    }
  }

  /**
   * Transform an object's keys to snake_case
   * @param obj The object to transform
   * @returns The transformed object with snake_case keys
   */
  public objectKeysToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
    try {
      // If the object is null or not an object, return it as is
      if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
      }

      // Create a new object with snake_case keys
      const result: Record<string, any> = {};

      // Transform each key in the object
      for (const [key, value] of Object.entries(obj)) {
        const snakeKey = this.toSnakeCase(key);

        // Recursively transform nested objects
        if (value !== null && typeof value === 'object') {
          if (Array.isArray(value)) {
            // Transform each item in the array
            result[snakeKey] = value.map((item) =>
              typeof item === 'object' && item !== null ? this.objectKeysToSnakeCase(item) : item
            );
          } else {
            // Transform the nested object
            result[snakeKey] = this.objectKeysToSnakeCase(value);
          }
        } else {
          // Copy the value as is
          result[snakeKey] = value;
        }
      }

      return result;
    } catch (error: any) {
      logger.error('Error transforming object keys to snake_case', {
        error: error.message,
        stack: error.stack,
        obj,
      });
      throw error;
    }
  }
}

// Export a singleton instance
export const transformationUtil = new TransformationUtil();
