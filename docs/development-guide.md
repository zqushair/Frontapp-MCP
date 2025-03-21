# Development Guide

This guide provides information for developers who want to contribute to the Frontapp MCP integration.

## Development Environment Setup

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Git
- A code editor (e.g., Visual Studio Code)
- A Frontapp account with API access

### Setting Up the Development Environment

1. Clone the repository:

```bash
git clone https://github.com/zqushair/Frontapp-MCP.git
cd Frontapp-MCP
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file for local development:

```bash
cp .env.example .env
```

4. Update the `.env` file with your Frontapp API key and other configuration.

5. Start the development server:

```bash
npm run dev
```

This will start the server with hot reloading enabled, so changes to the code will automatically restart the server.

## Project Structure

The project follows a modular structure to make it easy to understand and extend:

```
frontapp-mcp/
├── src/
│   ├── config/              # Configuration files
│   ├── api/                 # API Gateway implementation
│   │   ├── health.ts        # Health check endpoints
│   │   ├── index.ts         # Main API Gateway setup
│   │   ├── swagger.ts       # Swagger/OpenAPI documentation
│   │   └── tools.ts         # Tools API endpoints
│   ├── models/              # Data models
│   ├── handlers/            # Request and webhook handlers
│   │   ├── requests/        # LLM request handlers
│   │   └── webhooks/        # Frontapp webhook handlers
│   ├── clients/             # API clients
│   │   └── frontapp/        # Frontapp API client
│   ├── middleware/          # Middleware components
│   │   ├── requestLogger.ts # Request logging middleware
│   │   ├── security.ts      # Security middleware
│   │   └── webhookAuth.ts   # Webhook authentication
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Logging utilities
│   │   └── monitoring.ts    # Monitoring utilities
│   └── index.ts             # Entry point
├── tests/                   # Test files
├── docs/                    # Documentation
├── .env.example             # Example environment variables
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

### Key Components

