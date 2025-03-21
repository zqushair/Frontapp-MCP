/**
 * Environment variable validator
 * This utility provides functions for validating environment variables
 */

import logger from './logger.js';

/**
 * Environment variable type
 */
export enum EnvVarType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  URL = 'url',
  EMAIL = 'email',
  PORT = 'port',
  PATH = 'path',
  JSON = 'json',
}

/**
 * Environment variable definition
 */
export interface EnvVarDefinition {
  /** The name of the environment variable */
  name: string;
  /** The type of the environment variable */
  type: EnvVarType;
  /** Whether the environment variable is required */
  required: boolean;
  /** The default value for the environment variable */
  default?: string;
  /** Minimum value (for number types) */
  min?: number;
  /** Maximum value (for number types) */
  max?: number;
  /** Regular expression pattern (for string types) */
  pattern?: RegExp;
  /** Description of the environment variable */
  description?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the validation was successful */
  valid: boolean;
  /** The validated value */
  value: any;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Validate a string environment variable
 * @param value The value to validate
 * @param definition The environment variable definition
 * @returns The validation result
 */
function validateString(value: string, definition: EnvVarDefinition): ValidationResult {
  if (definition.pattern && !definition.pattern.test(value)) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must match pattern ${definition.pattern}`,
    };
  }
  return { valid: true, value };
}

/**
 * Validate a number environment variable
 * @param value The value to validate
 * @param definition The environment variable definition
 * @returns The validation result
 */
function validateNumber(value: string, definition: EnvVarDefinition): ValidationResult {
  const num = Number(value);
  if (isNaN(num)) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must be a number`,
    };
  }
  if (definition.min !== undefined && num < definition.min) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must be at least ${definition.min}`,
    };
  }
  if (definition.max !== undefined && num > definition.max) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must be at most ${definition.max}`,
    };
  }
  return { valid: true, value: num };
}

/**
 * Validate a boolean environment variable
 * @param value The value to validate
 * @param definition The environment variable definition
 * @returns The validation result
 */
function validateBoolean(value: string, definition: EnvVarDefinition): ValidationResult {
  const lowerValue = value.toLowerCase();
  if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
    return { valid: true, value: true };
  }
  if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
    return { valid: true, value: false };
  }
  return {
    valid: false,
    value: null,
    error: `${definition.name} must be a boolean (true/false, 1/0, yes/no)`,
  };
}

/**
 * Validate a URL environment variable
 * @param value The value to validate
 * @param definition The environment variable definition
 * @returns The validation result
 */
function validateUrl(value: string, definition: EnvVarDefinition): ValidationResult {
  try {
    new URL(value);
    return { valid: true, value };
  } catch (error) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must be a valid URL`,
    };
  }
}

/**
 * Validate an email environment variable
 * @param value The value to validate
 * @param definition The environment variable definition
 * @returns The validation result
 */
function validateEmail(value: string, definition: EnvVarDefinition): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must be a valid email address`,
    };
  }
  return { valid: true, value };
}

/**
 * Validate a port environment variable
 * @param value The value to validate
 * @param definition The environment variable definition
 * @returns The validation result
 */
function validatePort(value: string, definition: EnvVarDefinition): ValidationResult {
  const port = Number(value);
  if (isNaN(port) || port < 1 || port > 65535) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must be a valid port number (1-65535)`,
    };
  }
  return { valid: true, value: port };
}

/**
 * Validate a path environment variable
 * @param value The value to validate
 * @param definition The environment variable definition
 * @returns The validation result
 */
function validatePath(value: string, definition: EnvVarDefinition): ValidationResult {
  // Simple path validation - could be enhanced for specific requirements
  if (!value || value.includes('\0')) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must be a valid file path`,
    };
  }
  return { valid: true, value };
}

/**
 * Validate a JSON environment variable
 * @param value The value to validate
 * @param definition The environment variable definition
 * @returns The validation result
 */
function validateJson(value: string, definition: EnvVarDefinition): ValidationResult {
  try {
    const parsed = JSON.parse(value);
    return { valid: true, value: parsed };
  } catch (error) {
    return {
      valid: false,
      value: null,
      error: `${definition.name} must be valid JSON`,
    };
  }
}

/**
 * Validate an environment variable
 * @param definition The environment variable definition
 * @returns The validated value
 * @throws Error if validation fails and the variable is required
 */
export function validateEnvVar(definition: EnvVarDefinition): any {
  const { name, type, required, default: defaultValue } = definition;
  
  // Get the value from the environment
  let value = process.env[name];
  
  // If the value is not set, use the default value
  if (value === undefined) {
    if (defaultValue !== undefined) {
      value = defaultValue;
    } else if (required) {
      throw new Error(`Required environment variable ${name} is not set`);
    } else {
      return undefined;
    }
  }

  // Validate the value based on its type
  let result: ValidationResult;
  
  switch (type) {
    case EnvVarType.STRING:
      result = validateString(value, definition);
      break;
    case EnvVarType.NUMBER:
      result = validateNumber(value, definition);
      break;
    case EnvVarType.BOOLEAN:
      result = validateBoolean(value, definition);
      break;
    case EnvVarType.URL:
      result = validateUrl(value, definition);
      break;
    case EnvVarType.EMAIL:
      result = validateEmail(value, definition);
      break;
    case EnvVarType.PORT:
      result = validatePort(value, definition);
      break;
    case EnvVarType.PATH:
      result = validatePath(value, definition);
      break;
    case EnvVarType.JSON:
      result = validateJson(value, definition);
      break;
    default:
      throw new Error(`Unknown environment variable type: ${type}`);
  }
  
  // If validation failed and the variable is required, throw an error
  if (!result.valid && required) {
    throw new Error(result.error);
  }
  
  // If validation failed but the variable is not required, log a warning
  if (!result.valid && !required) {
    logger.warn(`Invalid environment variable ${name}: ${result.error}`);
    return undefined;
  }
  
  return result.value;
}

/**
 * Validate multiple environment variables
 * @param definitions The environment variable definitions
 * @returns An object with the validated values
 * @throws Error if validation fails for any required variable
 */
export function validateEnvVars(definitions: EnvVarDefinition[]): Record<string, any> {
  const result: Record<string, any> = {};
  const errors: string[] = [];
  
  for (const definition of definitions) {
    try {
      const value = validateEnvVar(definition);
      if (value !== undefined) {
        result[definition.name] = value;
      }
    } catch (error: any) {
      errors.push(error.message);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment variable validation failed:\n${errors.join('\n')}`);
  }
  
  return result;
}
