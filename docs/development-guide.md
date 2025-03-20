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
├── docs/                    # Documentation
├── .env.example             # Example environment variables
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

### Key Components

- **src/index.ts**: The entry point of the application. It sets up the MCP server and webhook server.
- **src/config/index.ts**: Configuration settings loaded from environment variables.
- **src/clients/frontapp/index.ts**: The Frontapp API client that handles communication with the Frontapp API.
- **src/models/**: Data models for the MCP server and Frontapp API.
- **src/handlers/requests/**: Request handlers for the MCP server.
- **src/handlers/webhooks/**: Webhook handlers for Frontapp webhooks.
- **src/middleware/**: Middleware components, such as webhook authentication.

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

## Resources

- [Frontapp API Documentation](https://dev.frontapp.com/reference/overview)
- [MCP Protocol Documentation](https://modelcontextprotocol.github.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
