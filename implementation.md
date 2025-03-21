# Frontapp MCP Implementation Framework

This document outlines the step-by-step implementation plan for the Frontapp MCP integration, with checkboxes to track progress.

## Project Setup

- [x] Initialize project repository
- [x] Set up TypeScript configuration
- [x] Configure linting and formatting tools
- [x] Set up testing framework
- [x] Create basic project structure
- [x] Set up environment configuration

## Core Infrastructure

- [x] Create MCP server base structure
- [x] Implement API Gateway
- [x] Set up authentication and authorization system
- [x] Implement logging and monitoring
- [x] Create error handling middleware
- [x] Set up webhook receiver endpoint

## Frontapp API Client

- [x] Create Frontapp API client class
- [x] Implement authentication methods
- [x] Create base request/response handling
- [x] Implement rate limiting and retry logic
- [x] Add comprehensive error handling
- [x] Create TypeScript interfaces for Frontapp data models

## Data Models

- [x] Define MCP request/response models
- [x] Create Frontapp data models (conversations, messages, contacts, accounts, etc.)
- [x] Implement data validation
- [x] Create webhook payload models
- [x] Implement data transformation utilities

## Request Handlers

- [x] Implement base request handler interface
- [x] Create conversation handlers:
  - [x] GetConversationsHandler
  - [x] GetConversationDetailsHandler
  - [x] SendMessageHandler
  - [x] AddCommentHandler
  - [x] ArchiveConversationHandler
  - [x] AssignConversationHandler
- [x] Create contact handlers:
  - [x] GetContactHandler
  - [x] UpdateContactHandler
  - [x] CreateContactHandler
- [x] Create tag handlers:
  - [x] GetTagsHandler
  - [x] ApplyTagHandler
  - [x] RemoveTagHandler
- [x] Create inbox handlers:
  - [x] GetInboxesHandler
  - [x] GetInboxHandler
- [x] Create user handlers:
  - [x] GetTeammatesHandler
  - [x] GetTeammateHandler
- [x] Create account handlers:
  - [x] GetAccountsHandler
  - [x] GetAccountHandler
  - [x] CreateAccountHandler
  - [x] UpdateAccountHandler

## Webhook Handlers

- [x] Implement base webhook handler interface
- [x] Create webhook authentication middleware
- [x] Implement conversation webhook handlers:
  - [x] ConversationCreatedHandler
  - [x] ConversationUpdatedHandler
- [x] ConversationTaggedHandler
- [x] ConversationUntaggedHandler
- [x] ConversationAssignedHandler
- [x] ConversationUnassignedHandler
- [x] Implement message webhook handlers:
- [x] MessageCreatedHandler
  - [x] MessageReceivedHandler
- [x] Implement contact webhook handlers:
  - [x] ContactCreatedHandler
  - [x] ContactUpdatedHandler
- [x] Set up webhook subscription management

## Security Implementation

- [x] Implement secure credential storage
- [x] Set up HTTPS for all communications
- [x] Create input validation middleware
- [x] Implement rate limiting
- [x] Add webhook payload validation
- [x] Create security testing suite

## Client-Side Integration

- [x] Create MCP client library
- [x] Implement client authentication
- [x] Create request formatting utilities
- [x] Implement response parsing
- [x] Add error handling and retries
- [x] Create TypeScript interfaces for client usage

The client-side integration includes a TypeScript client library (`src/frontapp-mcp-client.ts`) that LLMs can use to interact with the MCP server. The client library provides a simple and intuitive interface for calling the tools exposed by the MCP server.

### Client Library Features

- Type-safe methods for all available tools
- Error handling with custom error handlers
- Retry logic with exponential backoff for improved reliability
- Comprehensive TypeScript interfaces for all request and response types

### Example Client Usage

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

## Testing

- [x] Create unit tests for all components
- [x] Implement integration tests
- [x] Create webhook testing utilities
- [ ] Set up end-to-end testing
- [x] Implement security testing
- [ ] Create performance benchmarks

## Documentation

- [x] Create API documentation
- [x] Write setup and installation guide
- [x] Create usage examples
- [x] Document webhook integration
- [x] Create troubleshooting guide

## Deployment

- [ ] Set up CI/CD pipeline
- [ ] Create Docker configuration
- [ ] Implement database setup (if needed)
- [ ] Configure production environment
- [ ] Set up monitoring and alerting
- [ ] Create deployment documentation

## Implementation Details

### Server-Side Implementation

#### 1. Project Structure

```
frontapp-mcp/
├── src/
│   ├── config/              # Configuration files
│   ├── api/                 # API Gateway implementation
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

#### 2. Core Components Implementation

##### MCP Server Base

```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { setupRequestHandlers } from './handlers/requests';
import { setupWebhookHandlers } from './handlers/webhooks';
import { config } from './config';

