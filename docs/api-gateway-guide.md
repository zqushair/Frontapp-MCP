# API Gateway Guide

This guide provides information on how to use the API Gateway in the Frontapp MCP integration.

## Overview

The API Gateway serves as the central entry point for all HTTP requests to the Frontapp MCP integration. It provides:

- **RESTful API**: Standardized endpoints for interacting with Frontapp data
- **Webhook Handling**: Processing of Frontapp webhook events
- **Security**: Authentication, authorization, and rate limiting
- **Documentation**: Interactive API documentation using Swagger/OpenAPI
- **Logging and Monitoring**: Comprehensive request logging and performance metrics

## API Endpoints

### Tools API

The Tools API provides access to the MCP tools that interact with Frontapp.

#### List Available Tools

```
GET /tools
```

Returns a list of all available MCP tools with their descriptions and input schemas.

Example response:
```json
{
  "status": "success",
  "data": [
    {
      "name": "get_conversations",
      "description": "Get a list of conversations from Frontapp",
      "inputSchema": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": ["open", "archived"],
            "description": "Filter conversations by status"
          },
          "limit": {
            "type": "number",
            "description": "Maximum number of conversations to return"
          }
        }
      }
    },
    {
      "name": "send_message",
      "description": "Send a message to a conversation",
      "inputSchema": {
        "type": "object",
        "properties": {
          "conversation_id": {
            "type": "string",
            "description": "ID of the conversation"
          },
          "body": {
            "type": "string",
            "description": "Message body"
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Tags to apply to the message"
          }
        },
        "required": ["conversation_id", "body"]
      }
    }
  ]
}
```

#### Execute a Tool

```
POST /tools/{name}
```

Executes a specific MCP tool with the provided arguments.

Example request:
```json
{
  "arguments": {
    "conversation_id": "cnv_123",
    "body": "Hello, how can I help you today?"
  }
}
```

Example response:
```json
{
  "status": "success",
  "data": {
    "message": {
      "id": "msg_789",
      "conversation_id": "cnv_123",
      "body": "Hello, how can I help you today?",
      "author": {
        "id": "usr_456",
        "name": "John Doe"
      },
      "created_at": "2025-03-21T04:35:00.000Z"
    }
  }
}
```

### Health API

The Health API provides endpoints for checking the health and status of the API Gateway.

#### Basic Health Check

```
GET /health
```

Returns basic health information.

#### Metrics

```
GET /health/metrics
```

Returns detailed system and application metrics.

#### Logs (Development Only)

```
GET /health/logs
```

Returns recent logs (disabled in production).

### Webhooks API

The Webhooks API handles incoming webhook events from Frontapp.

```
POST /webhooks
```

Processes webhook events from Frontapp.

## Authentication

The API Gateway uses API key authentication for all endpoints except the health check endpoints. To authenticate, include the API key in the `X-API-Key` header of your requests.

Example:
```
X-API-Key: your-api-key-here
```

## Security Features

### CORS

Cross-Origin Resource Sharing (CORS) is configured to allow requests from specified origins. By default, CORS is enabled for all origins (`*`), but this can be restricted in production.

### Rate Limiting

Rate limiting is applied to all API endpoints to prevent abuse. By default, the rate limit is 100 requests per 15 minutes per IP address.

### Security Headers

Security headers are applied to all responses using Helmet to protect against common web vulnerabilities.

## API Documentation

Interactive API documentation is available at:

```
/api-docs
```

This documentation is generated using Swagger/OpenAPI and provides a user-friendly interface for exploring and testing the API.

## Configuration

The API Gateway can be configured using the following environment variables:

- `API_KEY`: API key for authentication
- `CORS_ORIGINS`: Comma-separated list of allowed origins for CORS (default: `*`)
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting in milliseconds (default: `900000` - 15 minutes)
- `RATE_LIMIT_MAX`: Maximum number of requests per window (default: `100`)

## Error Handling

All API endpoints return standardized error responses with appropriate HTTP status codes:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid API key
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

Example error response:
```json
{
  "status": "error",
  "message": "Invalid API key"
}
```

## Logging

All API requests are logged with a unique request ID, which is included in the response headers as `X-Request-ID`. This ID can be used to trace requests through the system.

Example log:
```
2025-03-21 04:35:00 [info]: Request received {"requestId":"550e8400-e29b-41d4-a716-446655440000","method":"GET","path":"/tools"}
```

## Best Practices

1. **Include API Key**: Always include the API key in the `X-API-Key` header for authenticated endpoints
2. **Handle Rate Limiting**: Implement exponential backoff in clients to handle rate limiting
3. **Check Response Status**: Always check the `status` field in responses to determine success or failure
4. **Include Request ID in Support Requests**: When reporting issues, include the request ID from the `X-Request-ID` header
5. **Use Swagger Documentation**: Refer to the Swagger documentation for the most up-to-date API information
