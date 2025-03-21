# Webhook Validation Guide

This guide provides information on how to use the webhook validation middleware in the Frontapp MCP integration.

## Overview

The Frontapp MCP integration includes a webhook validation middleware that validates webhook payloads against schemas. This middleware helps ensure that webhook payloads meet the expected structure and prevents invalid data from being processed.

## How It Works

The webhook validation middleware uses the validation utility to validate webhook payloads against schemas. It identifies the webhook event type from the payload and applies the appropriate schema for validation.

### Key Features

- **Schema-Based Validation**: Validates webhook payloads against schemas.
- **Event Type Identification**: Identifies the webhook event type from the payload.
- **Error Handling**: Returns detailed error messages when validation fails.
- **Type Conversion**: Converts data to the appropriate types based on the schema.
- **Logging**: Logs validation failures for debugging.

## Using the Webhook Validation Middleware

The webhook validation middleware provides several methods for validating webhook payloads:

### `validateWebhook`

Creates a middleware function that validates webhook payloads against a map of event types to schemas.

```typescript
WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);
```

Parameters:
- `eventTypeToSchemaMap`: A map of event types to schemas.

Example:

```typescript
import WebhookValidationMiddleware from '../middleware/webhookValidation.js';

// Define schemas for webhook events
const eventTypeToSchemaMap = {
  'conversation.created': {
    type: 'object',
    options: {
      properties: {
        // Define properties for conversation.created event
      },
    },
  },
  'message.created': {
    type: 'object',
    options: {
      properties: {
        // Define properties for message.created event
      },
    },
  },
};

// Create a middleware function that validates webhook payloads
const webhookValidator = WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);

// Use the middleware in a route
app.post('/webhooks', webhookValidator, (req, res) => {
  // The webhook payload has been validated and is available in req.body
  const { type, payload } = req.body;
  // ...
});
```

### `validateConversationWebhook`

Creates a middleware function that validates conversation webhook payloads.

```typescript
WebhookValidationMiddleware.validateConversationWebhook();
```

Example:

```typescript
import WebhookValidationMiddleware from '../middleware/webhookValidation.js';

// Create a middleware function that validates conversation webhook payloads
const conversationWebhookValidator = WebhookValidationMiddleware.validateConversationWebhook();

// Use the middleware in a route
app.post('/webhooks/conversations', conversationWebhookValidator, (req, res) => {
  // The conversation webhook payload has been validated and is available in req.body
  const { type, payload } = req.body;
  // ...
});
```

### `validateMessageWebhook`

Creates a middleware function that validates message webhook payloads.

```typescript
WebhookValidationMiddleware.validateMessageWebhook();
```

Example:

```typescript
import WebhookValidationMiddleware from '../middleware/webhookValidation.js';

// Create a middleware function that validates message webhook payloads
const messageWebhookValidator = WebhookValidationMiddleware.validateMessageWebhook();

// Use the middleware in a route
app.post('/webhooks/messages', messageWebhookValidator, (req, res) => {
  // The message webhook payload has been validated and is available in req.body
  const { type, payload } = req.body;
  // ...
});
```

### `validateContactWebhook`

Creates a middleware function that validates contact webhook payloads.

```typescript
WebhookValidationMiddleware.validateContactWebhook();
```

Example:

```typescript
import WebhookValidationMiddleware from '../middleware/webhookValidation.js';

// Create a middleware function that validates contact webhook payloads
const contactWebhookValidator = WebhookValidationMiddleware.validateContactWebhook();

// Use the middleware in a route
app.post('/webhooks/contacts', contactWebhookValidator, (req, res) => {
  // The contact webhook payload has been validated and is available in req.body
  const { type, payload } = req.body;
  // ...
});
```

## Webhook Event Types

The webhook validation middleware supports the following webhook event types:

### Conversation Events

- `conversation.created`: A new conversation has been created.
- `conversation.assigned`: A conversation has been assigned to a teammate.

### Message Events

- `message.created`: A new message has been created.

### Contact Events

- `contact.created`: A new contact has been created.
- `contact.updated`: A contact has been updated.

## Schema Definition

The webhook validation middleware uses schemas to validate webhook payloads. A schema is an object that defines the type and options for validating data.

### Schema Types

The webhook validation middleware supports the following schema types:

- `object`: Validates an object value.
- `custom`: Validates a value using a custom validator function.

### Schema Options

Each schema type has its own options for validation:

#### Object Schema

```typescript
{
  type: 'object',
  options: {
    properties: {
      [key: string]: {
        required?: boolean;
        validator: (value: unknown) => any;
      };
    };
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

## Error Handling

When validation fails, the webhook validation middleware returns a 400 Bad Request response with an error message and details about the validation errors:

```json
{
  "error": "Webhook validation failed",
  "details": [
    "Value is required",
    "Value must match the required pattern",
    "Invalid property 'id': Value must match the required pattern"
  ]
}
```

## Logging

When validation fails, the webhook validation middleware logs a warning message with the following information:

- Error details
- Request body
- Request path
- HTTP method
- Event type

Example log message:

```
WARN: Webhook validation failed - {"errors":["Value is required"],"body":{"type":"conversation.created","payload":{}},"path":"/webhooks","method":"POST","eventType":"conversation.created"}
```

## Best Practices

1. **Validate Early**: Validate webhook payloads as early as possible in the request handling process to catch errors before they propagate.
2. **Use Appropriate Schemas**: Use the appropriate schema type for each data type you need to validate.
3. **Handle Errors Gracefully**: Catch and handle validation errors gracefully to provide helpful error messages to users.
4. **Log Validation Failures**: Log validation failures to help with debugging and monitoring.
5. **Keep Schemas Up to Date**: Keep schemas up to date with the latest Frontapp webhook payload structures.
6. **Test with Real Payloads**: Test validation with real webhook payloads to ensure it handles them correctly.
7. **Consider Performance**: Consider the performance impact of validation, especially for large webhook payloads.
