# Data Utilities Guide

This guide provides information on how to use the data validation and transformation utilities in the Frontapp MCP integration.

## Overview

The Frontapp MCP integration includes utilities for validating and transforming data. These utilities help ensure that data is valid and in the correct format before it is sent to Frontapp or processed by the integration.

## Data Validation

The data validation utility provides methods for validating data against various criteria. It helps ensure that data meets the requirements of the Frontapp API and the integration.

### Validation Methods

The validation utility provides the following methods:

#### `validateString`

Validates a string value against various criteria.

```typescript
validationUtil.validateString(
  value: unknown,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
    defaultValue?: string;
  } = {}
): string
```

Example:

```typescript
// Validate a required string with a minimum length of 3
const name = validationUtil.validateString(data.name, {
  required: true,
  minLength: 3,
  maxLength: 50,
});

// Validate an optional string with a default value
const description = validationUtil.validateString(data.description, {
  required: false,
  defaultValue: 'No description provided',
});

// Validate a string against a pattern
const email = validationUtil.validateString(data.email, {
  required: true,
  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
});
```

#### `validateNumber`

Validates a number value against various criteria.

```typescript
validationUtil.validateNumber(
  value: unknown,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    defaultValue?: number;
  } = {}
): number
```

Example:

```typescript
// Validate a required integer between 1 and 100
const age = validationUtil.validateNumber(data.age, {
  required: true,
  min: 1,
  max: 100,
  integer: true,
});

// Validate an optional number with a default value
const score = validationUtil.validateNumber(data.score, {
  required: false,
  min: 0,
  max: 10,
  defaultValue: 0,
});
```

#### `validateBoolean`

Validates a boolean value.

```typescript
validationUtil.validateBoolean(
  value: unknown,
  options: {
    required?: boolean;
    defaultValue?: boolean;
  } = {}
): boolean
```

Example:

```typescript
// Validate a required boolean
const isActive = validationUtil.validateBoolean(data.isActive, {
  required: true,
});

// Validate an optional boolean with a default value
const isAdmin = validationUtil.validateBoolean(data.isAdmin, {
  required: false,
  defaultValue: false,
});
```

#### `validateArray`

Validates an array value against various criteria.

```typescript
validationUtil.validateArray<T>(
  value: unknown,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: unknown) => T;
    defaultValue?: T[];
  } = {}
): T[]
```

Example:

```typescript
// Validate a required array of strings
const tags = validationUtil.validateArray(data.tags, {
  required: true,
  minLength: 1,
  itemValidator: (item) => validationUtil.validateString(item, { required: true }),
});

// Validate an optional array of numbers with a default value
const scores = validationUtil.validateArray(data.scores, {
  required: false,
  defaultValue: [0, 0, 0],
  itemValidator: (item) => validationUtil.validateNumber(item, { required: true }),
});
```

#### `validateObject`

Validates an object value against various criteria.

```typescript
validationUtil.validateObject<T extends Record<string, any>>(
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
): T
```

Example:

```typescript
// Validate a required object with specific properties
const user = validationUtil.validateObject(data.user, {
  required: true,
  properties: {
    id: {
      required: true,
      validator: (value) => validationUtil.validateString(value, { required: true }),
    },
    name: {
      required: true,
      validator: (value) => validationUtil.validateString(value, { required: true }),
    },
    email: {
      required: true,
      validator: (value) =>
        validationUtil.validateString(value, {
          required: true,
          pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        }),
    },
    age: {
      required: false,
      validator: (value) =>
        validationUtil.validateNumber(value, { required: false, min: 0, integer: true }),
    },
  },
});
```

#### `validateCustom`

Validates a value using a custom validator function.

```typescript
validationUtil.validateCustom<T>(value: unknown, validator: (value: unknown) => T): T
```

Example:

```typescript
// Validate a value using a custom validator function
const date = validationUtil.validateCustom(data.date, (value) => {
  if (!(value instanceof Date) && !(typeof value === 'string' || typeof value === 'number')) {
    throw new Error('Value must be a Date, string, or number');
  }

  const dateObj = value instanceof Date ? value : new Date(value);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }

  return dateObj;
});
```

