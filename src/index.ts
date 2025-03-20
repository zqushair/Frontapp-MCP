#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { setupRequestHandlers } from './handlers/requests/index.js';
import { setupWebhookHandlers } from './handlers/webhooks/index.js';
import { config, validateConfig } from './config/index.js';

/**
 * Main entry point for the Frontapp MCP server
 */
async function main() {
  try {
    // Validate the configuration
    validateConfig();
    
    console.log('Starting Frontapp MCP server...');
    
    // Create the MCP server
    const server = new Server(
      {
        name: 'frontapp-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    // Set up request handlers
    setupRequestHandlers(server);
    
    // Set up error handling
    server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
    
    // Connect to the transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log('Frontapp MCP server connected to transport');
    
    // Set up webhook server if webhook configuration is provided
    if (config.webhook.baseUrl && config.webhook.secret) {
      setupWebhookHandlers(server);
    }
  } catch (error: any) {
    console.error('Failed to start Frontapp MCP server:', error.message);
    process.exit(1);
  }
}


// Start the server
main().catch(console.error);
