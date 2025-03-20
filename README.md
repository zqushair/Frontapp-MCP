# Frontapp MCP Server

A Model Context Protocol (MCP) server for integrating Large Language Models (LLMs) with Frontapp's customer communication platform.

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

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/frontapp-mcp.git
   cd frontapp-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your Frontapp API credentials and other settings:
   ```
   FRONTAPP_API_KEY=your_frontapp_api_key_here
   WEBHOOK_SECRET=your_webhook_secret_here
   WEBHOOK_BASE_URL=https://your-webhook-url.com
   PORT=3000
   LOG_LEVEL=info
   ```

5. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Starting the Server

```bash
npm start
```

This will start the MCP server, which will listen for requests from LLMs and webhooks from Frontapp.

### Client-Side Integration

The project includes a TypeScript client library (`frontapp-mcp-client.ts`) that can be used to interact with the MCP server from LLM applications.

```typescript
import { FrontappMcpClient } from './frontapp-mcp-client';

// Create a client instance
const client = new FrontappMcpClient('http://localhost:3000');

// Get a list of conversations
const conversations = await client.getConversations({ status: 'open' });

// Get details of a specific conversation
const conversation = await client.getConversation('cnv_123456');

// Send a message to a conversation
await client.sendMessage('cnv_123456', 'Hello, how can I help you today?');
```

### Webhook Integration

To receive webhooks from Frontapp:

1. Set up a publicly accessible URL for your webhook endpoint (e.g., using ngrok for development)
2. Configure the `WEBHOOK_BASE_URL` in your `.env` file
3. Subscribe to webhook events in Frontapp's settings, pointing to your webhook URL
4. Set a webhook secret in Frontapp and configure the same secret in your `.env` file

## Development

### Project Structure

```
frontapp-mcp/
├── src/
│   ├── config/              # Configuration files
│   ├── models/              # Data models
│   ├── handlers/            # Request and webhook handlers
│   │   ├── requests/        # LLM request handlers
│   │   └── webhooks/        # Frontapp webhook handlers
│   ├── clients/             # API clients
│   │   └── frontapp/        # Frontapp API client
│   ├── middleware/          # Middleware components
│   ├── utils/               # Utility functions
│   └── index.ts             # Entry point
├── tests/                   # Test files
├── .env.example             # Example environment variables
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

### Running in Development Mode

```bash
npm run dev
```

This will start the server in development mode with hot reloading.

### Testing

```bash
npm test
```

This will run the test suite.

## Security Considerations

- Store API credentials securely using environment variables
- Verify webhook signatures to ensure they come from Frontapp
- Use HTTPS for all communications in production
- Implement rate limiting to prevent abuse
- Validate all incoming data to prevent injection attacks

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [Frontapp API Documentation](https://dev.frontapp.com/reference/introduction)
- [Model Context Protocol](https://github.com/modelcontextprotocol/mcp)
