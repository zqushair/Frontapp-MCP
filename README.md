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
- [💻 Development Guide](/docs/development-guide.md) - Contributing to the project

## Usage

### API Usage

The Frontapp MCP integration exposes a set of tools that can be called by LLMs through the MCP protocol. For detailed information about the available tools and their parameters, see the [API Reference](/docs/api-reference.md).

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
```

## Security Considerations

- Store API credentials securely using environment variables
- Verify webhook signatures to ensure they come from Frontapp
- Use HTTPS for all communications in production
- Implement rate limiting to prevent abuse
- Validate all incoming data to prevent injection attacks

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please see the [Development Guide](/docs/development-guide.md) for information on how to contribute to the project.

## Acknowledgements

- [Frontapp API Documentation](https://dev.frontapp.com/reference/introduction)
- [Model Context Protocol](https://github.com/modelcontextprotocol/mcp)