async function main() {
  const server = new Server(
    {
      name: 'frontapp-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // Set up request handlers
  setupRequestHandlers(server);
  
  // Set up webhook handlers
  setupWebhookHandlers(server);
  
  // Error handling
  server.onerror = (error) => console.error('[MCP Error]', error);
  
  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log('Frontapp MCP server running');
}

main().catch(console.error);
```

##### Configuration

```typescript
// src/config/index.ts
export const config = {
  frontapp: {
    apiKey: process.env.FRONTAPP_API_KEY,
    baseUrl: 'https://api2.frontapp.com',
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
    baseUrl: process.env.WEBHOOK_BASE_URL,
  },
  server: {
    port: process.env.PORT || 3000,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
```

##### Frontapp API Client

```typescript
// src/clients/frontapp/index.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../../config';

export class FrontappClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: config.frontapp.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.frontapp.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use((config) => {
      console.log(`[Frontapp API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[Frontapp API Error] ${error.message}`);
        return Promise.reject(error);
      }
    );
  }
  
  // Conversation methods
  async getConversations(params?: any) {
    return this.client.get('/conversations', { params });
  }
  
  async getConversation(conversationId: string) {
    return this.client.get(`/conversations/${conversationId}`);
  }
  
  async sendMessage(conversationId: string, data: any) {
    return this.client.post(`/conversations/${conversationId}/messages`, data);
  }
  
  // Contact methods
  async getContacts(params?: any) {
    return this.client.get('/contacts', { params });
  }
  
  async getContact(contactId: string) {
    return this.client.get(`/contacts/${contactId}`);
  }
  
  async createContact(data: any) {
    return this.client.post('/contacts', data);
  }
  
  // Tag methods
  async getTags() {
    return this.client.get('/tags');
  }
  
  async applyTag(conversationId: string, tagId: string) {
    return this.client.post(`/conversations/${conversationId}/tags`, { tag_id: tagId });
  }
  
  // Webhook methods
  async subscribeWebhook(events: string[], url: string) {
    return this.client.post('/webhooks', {
      url,
      events,
    });
  }
  
  async unsubscribeWebhook(webhookId: string) {
    return this.client.delete(`/webhooks/${webhookId}`);
  }
  
  // Add more methods as needed...
}

export const frontappClient = new FrontappClient();
```

##### Request Handlers Setup

```typescript
// src/handlers/requests/index.ts
import { Server } from '@modelcontextprotocol/sdk/server';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types';
import { getConversationsHandler } from './conversations/getConversations';
import { sendMessageHandler } from './conversations/sendMessage';
import { getContactsHandler } from './contacts/getContacts';
// Import other handlers...

export function setupRequestHandlers(server: Server) {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    // Route to appropriate handler based on tool name
    switch (name) {
      case 'get_conversations':
        return getConversationsHandler(args);
      case 'send_message':
        return sendMessageHandler(args);
      case 'get_contacts':
        return getContactsHandler(args);
      // Add more cases for other tools...
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
```

##### Example Request Handler

```typescript
// src/handlers/requests/conversations/getConversations.ts
import { frontappClient } from '../../../clients/frontapp';

export async function getConversationsHandler(args: any) {
  try {
    const response = await frontappClient.getConversations(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching conversations: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
```

##### Webhook Handler

```typescript
// src/handlers/webhooks/index.ts
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server';
import { verifyWebhookSignature } from '../../middleware/webhookAuth';
import { conversationCreatedHandler } from './conversations/conversationCreated';
import { messageReceivedHandler } from './messages/messageReceived';
// Import other webhook handlers...

export function setupWebhookHandlers(server: Server) {
  const app = express();
  
  // Parse JSON bodies
  app.use(express.json());
  
  // Verify webhook signatures
  app.use('/webhooks', verifyWebhookSignature);
  
  // Webhook routes
  app.post('/webhooks', (req, res) => {
    const { type, data } = req.body;
    
    // Route to appropriate handler based on webhook type
    switch (type) {
      case 'conversation.created':
        conversationCreatedHandler(data, server);
        break;
      case 'message.received':
        messageReceivedHandler(data, server);
        break;
      // Add more cases for other webhook types...
    }
    
    // Acknowledge receipt of webhook
    res.status(200).send('OK');
  });
  
  // Start the server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Webhook server listening on port ${port}`);
  });
}
```


## Next Steps

After completing the implementation according to this framework, we should:

1. Conduct thorough testing with real Frontapp data
2. Gather feedback from users
3. Optimize performance based on usage patterns
4. Consider implementing the future enhancements outlined in the plan
5. Maintain and update the integration as Frontapp's API evolves
