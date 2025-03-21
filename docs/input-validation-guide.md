# Input Validation Guide

This guide provides information on how to use the input validation middleware in the Frontapp MCP integration.

## Overview

The Frontapp MCP integration includes an input validation middleware that validates request data against schemas. This middleware helps ensure that data meets the requirements of the API and prevents invalid data from being processed.

## How It Works

The input validation middleware uses the validation utility to validate request data against schemas. It can validate request body, query parameters, and URL parameters.

### Key Features

- **Schema-Based Validation**: Validates request data against schemas.
- **Multiple Data Sources**: Can validate request body, query parameters, and URL parameters.
- **Error Handling**: Returns detailed error messages when validation fails.
- **Type Conversion**: Converts data to the appropriate types based on the schema.
- **Default Values**: Provides default values for optional fields.

## Using the Validation Middleware

The validation middleware provides several methods for validating request data:

### `validate`

Validates request data against a schema.

```typescript
ValidationMiddleware.validate(schema, dataSource);
```

Parameters:
- `schema`: The schema to validate against.
- `dataSource`: The source of the data to validate (`'body'`, `'query'`, or `'params'`). Defaults to `'body'`.

Example:

```typescript
import ValidationMiddleware from '../middleware/validation.js';

// Define a schema for validating request body
const userSchema = {
  type: 'object',
  options: {
    properties: {
      name: {
        required: true,
        validator: (value) => validationUtil.validateString(value, { required: true }),
      },
      email: {
        required: true,
        validator: (value) => validationUtil.validateString(value, {
          required: true,
          pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        }),
      },
      age: {
        required: false,
        validator: (value) => validationUtil.validateNumber(value, {
          required: false,
          min: 0,
          integer: true,
        }),
      },
    },
  },
};

// Use the validation middleware in a route
app.post('/users', ValidationMiddleware.validate(userSchema, 'body'), (req, res) => {
  // The request body has been validated and is available in req.body
  const user = req.body;
  // ...
});
```

### `validateBody`

Validates request body against a schema.

```typescript
ValidationMiddleware.validateBody(schema);
```

Parameters:
- `schema`: The schema to validate against.

Example:

```typescript
import ValidationMiddleware from '../middleware/validation.js';

// Define a schema for validating request body
const userSchema = {
  type: 'object',
  options: {
    properties: {
      name: {
        required: true,
        validator: (value) => validationUtil.validateString(value, { required: true }),
      },
      email: {
        required: true,
        validator: (value) => validationUtil.validateString(value, {
          required: true,
          pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        }),
      },
    },
  },
};

// Use the validation middleware in a route
app.post('/users', ValidationMiddleware.validateBody(userSchema), (req, res) => {
  // The request body has been validated and is available in req.body
  const user = req.body;
  // ...
});
```

### `validateQuery`

Validates request query parameters against a schema.

```typescript
ValidationMiddleware.validateQuery(schema);
```

Parameters:
- `schema`: The schema to validate against.

Example:

```typescript
import ValidationMiddleware from '../middleware/validation.js';

// Define a schema for validating query parameters
const searchSchema = {
  type: 'object',
  options: {
    properties: {
      q: {
        required: true,
        validator: (value) => validationUtil.validateString(value, { required: true }),
      },
      limit: {
        required: false,
        validator: (value) => validationUtil.validateNumber(value, {
          required: false,
          min: 1,
          max: 100,
          integer: true,
          defaultValue: 10,
        }),
      },
    },
  },
};

// Use the validation middleware in a route
app.get('/search', ValidationMiddleware.validateQuery(searchSchema), (req, res) => {
  // The query parameters have been validated and are available in req.query
  const { q, limit } = req.query;
  // ...
});
```

### `validateParams`

Validates request URL parameters against a schema.

```typescript
ValidationMiddleware.validateParams(schema);
```

Parameters:
- `schema`: The schema to validate against.

Example:

```typescript
import ValidationMiddleware from '../middleware/validation.js';

// Define a schema for validating URL parameters
const userIdSchema = {
  type: 'object',
  options: {
    properties: {
      userId: {
        required: true,
        validator: (value) => validationUtil.validateString(value, {
          required: true,
          pattern: /^[a-zA-Z0-9]+$/,
        }),
      },
    },
  },
};

// Use the validation middleware in a route
app.get('/users/:userId', ValidationMiddleware.validateParams(userIdSchema), (req, res) => {
  // The URL parameters have been validated and are available in req.params
  const { userId } = req.params;
  // ...
});
```

