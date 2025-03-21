/**
 * JSDoc Standardizer
 * This utility provides functions for standardizing JSDoc comments across the codebase
 */

import fs from 'fs';
import path from 'path';
import glob from 'glob';
import logger from './logger.js';

/**
 * JSDoc template for different types of components
 */
export const JSDocTemplates = {
  /**
   * JSDoc template for a class
   * @param className The name of the class
   * @param description The description of the class
   * @returns The JSDoc comment
   */
  class: (className: string, description: string): string => {
    return `/**
 * ${className}
 * ${description}
 */`;
  },

  /**
   * JSDoc template for a function
   * @param functionName The name of the function
   * @param description The description of the function
   * @param params The parameters of the function
   * @param returns The return value of the function
   * @returns The JSDoc comment
   */
  function: (
    functionName: string,
    description: string,
    params: Array<{ name: string; description: string; type?: string; optional?: boolean }> = [],
    returns?: { description: string; type?: string }
  ): string => {
    let jsdoc = `/**
 * ${functionName}
 * ${description}
 *`;

    // Add parameters
    if (params.length > 0) {
      jsdoc += '\n';
      for (const param of params) {
        const optional = param.optional ? ' (optional)' : '';
        const type = param.type ? ` {${param.type}}` : '';
        jsdoc += ` * @param${type} ${param.name}${optional} ${param.description}\n`;
      }
    }

    // Add return value
    if (returns) {
      const type = returns.type ? ` {${returns.type}}` : '';
      jsdoc += ` * @returns${type} ${returns.description}\n`;
    }

    jsdoc += ' */';
    return jsdoc;
  },

  /**
   * JSDoc template for a constant or variable
   * @param name The name of the constant or variable
   * @param description The description of the constant or variable
   * @param type The type of the constant or variable
   * @returns The JSDoc comment
   */
  constant: (name: string, description: string, type?: string): string => {
    const typeStr = type ? ` {${type}}` : '';
    return `/**
 * ${name}${typeStr}
 * ${description}
 */`;
  },

  /**
   * JSDoc template for a middleware function
   * @param name The name of the middleware
   * @param description The description of the middleware
   * @returns The JSDoc comment
   */
  middleware: (name: string, description: string): string => {
    return `/**
 * ${name} middleware
 * ${description}
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */`;
  },

  /**
   * JSDoc template for an interface
   * @param name The name of the interface
   * @param description The description of the interface
   * @returns The JSDoc comment
   */
  interface: (name: string, description: string): string => {
    return `/**
 * ${name} interface
 * ${description}
 */`;
  },

  /**
   * JSDoc template for a type
   * @param name The name of the type
   * @param description The description of the type
   * @returns The JSDoc comment
   */
  type: (name: string, description: string): string => {
    return `/**
 * ${name} type
 * ${description}
 */`;
  },

  /**
   * JSDoc template for an enum
   * @param name The name of the enum
   * @param description The description of the enum
   * @returns The JSDoc comment
   */
  enum: (name: string, description: string): string => {
    return `/**
 * ${name} enum
 * ${description}
 */`;
  },
};

/**
 * Find files that need JSDoc standardization
 * @param directory The directory to search in
 * @param pattern The glob pattern to match files
 * @returns A list of files that need JSDoc standardization
 */
export async function findFilesNeedingJSDoc(
  directory: string,
  pattern: string = '**/*.{ts,js}'
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, { cwd: directory, absolute: true }, (err: Error | null, files: string[]) => {
      if (err) {
        reject(err);
        return;
      }

      // Filter files that need JSDoc standardization
      const filesNeedingJSDoc: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');

        // Check if the file has missing or incomplete JSDoc comments
        if (needsJSDocStandardization(content)) {
          filesNeedingJSDoc.push(file);
        }
      }

      resolve(filesNeedingJSDoc);
    });
  });
}

/**
 * Check if a file needs JSDoc standardization
 * @param content The content of the file
 * @returns Whether the file needs JSDoc standardization
 */
