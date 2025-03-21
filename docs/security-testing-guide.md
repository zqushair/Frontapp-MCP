# Security Testing Guide

This guide provides information on how to use the security testing suite in the Frontapp MCP integration.

## Overview

The Frontapp MCP integration includes a comprehensive security testing suite that tests all security features of the integration. This suite helps ensure that the integration is secure and that security features are working as expected.

## Test Suite Structure

The security testing suite is organized into several test files, each focusing on a specific security feature:

- `tests/security/credentialManager.test.ts`: Tests for the credential manager
- `tests/security/https.test.ts`: Tests for HTTPS support
- `tests/security/validation.test.ts`: Tests for input validation
- `tests/security/rateLimiting.test.ts`: Tests for rate limiting
- `tests/security/webhookValidation.test.ts`: Tests for webhook payload validation

## Running the Tests

To run the security tests, use the following command:

```bash
npm test -- --testPathPattern=tests/security
```

This will run all tests in the `tests/security` directory.

To run a specific test file, use the following command:

```bash
npm test -- --testPathPattern=tests/security/credentialManager.test.ts
```

## Test Coverage

The security testing suite covers the following security features:

### Credential Manager Tests

The credential manager tests verify that the credential manager can securely store, retrieve, and manage credentials. The tests cover:

- Storing and retrieving credentials
- Checking if a credential exists
- Deleting credentials
- Listing credential keys
- Encrypting and decrypting credentials
- Handling special characters, empty values, null values, and undefined values
- Overwriting existing credentials

### HTTPS Tests

The HTTPS tests verify that the HTTPS support works correctly. The tests cover:

- Creating an HTTPS server when HTTPS is enabled
- Throwing an error when HTTPS is enabled but certificates are not provided
- Creating an HTTP server when HTTPS is disabled
- Generating a self-signed certificate
- Creating an HTTP to HTTPS redirect server

### Input Validation Tests

The input validation tests verify that the input validation middleware works correctly. The tests cover:

- Validating data against a schema
- Validating request body against a schema
- Validating request query parameters against a schema
- Validating request URL parameters against a schema
- Validating multiple data sources against multiple schemas
- Handling validation errors

### Rate Limiting Tests

The rate limiting tests verify that the rate limiting middleware works correctly. The tests cover:

- Creating a rate limiter middleware with default options
- Creating a rate limiter middleware with custom options
- Logging rate limit exceeded events
- Creating rate limiters for API endpoints, authentication endpoints, and webhook endpoints
- Creating rate limiters for specific IP addresses

### Webhook Validation Tests

The webhook validation tests verify that the webhook validation middleware works correctly. The tests cover:

- Validating webhook payloads against a schema
- Handling validation errors
- Skipping validation if no schema is found for the event type
- Handling errors during validation
- Validating conversation webhook payloads
- Validating message webhook payloads
- Validating contact webhook payloads

## Adding New Tests

To add a new test to the security testing suite, follow these steps:

1. Create a new test file in the `tests/security` directory
2. Import the necessary modules and mock any dependencies
3. Create test cases for the security feature you want to test
4. Run the tests to make sure they pass

## Best Practices

When writing security tests, follow these best practices:

1. **Test Edge Cases**: Test edge cases such as empty values, null values, and invalid values to ensure that the security features handle them correctly.
2. **Mock Dependencies**: Mock dependencies to isolate the security feature being tested and to make tests more reliable.
3. **Test Error Handling**: Test error handling to ensure that the security features handle errors gracefully.
4. **Test Security Boundaries**: Test security boundaries to ensure that the security features prevent unauthorized access.
5. **Keep Tests Independent**: Keep tests independent of each other to make them more reliable and easier to maintain.
6. **Use Descriptive Test Names**: Use descriptive test names to make it clear what each test is testing.
7. **Test Both Success and Failure Cases**: Test both success and failure cases to ensure that the security features work correctly in all scenarios.
8. **Test with Real-World Data**: Test with real-world data to ensure that the security features work correctly with actual data.
9. **Test Performance**: Test performance to ensure that the security features do not impact performance significantly.
10. **Keep Tests Up to Date**: Keep tests up to date as the security features evolve to ensure that they continue to work correctly.
