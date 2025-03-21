# Frontapp MCP Documentation

Welcome to the documentation for the Frontapp MCP (Model Context Protocol) integration. This documentation provides comprehensive information about the integration, its features, and how to use it.

## Table of Contents

- [Introduction](#introduction)
- [Installation Guide](installation.md)
- [API Reference](api-reference.md)
- [Webhook Integration](webhook-integration.md)
- [Security Features](#security-features)
  - [Credential Storage](credential-storage-guide.md)
  - [HTTPS Setup](https-setup-guide.md)
  - [Input Validation](input-validation-guide.md)
  - [Rate Limiting](rate-limiting-guide.md)
  - [Webhook Validation](webhook-validation-guide.md)
  - [Security Testing](security-testing-guide.md)
- [Development Guide](development-guide.md)

## Introduction

The Frontapp MCP integration enables Large Language Models (LLMs) to interact with the Frontapp customer communication platform through the Model Context Protocol (MCP). This integration allows LLMs to:

- Access and manipulate Frontapp data (conversations, contacts, tags, etc.)
- Automate Frontapp workflows using natural language commands
- Enhance Frontapp's functionality with AI-powered features
- Support real-time updates and event-driven automation using webhooks

### Architecture

The integration follows a client-server architecture:

1. **LLM Client**: Sends requests to the MCP server in a structured format
2. **MCP Server**: Acts as a bridge between the LLM and Frontapp's API
3. **Frontapp API**: Provides access to Frontapp data and functionality

### Key Components

- **API Gateway**: Handles incoming requests from the LLM and webhooks from Frontapp
- **Request Handlers**: Process different types of requests from the LLM
- **Webhook Handlers**: Process different types of webhooks from Frontapp
- **Frontapp API Client**: Encapsulates the logic for interacting with the Frontapp API
- **Data Models**: Define the structure of data exchanged between the LLM, MCP server, and Frontapp

### Supported Features

The integration supports a wide range of Frontapp features, including:

- **Conversations**: Retrieve, send messages, add comments, archive, assign
- **Contacts**: Retrieve, create, update
- **Tags**: Retrieve, apply, remove
- **Teammates**: Retrieve information
- **Accounts**: Retrieve, create, update
- **Webhooks**: Process real-time events from Frontapp

For detailed information about each feature, please refer to the [API Reference](api-reference.md).

### Getting Started

To get started with the Frontapp MCP integration, follow these steps:

1. [Install and set up the integration](installation.md)
2. [Explore the available API endpoints](api-reference.md)
3. [Use the client library to interact with the MCP server](#client-library)
4. [Set up webhook integration for real-time updates](webhook-integration.md)

If you're interested in contributing to the project, check out the [Development Guide](development-guide.md).

### Client Library

The Frontapp MCP integration includes a TypeScript client library (`src/frontapp-mcp-client.ts`) that LLMs can use to interact with the MCP server. The client library provides a simple and intuitive interface for calling the tools exposed by the MCP server.

#### Client Library Features

- Type-safe methods for all available tools
- Error handling with custom error handlers
- Retry logic with exponential backoff for improved reliability
- Comprehensive TypeScript interfaces for all request and response types

#### Example Client Usage

```typescript
import { FrontappMcpClient } from './frontapp-mcp-client.js';

// Create a client instance
const client = new FrontappMcpClient('http://localhost:3000');

// Enable retries for better reliability
client.enableRetries(3, 1000);

// Set up custom error handling
client.setErrorHandler((error: Error) => {
  console.error('Error occurred:', error.message);
});

// Get a list of conversations
const conversations = await client.getConversations({ 
  status: 'open',
  limit: 10
});

// Send a message to a conversation
await client.sendMessage('cnv_123', 'Hello, how can I help you today?', {
  tags: ['support', 'priority']
});
```

A complete example of client usage is available in `src/examples/client-usage-example.ts`.

## Security Features

The Frontapp MCP integration includes several security features to protect sensitive data and prevent abuse:

### Credential Storage

The integration includes a secure credential storage system that uses AES-256 encryption to store sensitive information like API keys and passwords. This ensures that credentials are protected even if the storage file is compromised.

For detailed information, see the [Credential Storage Guide](credential-storage-guide.md).

### HTTPS Support

The integration supports HTTPS for secure communication between clients and the server. This encrypts the data transmitted between the client and server, protecting it from eavesdropping and tampering.

For detailed information, see the [HTTPS Setup Guide](https-setup-guide.md).

### Input Validation

The integration includes an input validation middleware that validates request data against schemas. This helps ensure that data meets the requirements of the API and prevents invalid data from being processed.

For detailed information, see the [Input Validation Guide](input-validation-guide.md).

### Rate Limiting

The integration includes a rate limiting middleware that limits the number of requests a client can make in a given time window. This helps protect the API from abuse and ensures fair usage of resources.

For detailed information, see the [Rate Limiting Guide](rate-limiting-guide.md).

### Webhook Validation

The integration includes a webhook validation middleware that validates webhook payloads against schemas. This helps ensure that webhook payloads meet the expected structure and prevents invalid data from being processed.

For detailed information, see the [Webhook Validation Guide](webhook-validation-guide.md).

### Security Testing

The integration includes a comprehensive security testing suite that tests all security features of the integration. This suite helps ensure that the integration is secure and that security features are working as expected.

For detailed information, see the [Security Testing Guide](security-testing-guide.md).