function needsJSDocStandardization(content: string): boolean {
  // Regular expressions to match different types of declarations
  const exportedDeclarations = [
    /export\s+(const|let|var|function|class|interface|type|enum)\s+(\w+)/g,
    /export\s+default\s+(function|class)\s+(\w+)/g,
    /export\s+default\s+(\w+)/g,
  ];

  // Regular expression to match JSDoc comments
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;

  // Find all exported declarations
  const declarations: string[] = [];
  for (const regex of exportedDeclarations) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      declarations.push(match[2] || match[1]);
    }
  }

  // Find all JSDoc comments
  const jsdocComments = content.match(jsdocRegex) || [];

  // If there are more declarations than JSDoc comments, the file needs standardization
  return declarations.length > jsdocComments.length;
}

/**
 * Generate a JSDoc standardization report
 * @param directory The directory to search in
 * @param pattern The glob pattern to match files
 * @returns A report of files that need JSDoc standardization
 */
export async function generateJSDocReport(
  directory: string,
  pattern: string = '**/*.{ts,js}'
): Promise<{ totalFiles: number; filesNeedingJSDoc: string[] }> {
  try {
    const filesNeedingJSDoc = await findFilesNeedingJSDoc(directory, pattern);
    const totalFiles = await new Promise<number>((resolve, reject) => {
      glob(pattern, { cwd: directory }, (err: Error | null, files: string[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(files.length);
      });
    });

    return {
      totalFiles,
      filesNeedingJSDoc,
    };
  } catch (error) {
    logger.error('Error generating JSDoc report', {
      error: error instanceof Error ? error.message : String(error),
      directory,
      pattern,
    });
    throw error;
  }
}

/**
 * JSDoc standardization guidelines
 */
export const JSDocGuidelines = `
# JSDoc Standardization Guidelines

## General Guidelines

- Every exported function, class, interface, type, enum, and constant should have a JSDoc comment.
- JSDoc comments should be descriptive and provide enough information for users to understand the purpose and usage of the component.
- Use consistent formatting and style across all JSDoc comments.

## Function Comments

- Describe what the function does, not how it does it.
- Document all parameters with @param tags.
- Document the return value with @returns tag.
- Document any exceptions that might be thrown with @throws tag.

## Class Comments

- Describe the purpose and usage of the class.
- Document the constructor parameters if applicable.
- Document public methods and properties.

## Interface and Type Comments

- Describe the purpose and usage of the interface or type.
- Document all properties and methods.

## Enum Comments

- Describe the purpose and usage of the enum.
- Document all enum values.

## Constant Comments

- Describe the purpose and usage of the constant.
- Include the type if it's not obvious from the value.

## Examples

### Function Example

\`\`\`typescript
/**
 * Calculate the sum of two numbers
 *
 * @param a The first number
 * @param b The second number
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b;
}
\`\`\`

### Class Example

\`\`\`typescript
/**
 * A class representing a person
 */
export class Person {
  /**
   * Create a new person
   *
   * @param name The person's name
   * @param age The person's age
   */
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  /**
   * Get the person's name
   *
   * @returns The person's name
   */
  getName(): string {
    return this.name;
  }
}
\`\`\`

### Interface Example

\`\`\`typescript
/**
 * An interface representing a user
 */
export interface User {
  /**
   * The user's ID
   */
  id: string;

  /**
   * The user's name
   */
  name: string;

  /**
   * The user's email
   */
  email: string;
}
\`\`\`

### Enum Example

\`\`\`typescript
/**
 * An enum representing the days of the week
 */
export enum DayOfWeek {
  /**
   * Sunday
   */
  Sunday = 0,

  /**
   * Monday
   */
  Monday = 1,

  /**
   * Tuesday
   */
  Tuesday = 2,
}
\`\`\`

### Constant Example

\`\`\`typescript
/**
 * The maximum number of retries
 */
export const MAX_RETRIES = 3;
\`\`\`
`;
