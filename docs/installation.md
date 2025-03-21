# Installation Guide

This guide provides step-by-step instructions for installing and setting up the Frontapp MCP integration.

## Prerequisites

Before you begin, ensure you have the following:

- Node.js (v16 or later)
- npm (v7 or later)
- A Frontapp account with API access
- A Frontapp API key

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/zqushair/Frontapp-MCP.git
cd Frontapp-MCP
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory of the project based on the provided `.env.example` file:

```bash
cp .env.example .env
```

Open the `.env` file and update the following variables:

```
# Frontapp API credentials
FRONTAPP_API_KEY=your_frontapp_api_key_here

# Webhook configuration
WEBHOOK_SECRET=your_webhook_secret_here
WEBHOOK_BASE_URL=https://your-webhook-url.com

# Server configuration
PORT=3000

# Logging and Monitoring
LOG_LEVEL=info
METRICS_INTERVAL=60000

# API Gateway configuration
API_KEY=your_api_key_here
CORS_ORIGINS=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

- `FRONTAPP_API_KEY`: Your Frontapp API key. You can obtain this from the Frontapp developer settings.
- `WEBHOOK_SECRET`: A secret string used to verify webhook signatures. Generate a random string for this.
- `WEBHOOK_BASE_URL`: The publicly accessible URL where your webhook server will be hosted.
- `PORT`: The port on which the webhook server will run.
- `LOG_LEVEL`: The logging level (e.g., debug, info, warn, error).
- `METRICS_INTERVAL`: How often to log metrics in milliseconds (default: 60000).
- `API_KEY`: API key for authenticating requests to the API Gateway. Generate a random string for this.
- `CORS_ORIGINS`: Comma-separated list of allowed origins for CORS (default: `*`).
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting in milliseconds (default: 900000 - 15 minutes).
- `RATE_LIMIT_MAX`: Maximum number of requests per window (default: 100).

### 4. Build the Project

```bash
npm run build
```

This will compile the TypeScript code into JavaScript in the `dist` directory.

### 5. Start the Server

```bash
npm start
```

This will start the MCP server and the webhook server.

## Verifying the Installation

To verify that the installation was successful, you should see the following output when starting the server:

```
Starting Frontapp MCP server...
Request handlers set up successfully
Frontapp MCP server connected to transport
Webhook handlers set up successfully
Webhook server listening on port 3000
Webhook URL: http://localhost:3000/webhooks
```

## Testing the Installation

You can run the provided test scripts to verify that the integration is working correctly:

```bash
# Test the API client
npm run test:api

# Test conversation handlers
npm run test:conversations

# Test tag handlers
npm run test:tags

# Test contact handlers
npm run test:contacts

# Test webhook functionality
npm run test:webhooks
```

## Troubleshooting

### Common Issues

#### API Key Issues

If you encounter authentication errors when connecting to the Frontapp API, verify that your API key is correct and has the necessary permissions.

#### Webhook Issues

If webhooks are not being received:

1. Ensure that your webhook URL is publicly accessible.
2. Verify that the webhook secret is correctly configured.
3. Check that you have subscribed to the relevant webhook events in Frontapp.

#### Build Issues

If you encounter build errors:

1. Ensure that you have the correct version of Node.js and npm installed.
2. Try deleting the `node_modules` directory and the `package-lock.json` file, then run `npm install` again.
3. Check for TypeScript errors in your code.

## Next Steps

Once you have successfully installed and configured the Frontapp MCP integration, you can:

1. Explore the [API Reference](api-reference.md) to learn about the available endpoints.
2. Set up [Webhook Integration](webhook-integration.md) for real-time updates.
3. Integrate the MCP server with your LLM application.

For more information, refer to the [Development Guide](development-guide.md).