### `validateAll`

Validates request body, query parameters, and URL parameters against multiple schemas.

```typescript
ValidationMiddleware.validateAll({
  body: bodySchema,
  query: querySchema,
  params: paramsSchema,
});
```

Parameters:
- `schemas`: An object containing schemas for validating request body, query parameters, and URL parameters.

Example:

```typescript
import ValidationMiddleware from '../middleware/validation.js';

// Define schemas for validating request data
const schemas = {
  body: {
    type: 'object',
    options: {
      properties: {
        name: {
          required: true,
          validator: (value) => validationUtil.validateString(value, { required: true }),
        },
      },
    },
  },
  query: {
    type: 'object',
    options: {
      properties: {
        limit: {
          required: false,
          validator: (value) => validationUtil.validateNumber(value, {
            required: false,
            min: 1,
            max: 100,
            integer: true,
            defaultValue: 10,
          }),
        },
      },
    },
  },
  params: {
    type: 'object',
    options: {
      properties: {
        userId: {
          required: true,
          validator: (value) => validationUtil.validateString(value, {
            required: true,
            pattern: /^[a-zA-Z0-9]+$/,
          }),
        },
      },
    },
  },
};

// Use the validation middleware in a route
app.put('/users/:userId', ValidationMiddleware.validateAll(schemas), (req, res) => {
  // The request data has been validated and is available in req.body, req.query, and req.params
  const { userId } = req.params;
  const { name } = req.body;
  const { limit } = req.query;
  // ...
});
```

## Schema Definition

The validation middleware uses schemas to validate request data. A schema is an object that defines the type and options for validating data.

### Schema Types

The validation middleware supports the following schema types:

- `object`: Validates an object value.
- `array`: Validates an array value.
- `string`: Validates a string value.
- `number`: Validates a number value.
- `boolean`: Validates a boolean value.

### Schema Options

Each schema type has its own options for validation:

#### Object Schema

```typescript
{
  type: 'object',
  options: {
    required?: boolean;
    properties?: {
      [key: string]: {
        required?: boolean;
        validator: (value: unknown) => any;
      };
    };
    defaultValue?: any;
  }
}
```

#### Array Schema

```typescript
{
  type: 'array',
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: unknown) => any;
    defaultValue?: any[];
  }
}
```

#### String Schema

```typescript
{
  type: 'string',
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
    defaultValue?: string;
  }
}
```

#### Number Schema

```typescript
{
  type: 'number',
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    defaultValue?: number;
  }
}
```

#### Boolean Schema

```typescript
{
  type: 'boolean',
  options: {
    required?: boolean;
    defaultValue?: boolean;
  }
}
```

### Custom Validation

You can also use a custom validator function to validate data:

```typescript
{
  validator: (value: unknown) => any;
}
```

Example:

```typescript
const dateSchema = {
  validator: (value) => {
    if (!(value instanceof Date) && !(typeof value === 'string' || typeof value === 'number')) {
      throw new Error('Value must be a Date, string, or number');
    }

    const dateObj = value instanceof Date ? value : new Date(value);

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    return dateObj;
  },
};
```

## Error Handling

When validation fails, the validation middleware returns a 400 Bad Request response with an error message and details about the validation errors:

```json
{
  "error": "Validation failed",
  "details": [
    "Value is required",
    "Value must be at least 3 characters long",
    "Value does not match the required pattern"
  ]
}
```

## Best Practices

1. **Validate Early**: Validate request data as early as possible in the request handling process to catch errors before they propagate.
2. **Use Appropriate Schemas**: Use the appropriate schema type for each data type you need to validate.
3. **Provide Default Values**: Provide default values for optional fields to ensure consistent behavior.
4. **Use Custom Validators**: Use custom validators for complex validation logic that can't be expressed with the built-in validators.
5. **Handle Errors Gracefully**: Catch and handle validation errors gracefully to provide helpful error messages to users.
6. **Document Validation Rules**: Document validation rules to help other developers understand the expected data format.
7. **Test Edge Cases**: Test validation with edge cases to ensure it handles unexpected input correctly.