#### `validateWithResult`

Validates a value using a custom validator function and returns a result object.

```typescript
validationUtil.validateWithResult<T>(
  value: unknown,
  validator: (value: unknown) => T
): { valid: boolean; data?: T; errors?: string[] }
```

Example:

```typescript
// Validate a value using a custom validator function and handle the result
const result = validationUtil.validateWithResult(data.email, (value) => {
  return validationUtil.validateString(value, {
    required: true,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  });
});

if (result.valid) {
  // Use the validated data
  const email = result.data;
} else {
  // Handle the validation errors
  console.error('Validation errors:', result.errors);
}
```

### Usage in Code

```typescript
import { validationUtil } from '../utils/validation.js';

// Validate a request payload
function validateRequestPayload(payload: unknown): RequestPayload {
  return validationUtil.validateObject(payload, {
    required: true,
    properties: {
      conversationId: {
        required: true,
        validator: (value) => validationUtil.validateString(value, { required: true }),
      },
      message: {
        required: true,
        validator: (value) => validationUtil.validateString(value, { required: true }),
      },
      tags: {
        required: false,
        validator: (value) =>
          validationUtil.validateArray(value, {
            required: false,
            itemValidator: (item) => validationUtil.validateString(item, { required: true }),
          }),
      },
    },
  });
}
```

## Data Transformation

The data transformation utility provides methods for transforming data between different formats. It helps ensure that data is in the correct format for the Frontapp API and the integration.

### Transformation Methods

The transformation utility provides the following methods:

#### `transformObject`

Transforms an object by mapping its properties.

```typescript
transformationUtil.transformObject<T extends Record<string, any>, U extends Record<string, any>>(
  obj: T,
  mapping: {
    [K in keyof U]?: keyof T | ((obj: T) => U[K]);
  }
): U
```

Example:

```typescript
// Transform a user object to a contact object
const contact = transformationUtil.transformObject(user, {
  id: 'id',
  name: 'fullName',
  email: 'emailAddress',
  phone: 'phoneNumber',
  company: (user) => user.organization?.name || '',
});
```

#### `transformArray`

Transforms an array of objects by mapping their properties.

```typescript
transformationUtil.transformArray<T extends Record<string, any>, U extends Record<string, any>>(
  arr: T[],
  mapping: {
    [K in keyof U]?: keyof T | ((obj: T) => U[K]);
  }
): U[]
```

Example:

```typescript
// Transform an array of user objects to an array of contact objects
const contacts = transformationUtil.transformArray(users, {
  id: 'id',
  name: 'fullName',
  email: 'emailAddress',
  phone: 'phoneNumber',
  company: (user) => user.organization?.name || '',
});
```

#### `transformValue`

Transforms a value using a custom transformer function.

```typescript
transformationUtil.transformValue<T, U>(value: T, transformer: (value: T) => U): U
```

Example:

```typescript
// Transform a date string to a Date object
const date = transformationUtil.transformValue('2023-01-01', (value) => new Date(value));
```

#### `dateToISOString`

Transforms a date to an ISO string.

```typescript
transformationUtil.dateToISOString(date: Date | number | string): string
```

Example:

```typescript
// Transform a Date object to an ISO string
const isoString = transformationUtil.dateToISOString(new Date());

// Transform a timestamp to an ISO string
const isoString = transformationUtil.dateToISOString(1672531200000);

// Transform a date string to an ISO string
const isoString = transformationUtil.dateToISOString('2023-01-01');
```

#### `dateToUnixTimestamp`

Transforms a date to a Unix timestamp (seconds since epoch).

```typescript
transformationUtil.dateToUnixTimestamp(date: Date | number | string): number
```

Example:

```typescript
// Transform a Date object to a Unix timestamp
const timestamp = transformationUtil.dateToUnixTimestamp(new Date());

// Transform a date string to a Unix timestamp
const timestamp = transformationUtil.dateToUnixTimestamp('2023-01-01');
```

