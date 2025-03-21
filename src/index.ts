#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { setupRequestHandlers } from './handlers/requests/index.js';
import { config, validateConfig } from './config/index.js';
import logger from './utils/logger.js';
import { startApiServer } from './api/index.js';
import { configReloader } from './utils/configReloader.js';

/**
 * Main entry point for the Frontapp MCP server
 */
async function main() {
  try {
    // Validate the configuration
    validateConfig();

    logger.info('Starting Frontapp MCP server...');

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
      logger.error('[MCP Error]', error);
    };

    // Connect to the transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('Frontapp MCP server connected to transport');

    // Start the API server if webhook configuration is provided
    let apiServer: any;
    if (config.webhook.baseUrl && config.webhook.secret) {
      apiServer = startApiServer(server);
      logger.info(`API server started on port ${config.server.port}`);
    } else {
      logger.warn('Webhook configuration not provided. API server not started.');
    }

    // Start the configuration reloader
    configReloader.startWatching();
    logger.info('Configuration reloader started');

    // Set up configuration reload callback
    configReloader.options.onReload = (newConfig) => {
      logger.info('Configuration reloaded', {
        port: newConfig.server.port,
        logLevel: newConfig.logging.level,
      });

      // Restart API server if webhook configuration changed
      if (apiServer && (newConfig.webhook.baseUrl !== config.webhook.baseUrl || 
                        newConfig.webhook.secret !== config.webhook.secret ||
                        newConfig.server.port !== config.server.port)) {
        logger.info('Webhook configuration changed, restarting API server');
        apiServer.close(() => {
          apiServer = startApiServer(server);
          logger.info(`API server restarted on port ${newConfig.server.port}`);
        });
      }
    };
      
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down');
      
      // Stop the configuration reloader
      configReloader.stopWatching();
      logger.info('Configuration reloader stopped');
      
      // Close the API server if it's running
      if (apiServer) {
        apiServer.close(() => {
          logger.info('API server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  } catch (error: any) {
    logger.error('Failed to start Frontapp MCP server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  logger.error('Unhandled error in main function', { error });
  process.exit(1);
});
