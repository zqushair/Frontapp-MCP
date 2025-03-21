#!/usr/bin/env node
/**
 * Run integration tests
 * This script runs the integration tests for the Frontapp MCP integration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create .env.test file if it doesn't exist
const envTestPath = path.resolve(process.cwd(), '.env.test');
if (!fs.existsSync(envTestPath)) {
  console.log('Creating .env.test file...');
  const envExample = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf-8');
  fs.writeFileSync(envTestPath, envExample);
  console.log('.env.test file created');
}

// Set environment variables for testing
process.env.NODE_ENV = 'test';

// Run the tests
console.log('Running integration tests...');
const testProcess = spawn('npx', ['mocha', '--require', 'ts-node/register', 'tests/integration/**/*.test.ts'], {
  stdio: 'inherit',
  shell: true,
});

testProcess.on('close', (code) => {
  console.log(`Integration tests completed with exit code ${code}`);
  process.exit(code);
});
