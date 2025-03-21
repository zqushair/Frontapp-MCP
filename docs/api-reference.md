# API Reference

This document provides detailed information about the available API endpoints in the Frontapp MCP integration.

> **Note:** For detailed examples of request and response payloads, see the [API Examples](api-examples.md) document.

## Overview

The Frontapp MCP integration exposes a set of tools that can be called by LLMs through the MCP protocol. Each tool corresponds to a specific Frontapp API operation.

The integration provides two ways to access these tools:

1. **MCP Protocol**: LLMs can call tools directly through the MCP protocol.
2. **RESTful API**: Tools can be accessed through a RESTful API provided by the API Gateway.

## API Gateway

The API Gateway provides a RESTful interface to the MCP tools. For detailed information about the API Gateway, see the [API Gateway Guide](api-gateway-guide.md).

### API Gateway Endpoints

#### Tools API

```
GET /tools
```

Returns a list of all available MCP tools with their descriptions and input schemas.

```
POST /tools/{name}
```

Executes a specific MCP tool with the provided arguments.

#### Health API

```
GET /health
```

Returns basic health information.

```
GET /health/metrics
```

Returns detailed system and application metrics.

```
GET /health/logs
```

Returns recent logs (disabled in production).

#### API Documentation

```
GET /api-docs
```

Interactive API documentation using Swagger/OpenAPI.

## Tool Format

All tools follow a standard format:

```json
{
  "name": "tool_name",
  "arguments": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

## Available Tools

### Conversation Tools

#### get_conversations

Retrieves a list of conversations from Frontapp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | No | Search query |
| inbox_id | string | No | Filter by inbox ID |
| tag_id | string | No | Filter by tag ID |
| assignee_id | string | No | Filter by assignee ID |
| status | string | No | Filter by conversation status (open, archived, spam, deleted) |
| limit | number | No | Maximum number of results to return |
| page_token | string | No | Token for pagination |

**Example:**

```json
{
  "name": "get_conversations",
  "arguments": {
    "inbox_id": "inb_123",
    "status": "open",
    "limit": 10
  }
}
```

#### get_conversation

Retrieves details of a specific conversation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | ID of the conversation |

**Example:**

```json
{
  "name": "get_conversation",
  "arguments": {
    "conversation_id": "cnv_123"
  }
}
```

#### send_message

Sends a message to a conversation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | ID of the conversation |
| content | string | Yes | Message content |
| author_id | string | No | ID of the message author |
| subject | string | No | Message subject |
| options | object | No | Additional options |
| options.tags | string[] | No | Tags to apply to the conversation |
| options.archive | boolean | No | Whether to archive the conversation after sending |
| options.draft | boolean | No | Whether to create a draft instead of sending |

**Example:**

```json
{
  "name": "send_message",
  "arguments": {
    "conversation_id": "cnv_123",
    "content": "Hello, how can I help you today?",
    "options": {
      "tags": ["support", "priority"],
      "archive": false
    }
  }
}
```

#### add_comment

Adds a comment to a conversation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | ID of the conversation |
| body | string | Yes | Comment body |
| author_id | string | Yes | ID of the comment author |

**Example:**

```json
{
  "name": "add_comment",
  "arguments": {
    "conversation_id": "cnv_123",
    "body": "Internal note: Customer needs follow-up",
    "author_id": "tea_123"
  }
}
```

#### archive_conversation

Archives a conversation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | ID of the conversation |

**Example:**

```json
{
  "name": "archive_conversation",
  "arguments": {
    "conversation_id": "cnv_123"
  }
}
```

#### assign_conversation

Assigns a conversation to a teammate.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | ID of the conversation |
| assignee_id | string | Yes | ID of the teammate to assign the conversation to |

**Example:**

```json
{
  "name": "assign_conversation",
  "arguments": {
    "conversation_id": "cnv_123",
    "assignee_id": "tea_123"
  }
}
```

### Contact Tools

#### get_contact

Retrieves details of a specific contact.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contact_id | string | Yes | ID of the contact |

**Example:**

```json
{
  "name": "get_contact",
  "arguments": {
    "contact_id": "cta_123"
  }
}
```

#### create_contact

Creates a new contact.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | No | Contact name |
| description | string | No | Contact description |
| handles | object[] | Yes | Contact handles (email, phone, etc.) |
| handles[].handle | string | Yes | Handle value (e.g., email address) |
| handles[].source | string | Yes | Handle source (e.g., email) |
| links | object[] | No | Contact links |
| links[].name | string | Yes | Link name |
| links[].url | string | Yes | Link URL |
| custom_fields | object | No | Custom fields |

**Example:**

```json
{
  "name": "create_contact",
  "arguments": {
    "name": "John Doe",
    "handles": [
      {
        "handle": "john.doe@example.com",
        "source": "email"
      }
    ],
    "links": [
      {
        "name": "Website",
        "url": "https://example.com"
      }
    ]
  }
}
```

#### update_contact

Updates an existing contact.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contact_id | string | Yes | ID of the contact |
| name | string | No | Contact name |
| description | string | No | Contact description |
| handles | object[] | No | Contact handles (email, phone, etc.) |
| handles[].handle | string | Yes | Handle value (e.g., email address) |
| handles[].source | string | Yes | Handle source (e.g., email) |
| links | object[] | No | Contact links |
| links[].name | string | Yes | Link name |
| links[].url | string | Yes | Link URL |
| custom_fields | object | No | Custom fields |

**Example:**

```json
{
  "name": "update_contact",
  "arguments": {
    "contact_id": "cta_123",
    "name": "John Smith",
    "description": "Updated contact information"
  }
}
```

### Tag Tools

#### get_tags

Retrieves a list of tags from Frontapp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum number of results to return |
| page_token | string | No | Token for pagination |

**Example:**

```json
{
  "name": "get_tags",
  "arguments": {
    "limit": 20
  }
}
```

#### apply_tag

Applies a tag to a conversation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | ID of the conversation |
| tag_id | string | Yes | ID of the tag to apply |

**Example:**

```json
{
  "name": "apply_tag",
  "arguments": {
    "conversation_id": "cnv_123",
    "tag_id": "tag_123"
  }
}
```

#### remove_tag

Removes a tag from a conversation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | ID of the conversation |
| tag_id | string | Yes | ID of the tag to remove |

**Example:**

```json
{
  "name": "remove_tag",
  "arguments": {
    "conversation_id": "cnv_123",
    "tag_id": "tag_123"
  }
}
```

### Teammate Tools

#### get_teammates

Retrieves a list of teammates from Frontapp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum number of results to return |
| page_token | string | No | Token for pagination |

**Example:**

```json
{
  "name": "get_teammates",
  "arguments": {
    "limit": 20
  }
}
```

#### get_teammate

Retrieves details of a specific teammate.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| teammate_id | string | Yes | ID of the teammate |

**Example:**

```json
{
  "name": "get_teammate",
  "arguments": {
    "teammate_id": "tea_123"
  }
}
```

### Account Tools

#### get_accounts

Retrieves a list of accounts from Frontapp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | No | Search query |
| limit | number | No | Maximum number of results to return |
| page_token | string | No | Token for pagination |

**Example:**

```json
{
  "name": "get_accounts",
  "arguments": {
    "limit": 20
  }
}
```

#### get_account

Retrieves details of a specific account.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| account_id | string | Yes | ID of the account |

**Example:**

```json
{
  "name": "get_account",
  "arguments": {
    "account_id": "act_123"
  }
}
```

#### create_account

Creates a new account.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Account name |
| domains | string[] | Yes | Account domains |
| description | string | No | Account description |
| external_id | string | No | External ID |
| custom_fields | object | No | Custom fields |

**Example:**

```json
{
  "name": "create_account",
  "arguments": {
    "name": "Acme Inc.",
    "domains": ["acme.com"],
    "description": "A company that makes everything"
  }
}
```

#### update_account

Updates an existing account.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| account_id | string | Yes | ID of the account |
| name | string | No | Account name |
| domains | string[] | No | Account domains |
| description | string | No | Account description |
| external_id | string | No | External ID |
| custom_fields | object | No | Custom fields |

**Example:**

```json
{
  "name": "update_account",
  "arguments": {
    "account_id": "act_123",
    "name": "Acme Corporation",
    "description": "Updated account information"
  }
}
```

## Response Format

All tools return responses in a standard format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Response content"
    }
  ],
  "isError": false
}
```