#### `unixTimestampToDate`

Transforms a Unix timestamp to a Date object.

```typescript
transformationUtil.unixTimestampToDate(timestamp: number): Date
```

Example:

```typescript
// Transform a Unix timestamp to a Date object
const date = transformationUtil.unixTimestampToDate(1672531200);
```

#### `toCamelCase`

Transforms a string to camelCase.

```typescript
transformationUtil.toCamelCase(str: string): string
```

Example:

```typescript
// Transform a string to camelCase
const camelCase = transformationUtil.toCamelCase('user_id'); // userId
```

#### `toSnakeCase`

Transforms a string to snake_case.

```typescript
transformationUtil.toSnakeCase(str: string): string
```

Example:

```typescript
// Transform a string to snake_case
const snakeCase = transformationUtil.toSnakeCase('userId'); // user_id
```

#### `toKebabCase`

Transforms a string to kebab-case.

```typescript
transformationUtil.toKebabCase(str: string): string
```

Example:

```typescript
// Transform a string to kebab-case
const kebabCase = transformationUtil.toKebabCase('userId'); // user-id
```

#### `objectKeysToCamelCase`

Transforms an object's keys to camelCase.

```typescript
transformationUtil.objectKeysToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any>
```

Example:

```typescript
// Transform an object's keys to camelCase
const camelCaseObj = transformationUtil.objectKeysToCamelCase({
  user_id: 123,
  first_name: 'John',
  last_name: 'Doe',
  email_address: 'john.doe@example.com',
});

// Result:
// {
//   userId: 123,
//   firstName: 'John',
//   lastName: 'Doe',
//   emailAddress: 'john.doe@example.com'
// }
```

#### `objectKeysToSnakeCase`

Transforms an object's keys to snake_case.

```typescript
transformationUtil.objectKeysToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any>
```

Example:

```typescript
// Transform an object's keys to snake_case
const snakeCaseObj = transformationUtil.objectKeysToSnakeCase({
  userId: 123,
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'john.doe@example.com',
});

// Result:
// {
//   user_id: 123,
//   first_name: 'John',
//   last_name: 'Doe',
//   email_address: 'john.doe@example.com'
// }
```

### Usage in Code

```typescript
import { transformationUtil } from '../utils/transformation.js';

// Transform a Frontapp API response to a client-friendly format
function transformConversation(conversation: any): ClientConversation {
  return transformationUtil.transformObject(conversation, {
    id: 'id',
    subject: 'subject',
    status: 'status',
    assignee: (conversation) => {
      if (!conversation.assignee) return null;
      return transformationUtil.transformObject(conversation.assignee, {
        id: 'id',
        name: (assignee) => `${assignee.first_name} ${assignee.last_name}`,
        email: 'email',
      });
    },
    tags: (conversation) =>
      conversation.tags.map((tag: any) =>
        transformationUtil.transformObject(tag, {
          id: 'id',
          name: 'name',
        })
      ),
    createdAt: (conversation) =>
      transformationUtil.unixTimestampToDate(conversation.created_at).toISOString(),
  });
}
```

## Best Practices

1. **Validate Early**: Validate data as early as possible in the request handling process to catch errors before they propagate.
2. **Transform Consistently**: Use consistent transformation patterns throughout the codebase to ensure data is in the expected format.
3. **Handle Errors Gracefully**: Catch and handle validation and transformation errors gracefully to provide helpful error messages to users.
4. **Use Type Annotations**: Use TypeScript type annotations to ensure type safety and provide better IDE support.
5. **Document Validation Rules**: Document validation rules and transformation patterns to help other developers understand the expected data format.
6. **Test Edge Cases**: Test validation and transformation functions with edge cases to ensure they handle unexpected input correctly.
7. **Keep It Simple**: Use the simplest validation and transformation rules that meet the requirements to avoid unnecessary complexity.
