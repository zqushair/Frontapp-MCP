/**
 * Integration test setup
 * This file contains setup code for integration tests
 */

import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { config, validateConfig } from '../../src/config/index.js';
import { setupRequestHandlers } from '../../src/handlers/requests/index.js';
import { startApiServer } from '../../src/api/index.js';
import logger from '../../src/utils/logger.js';

// Load environment variables from .env.test file
dotenv.config({ path: '.env.test' });

// Disable logging during tests
logger.level = 'error';

/**
 * Create a test MCP server
 * @returns A test MCP server instance
 */
export function createTestServer(): Server {
  // Create the MCP server
  const server = new Server(
    {
      name: 'frontapp-mcp-server-test',
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

  return server;
}

/**
 * Start a test API server
 * @param server The MCP server instance
 * @returns The HTTP server instance
 */
export function startTestApiServer(server: Server): any {
  // Validate the configuration
  validateConfig();

  // Start the API server
  const apiServer = startApiServer(server);

  return apiServer;
}

/**
 * Create a test client for the API server
 * @returns A supertest instance for the API server
 */
export function createTestClient() {
  const server = createTestServer();
  const apiServer = startTestApiServer(server);
  
  // Create a supertest client
  const request = require('supertest');
  const app = apiServer._events.request;
  
  return {
    request: request(app),
    server: apiServer,
    close: () => {
      apiServer.close();
    },
  };
}

/**
 * Mock Frontapp API responses
 * This function sets up nock to intercept HTTP requests to the Frontapp API
 */
export function mockFrontappApi() {
  const nock = require('nock');
  
  // Disable real HTTP requests
  nock.disableNetConnect();
  // Allow localhost connections for the API server
  nock.enableNetConnect('127.0.0.1');
  
  // Mock the Frontapp API
  const frontappApi = nock('https://api2.frontapp.com');
  
  return {
    frontappApi,
    cleanAll: nock.cleanAll,
  };
}

/**
 * Clean up after tests
 */
export function cleanup() {
  // Clean up nock
  const nock = require('nock');
  nock.cleanAll();
  nock.enableNetConnect();
}