If an error occurs, the `isError` field will be set to `true`:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error message"
    }
  ],
  "isError": true
}
```

## Pagination

Some endpoints support pagination. When a paginated response has more results, it will include a `page_token` in the response. You can use this token in subsequent requests to retrieve the next page of results.

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request. In addition, error responses include a descriptive error message to help you troubleshoot the issue.

## Rate Limiting and Retry Logic

The Frontapp API has rate limits. If you exceed these limits, you will receive a 429 Too Many Requests response. The integration includes sophisticated rate limiting and retry mechanisms to handle these limitations gracefully:

### Rate Limiting Features

- **Proactive Rate Limit Management**: Monitors rate limit headers from Frontapp API responses
- **Adaptive Request Timing**: Automatically adjusts request timing when approaching rate limits
- **Request Distribution**: Spreads remaining requests evenly until rate limit reset
- **429 Response Handling**: Properly handles "Too Many Requests" responses with appropriate backoff

### Retry Logic

The integration implements a robust retry mechanism with exponential backoff:

- **Automatic Retries**: Failed requests (network errors and server errors) are automatically retried
- **Exponential Backoff**: Each retry waits longer than the previous one to avoid overwhelming the server
- **Configurable Parameters**: Maximum retries and initial delay can be configured
- **Retry Tracking**: Maintains state across retry attempts

### Configuration

The Frontapp API client can be configured with custom retry settings:

```typescript
// Configure retry settings
frontappClient.configureRetries(
  maxRetries = 3,    // Maximum number of retry attempts
  retryDelay = 1000  // Initial delay in milliseconds
);
```

This configuration allows you to fine-tune the retry behavior based on your specific needs.

## Further Reading

For more information about the Frontapp API, refer to the [official Frontapp API documentation](https://dev.frontapp.com/reference/overview).
