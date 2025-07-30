[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/zqushair-frontapp-mcp-badge.png)](https://mseep.ai/app/zqushair-frontapp-mcp)

# Frontapp MCP Server

[![smithery badge](https://smithery.ai/badge/@zqushair/frontapp-mcp)](https://smithery.ai/server/@zqushair/frontapp-mcp)

A Model Context Protocol (MCP) server for integrating Large Language Models (LLMs) with Frontapp's customer communication platform.

**[📚 View Full Documentation in /docs](/docs/README.md)**

## Overview

This project implements an MCP server that acts as a bridge between LLMs and Frontapp's API. It enables LLMs to access and manipulate Frontapp data (conversations, contacts, tags, etc.) and automate Frontapp workflows using natural language commands.

The server supports real-time updates and event-driven automation using webhooks from Frontapp.

## Features

- **Conversation Management**: Retrieve, create, update, and manage conversations
- **Contact Management**: Access and update contact information
- **Tag Management**: Apply and remove tags from conversations
- **Inbox Management**: Access inbox information
- **User Management**: Retrieve user details
- **Webhook Integration**: Receive and process real-time events from Frontapp
- **Secure Authentication**: Verify webhook signatures and handle API authentication
- **Secure Credential Storage**: Store sensitive information with AES-256 encryption
- **HTTPS Support**: Secure communications with TLS/SSL encryption

## Architecture

The MCP server follows a modular architecture:

1. **API Gateway**: Handles incoming requests from LLMs and webhooks from Frontapp
2. **Request Handlers**: Process requests from LLMs and interact with the Frontapp API
3. **Webhook Handlers**: Process webhooks from Frontapp and update LLM context
4. **Frontapp API Client**: Encapsulates the logic for interacting with the Frontapp API
5. **Data Models**: Define the structure of data exchanged between LLMs, the MCP server, and Frontapp
6. **Configuration**: Stores settings for the MCP server

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Frontapp API credentials
- A publicly accessible URL for webhooks (for production use)

## Installation

### Installing via Smithery

To install frontapp-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@zqushair/frontapp-mcp):

```bash
npx -y @smithery/cli install @zqushair/frontapp-mcp --client claude
```

For detailed installation instructions, see the [Installation Guide](/docs/installation.md).

Quick start:

1. Clone the repository:
   ```bash
   git clone https://github.com/zqushair/Frontapp-MCP.git
   cd Frontapp-MCP
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create and configure the `.env` file:
   ```bash
   cp .env.example .env
   # Edit the .env file with your Frontapp API credentials
   ```

4. Build and start the project:
   ```bash
   npm run build
   npm start
   ```

## Documentation

Comprehensive documentation is available in the [/docs](/docs) directory:

- [📖 Main Documentation](/docs/README.md) - Overview and introduction
- [🔧 Installation Guide](/docs/installation.md) - Detailed setup instructions
- [📚 API Reference](/docs/api-reference.md) - Available tools and endpoints
- [🔔 Webhook Integration](/docs/webhook-integration.md) - Real-time event processing
- [🔒 Credential Storage Guide](/docs/credential-storage-guide.md) - Secure credential management
- [🔐 HTTPS Setup Guide](/docs/https-setup-guide.md) - Secure communications setup
- [💻 Development Guide](/docs/development-guide.md) - Contributing to the project

## Usage

### API Usage

The Frontapp MCP integration exposes a set of tools that can be called by LLMs through the MCP protocol. For detailed information about the available tools and their parameters, see the [API Reference](/docs/api-reference.md).

### Client Library

The project includes a TypeScript client library (`src/frontapp-mcp-client.ts`) that LLMs can use to interact with the MCP server:

```typescript
import { FrontappMcpClient } from './frontapp-mcp-client.js';

// Create a client instance
const client = new FrontappMcpClient('http://localhost:3000');

// Get a list of conversations
const conversations = await client.getConversations({ status: 'open' });

// Send a message to a conversation
await client.sendMessage('cnv_123', 'Hello, how can I help you today?');
```

The client library provides:
- Type-safe methods for all available tools
- Error handling with custom error handlers
- Retry logic with exponential backoff
- Comprehensive TypeScript interfaces

A complete example of client usage is available in `src/examples/client-usage-example.ts`.

### Webhook Integration

The integration supports receiving and processing webhooks from Frontapp for real-time event notifications. For detailed information about webhook integration, see the [Webhook Integration Guide](/docs/webhook-integration.md).

## Development

For detailed development information, see the [Development Guide](/docs/development-guide.md).

### Quick Development Commands

```bash
# Start development server with hot reloading
npm run dev

# Run tests
npm run test:api
npm run test:conversations
npm run test:tags
npm run test:contacts
npm run test:webhooks

# Lint and format code
npm run lint
npm run format

# Build for production
npm run build

# Check TypeScript types without compiling
npm run typecheck
```

## Docker Deployment

The project includes a Dockerfile for containerized deployment. This multi-stage build process creates an optimized production image.

### Building the Docker Image

```bash
# Build the Docker image
docker build -t frontapp-mcp .

# Run the Docker container
docker run -p 3000:3000 --env-file .env frontapp-mcp
```

### Docker Build Troubleshooting

If you encounter TypeScript errors during the Docker build process, they need to be fixed before the build can succeed. Common issues include:

1. Type errors in webhook handlers (see the [TypeScript Type Safety](/docs/development-guide.md#typescript-type-safety) section in the Development Guide)
2. Missing type assertions for potentially undefined values
3. Improper handling of optional properties

Always run `npm run typecheck` or `npm run build` locally before building the Docker image to catch and fix these issues early.

## Security Considerations

- Store API credentials securely using the credential manager with AES-256 encryption
- Generate strong encryption keys using the provided script: `npm run generate-key`
- Enable HTTPS for all communications using the built-in HTTPS support
- Generate self-signed certificates for development: `npm run generate-cert`
- Use certificates from trusted certificate authorities for production
- Verify webhook signatures to ensure they come from Frontapp
- Implement rate limiting to prevent abuse
- Validate all incoming data to prevent injection attacks

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please see the [Development Guide](/docs/development-guide.md) for information on how to contribute to the project.

## Acknowledgements

- [Frontapp API Documentation](https://dev.frontapp.com/reference/introduction)
- [Model Context Protocol](https://github.com/modelcontextprotocol/mcp)
