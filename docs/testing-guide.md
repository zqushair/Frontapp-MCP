# Testing Guide

This guide provides information on how to test the Frontapp MCP integration.

## Testing Framework

The project uses Jest as its testing framework. Jest is a JavaScript testing framework designed to ensure correctness of any JavaScript codebase. It allows you to write tests with an approachable, familiar, and feature-rich API that gives you results quickly.

## Test Structure

Tests are organized in the following directory structure:

```
src/
└── __tests__/
    ├── setup.ts                  # Global test setup
    ├── clients/                  # Tests for API clients
    │   └── frontapp.test.ts      # Tests for Frontapp API client
    └── handlers/                 # Tests for handlers
        ├── requests/             # Tests for request handlers
        │   └── getInboxes.test.ts # Tests for GetInboxesHandler
        └── webhooks/             # Tests for webhook handlers
            └── conversationCreated.test.ts # Tests for ConversationCreatedHandler
```

## Running Tests

You can run tests using the following npm scripts:

```bash
# Run all Jest tests
npm test

# Run all tests with coverage report
npm run test:all

# Run specific test suites
npm run test:accounts
npm run test:api
npm run test:contacts
npm run test:tags
npm run test:conversations
npm run test:webhooks
npm run test:webhook-handlers
npm run test:webhook-mock
npm run test:handlers
```

## Writing Tests

### Test File Naming

Test files should be named with the `.test.ts` or `.spec.ts` extension. For example, if you're testing a file called `getInboxes.ts`, the test file should be named `getInboxes.test.ts`.

### Test Structure

Tests should follow the Arrange-Act-Assert (AAA) pattern:

1. **Arrange**: Set up the test data and conditions
2. **Act**: Perform the action being tested
3. **Assert**: Verify the result

Example:

```typescript
describe('GetInboxesHandler', () => {
  it('should return inboxes data on successful API call', async () => {
    // Arrange
    const mockInboxes = {
      _results: [
        { id: 'inb_123', name: 'Support' },
        { id: 'inb_456', name: 'Sales' },
      ],
      _links: { self: 'https://api.frontapp.com/inboxes' },
      _pagination: {},
    };

    (frontappClient.getInboxes as jest.Mock).mockResolvedValue({
      data: mockInboxes,
    });

    // Act
    const result = await getInboxesHandler.handle({});

    // Assert
    expect(frontappClient.getInboxes).toHaveBeenCalled();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('json');
    expect(JSON.parse(result.content[0].text)).toEqual(mockInboxes);
    expect(result.isError).toBeUndefined();
  });
});
```

### Mocking

Jest provides built-in mocking capabilities. You can mock modules, functions, and classes using `jest.mock()`.

Example of mocking a module:

```typescript
// Mock the Frontapp client
jest.mock('../../../clients/frontapp/index.js', () => ({
  frontappClient: {
    getInboxes: jest.fn(),
  },
}));
```

### Testing Async Code

Jest has built-in support for testing asynchronous code. You can use `async/await` in your tests:

```typescript
it('should handle API errors gracefully', async () => {
  // Mock an API error
  const errorMessage = 'API error';
  (frontappClient.getInboxes as jest.Mock).mockRejectedValue(new Error(errorMessage));

  // Call the handler
  const result = await getInboxesHandler.handle({});

  // Verify the error handling
  expect(frontappClient.getInboxes).toHaveBeenCalled();
  expect(result.content).toHaveLength(1);
  expect(result.content[0].type).toBe('text');
  expect(result.content[0].text).toContain(errorMessage);
  expect(result.isError).toBe(true);
});
```

## Test Coverage

The project is configured to generate test coverage reports. You can view the coverage report by running:

```bash
npm run test:all
```

This will generate a coverage report in the `coverage` directory. You can open `coverage/lcov-report/index.html` in a browser to view the report.

The project has a coverage threshold of 70% for branches, functions, lines, and statements. This means that at least 70% of the code must be covered by tests.

## Best Practices

1. **Test Isolation**: Each test should be independent of other tests. Tests should not rely on the state created by previous tests.

2. **Mock External Dependencies**: External dependencies like API calls should be mocked to ensure tests are reliable and fast.

3. **Test Edge Cases**: Test not only the happy path but also edge cases and error conditions.

4. **Keep Tests Simple**: Each test should test one thing. Avoid complex test scenarios that test multiple behaviors.

5. **Use Descriptive Test Names**: Test names should describe what the test is testing and what the expected outcome is.

6. **Avoid Test Duplication**: Don't repeat the same test logic in multiple tests. Use helper functions or test fixtures to share common setup code.

7. **Test Public API**: Focus on testing the public API of your modules, not implementation details.

8. **Keep Tests Fast**: Tests should run quickly to provide fast feedback during development.

## Troubleshooting

### Tests Failing with Module Not Found Errors

If you're getting module not found errors, make sure the module paths in your imports are correct. Remember that Jest uses Node.js module resolution, which is different from TypeScript's module resolution.

### Tests Failing with Type Errors

If you're getting type errors in your tests, make sure you're properly typing your mocks and test data.

### Tests Timing Out

If your tests are timing out, you might have an unresolved Promise or an infinite loop. Make sure all your async code is properly awaited.

### Tests Failing Intermittently

If your tests are failing intermittently, you might have a race condition or a test that depends on external state. Make sure your tests are isolated and don't depend on external factors.
