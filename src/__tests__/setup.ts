/**
 * @jest-environment node
 * @jest-environment-options {"skipTests": true}
 */
// This file contains setup code that will be run before each test

// Set up environment variables for testing
process.env.FRONTAPP_API_KEY = 'test_api_key';
process.env.WEBHOOK_SECRET = 'test_webhook_secret';
process.env.WEBHOOK_BASE_URL = 'http://localhost:3000';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Clean up after all tests
afterAll(() => {
  jest.clearAllMocks();
});