- **src/index.ts**: The entry point of the application. It sets up the MCP server and webhook server.
- **src/config/index.ts**: Configuration settings loaded from environment variables.
- **src/clients/frontapp/index.ts**: The Frontapp API client that handles communication with the Frontapp API, including rate limiting and retry logic.
- **src/models/**: Data models for the MCP server and Frontapp API.
- **src/handlers/requests/**: Request handlers for the MCP server.
- **src/handlers/webhooks/**: Webhook handlers for Frontapp webhooks.
- **src/middleware/**: Middleware components for the API Gateway and webhook server.
- **src/api/**: API Gateway implementation, including health checks, Swagger documentation, and tool endpoints.
- **src/utils/**: Utility functions, including logging and monitoring.

## Rate Limiting and Retry Logic

The Frontapp API client includes sophisticated rate limiting and retry mechanisms to handle API rate limits and transient errors gracefully.

### How Rate Limiting Works

The rate limiting system works by:

1. Monitoring rate limit headers from Frontapp API responses
2. Calculating appropriate delays based on remaining requests and time until reset
3. Automatically adding delays before requests when approaching rate limits
4. Properly handling 429 (Too Many Requests) responses with appropriate backoff

```typescript
// Example of how rate limiting is implemented
private updateRateLimitInfo(response: AxiosResponse): void {
  const remaining = response.headers['x-ratelimit-remaining'];
  const reset = response.headers['x-ratelimit-reset'];
  
  if (remaining && reset) {
    const remainingRequests = parseInt(remaining);
    const resetTime = parseInt(reset) * 1000; // Convert to milliseconds
    
    // If we're running low on requests, calculate delay to spread remaining requests
    if (remainingRequests < 10) {
      const now = Date.now();
      const timeUntilReset = Math.max(0, resetTime - now);
      this.rateLimitDelay = Math.ceil(timeUntilReset / (remainingRequests + 1));
      this.rateLimitReset = resetTime;
    }
  }
}
```

### Retry Logic Implementation

The retry system uses exponential backoff to handle transient errors:

1. Network errors and server errors (5xx) are automatically retried
2. Each retry waits longer than the previous one (exponential backoff)
3. Retry count is tracked in request headers
4. Maximum retries and initial delay are configurable

```typescript
// Example of retry logic with exponential backoff
private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
  if (!error.config) {
    return Promise.reject(error);
  }
  
  let retryCount = error.config.headers?.['x-retry-count'] ? 
    parseInt(error.config.headers['x-retry-count'] as string) : 0;
  
  if (retryCount < this.maxRetries) {
    retryCount++;
    
    // Calculate delay with exponential backoff
    const delay = this.retryDelay * Math.pow(2, retryCount - 1);
    
    // Wait before retrying
    await setTimeout(delay);
    
    // Update retry count in headers
    if (!error.config.headers) {
      error.config.headers = {} as AxiosRequestHeaders;
    }
    error.config.headers['x-retry-count'] = retryCount.toString();
    
    // Retry the request
    return this.client(error.config);
  }
  
  // Max retries reached, reject with original error
  return Promise.reject(error);
}
```

### Using Rate-Limited Requests

All API methods use a `rateLimitedRequest` wrapper to ensure rate limiting is respected:

```typescript
// Example of using the rate-limited request wrapper
async getConversations(params?: Record<string, any>): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
  return this.rateLimitedRequest(() => this.client.get('/conversations', { params }));
}
```

### Configuring Retry Settings

You can configure the retry behavior using the `configureRetries` method:

```typescript
// Configure retry settings
frontappClient.configureRetries(
  maxRetries = 3,    // Maximum number of retry attempts
  retryDelay = 1000  // Initial delay in milliseconds
);
```

When implementing new API methods, make sure to use the `rateLimitedRequest` wrapper to ensure they benefit from the rate limiting and retry logic.

## Development Workflow

### Adding a New Tool

To add a new tool to the MCP server:

1. Define the tool's arguments in `src/models/mcp.ts`:

```typescript
export interface NewToolArguments extends ToolArguments {
  param1: string;
  param2?: number;
}
```

2. Add the tool definition to `FRONTAPP_TOOL_DEFINITIONS` in `src/models/mcp.ts`:

```typescript
{
  name: 'new_tool',
  description: 'Description of the new tool',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Description of param1' },
      param2: { type: 'number', description: 'Description of param2' }
    },
    required: ['param1']
  }
}
```

3. Create a new handler file in the appropriate directory (e.g., `src/handlers/requests/custom/newTool.ts`):

```typescript
import { RequestHandler } from '../base.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { NewToolArguments, ToolResponse } from '../../../models/mcp.js';

export class NewToolHandler extends RequestHandler<NewToolArguments> {
  public async handle(args: NewToolArguments): Promise<ToolResponse> {
    try {
      // Implement the tool's functionality
      // For example, call the Frontapp API
      const response = await frontappClient.someMethod(args.param1, args.param2);
      
      // Return the response
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      // Handle errors
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
}

export const newToolHandler = new NewToolHandler();
```

4. Register the handler in `src/handlers/requests/index.ts`:

```typescript
import { newToolHandler } from './custom/newTool.js';

// ...

case 'new_tool':
  response = await newToolHandler.handle(args as NewToolArguments);
  break;
```

5. Add tests for the new tool in the `tests` directory.

### Adding a New Webhook Handler

To add a new webhook handler:

1. Create a new handler file in the appropriate directory (e.g., `src/handlers/webhooks/custom/newEvent.ts`):

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebhookHandler } from '../base.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

export class NewEventHandler extends WebhookHandler {
  public async handle(payload: any, server: Server): Promise<void> {
    try {
      // Implement the webhook handler's functionality
      console.log(`[Webhook] Received new_event: ${JSON.stringify(payload)}`);
      
      // For example, call the Frontapp API
      const someId = payload.some_id;
      const response = await frontappClient.someMethod(someId);
      
      // Process the response
      // ...
      
    } catch (error: any) {
      console.error(`[Webhook Error] Failed to process new_event webhook: ${error.message}`);
    }
  }
}

export const newEventHandler = new NewEventHandler();
```

2. Register the handler in `src/handlers/webhooks/index.ts`:

```typescript
import { newEventHandler } from './custom/newEvent.js';

// ...

case 'new_event':
  await newEventHandler.handle(data, server);
  break;
```

3. Add tests for the new webhook handler in the `tests` directory.

## Testing

The project includes several test scripts to verify the functionality of the integration:

- **test:api**: Tests the Frontapp API client.
- **test:conversations**: Tests the conversation handlers.
- **test:tags**: Tests the tag handlers.
- **test:contacts**: Tests the contact handlers.
- **test:webhooks**: Tests the webhook functionality.

To run the tests:

```bash
npm run test:api
npm run test:conversations
npm run test:tags
npm run test:contacts
npm run test:webhooks
```

### Writing Tests

When adding new functionality, it's important to add tests to verify that it works correctly. Tests should be added to the `tests` directory and follow the existing test patterns.

For example, to add a test for a new tool:

```javascript
// tests/test-new-tool.js
import dotenv from 'dotenv';
import { frontappClient } from '../src/clients/frontapp/index.js';
import { newToolHandler } from '../src/handlers/requests/custom/newTool.js';

// Load environment variables
dotenv.config();

async function testNewTool() {
  console.log('Testing New Tool Functionality');
  console.log('==============================');
  
  try {
    // Test the new tool
    const response = await newToolHandler.handle({
      param1: 'test',
      param2: 123
    });
    
    console.log('✅ New Tool test passed');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ New Tool test failed:', error.message);
  }
}

testNewTool().catch(console.error);
```

Then add a script to `package.json`:

```json
"scripts": {
  "test:new-tool": "node --experimental-modules tests/test-new-tool.js"
}
```

## Code Style and Linting

The project uses ESLint and Prettier to enforce code style and catch potential issues:

- **ESLint**: Checks for code quality issues.
- **Prettier**: Formats code according to a consistent style.

To lint the code:

```bash
npm run lint
```

To format the code:

```bash
npm run format
```

It's recommended to set up your editor to run ESLint and Prettier automatically when saving files.

## Building for Production

To build the project for production:

```bash
npm run build
```

This will compile the TypeScript code into JavaScript in the `dist` directory.

## Deployment

The project can be deployed to any environment that supports Node.js. For production deployments, consider the following:

- Use a process manager like PM2 to keep the server running.
- Set up monitoring and logging.
- Use a reverse proxy like Nginx to handle HTTPS and load balancing.
- Consider containerization with Docker for easier deployment.

## Contributing

Contributions to the project are welcome! Here's how to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and add tests.
4. Run the tests to make sure everything works.
5. Submit a pull request.

Please follow the existing code style and include tests for new functionality.

## TypeScript Type Safety

### Common Type Issues and Solutions

When working with webhook payloads and API responses, you may encounter TypeScript type errors related to potentially undefined values. Here are some common issues and their solutions:

#### Handling Potentially Undefined Values

TypeScript's strict type checking will flag errors when you try to use a value that might be undefined. This is particularly common when working with webhook payloads or API responses where certain fields might be optional.

For example, in webhook handlers like `messageCreated.ts` and `messageReceived.ts`, we encountered errors like:

```
error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
```

This occurred because TypeScript couldn't guarantee that `payload.payload.id` and `payload.payload.conversation_id` were strings, even though we validated their existence in the `validatePayload` method.

**Solution**: Use type assertions when you've already validated the existence of a value:

```typescript
// Before (causes TypeScript error)
const messageId = payload.payload.id;
const conversationId = payload.payload.conversation_id;

// After (fixed with type assertion)
const messageId = payload.payload.id as string;
const conversationId = payload.payload.conversation_id as string;
```

#### Handling Optional Properties

When accessing nested properties that might be undefined, use optional chaining (`?.`) to safely access them:

```typescript
// Before (might cause runtime error if author is undefined)
console.log(`Author: ${message.author.first_name} ${message.author.last_name}`);

// After (safely handles undefined author)
console.log(`Author: ${message.author?.first_name || ''} ${message.author?.last_name || ''}`);
```

### Docker Build and TypeScript

When building the Docker image, the TypeScript compiler runs during the build process (`npm run build`). Any TypeScript errors will cause the build to fail, as we experienced with:

```
ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
```

Always ensure your code passes TypeScript type checking before building the Docker image:

```bash
# Check for TypeScript errors without compiling
npm run typecheck

# Or compile TypeScript to check for errors
npm run build
```

## Resources

- [Frontapp API Documentation](https://dev.frontapp.com/reference/overview)
- [MCP Protocol Documentation](https://modelcontextprotocol.github.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
