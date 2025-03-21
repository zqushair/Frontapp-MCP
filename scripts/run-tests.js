#!/usr/bin/env node

/**
 * Test runner script for the Frontapp MCP integration
 * This script runs all tests and generates a coverage report
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to run a command and log output
function runCommand(command, options = {}) {
  console.log(`${colors.bright}${colors.blue}Running:${colors.reset} ${command}`);
  try {
    const output = execSync(command, {
      stdio: 'inherit',
      ...options,
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error };
  }
}

// Create the tests directory if it doesn't exist
const testsDir = path.join(__dirname, '..', 'tests');
if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true });
}

// Main function to run tests
async function runTests() {
  console.log(`\n${colors.bright}${colors.magenta}=== Frontapp MCP Test Runner ===${colors.reset}\n`);
  
  // Run Jest tests
  console.log(`\n${colors.bright}${colors.cyan}Running Jest tests...${colors.reset}\n`);
  const jestResult = runCommand('npx jest --coverage');
  
  if (!jestResult.success) {
    console.log(`\n${colors.bright}${colors.red}Jest tests failed!${colors.reset}\n`);
    process.exit(1);
  }
  
  console.log(`\n${colors.bright}${colors.green}All tests passed!${colors.reset}\n`);
  
  // Open coverage report
  console.log(`\n${colors.bright}${colors.cyan}Coverage report generated at:${colors.reset} coverage/lcov-report/index.html\n`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.bright}${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
});
