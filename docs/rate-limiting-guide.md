# Rate Limiting Guide

This guide provides information on how to use the rate limiting middleware in the Frontapp MCP integration.

## Overview

The Frontapp MCP integration includes a rate limiting middleware that limits the number of requests a client can make in a given time window. This middleware helps protect the API from abuse and ensures fair usage of resources.

## How It Works

The rate limiting middleware uses the `express-rate-limit` package to limit the number of requests a client can make in a given time window. It identifies clients by their IP address by default, but can be configured to use other identifiers.

### Key Features

- **Configurable Limits**: Set different rate limits for different endpoints.
- **IP-Based Limiting**: Identify clients by their IP address.
- **Custom Identifiers**: Use custom identifiers for rate limiting.
- **Response Headers**: Include rate limit information in response headers.
- **Customizable Messages**: Provide custom messages when rate limits are exceeded.
- **Logging**: Log rate limit exceeded events.

## Configuration

Rate limiting is configured in the `.env` file with the following environment variables:

- `RATE_LIMITING_ENABLED`: Set to `true` to enable rate limiting. Defaults to `true`.
- `RATE_LIMIT_WINDOW_MS`: The time window in milliseconds for the default rate limiter. Defaults to `900000` (15 minutes).
- `RATE_LIMIT_MAX`: The maximum number of requests allowed in the time window for the default rate limiter. Defaults to `100`.
- `API_RATE_LIMIT_WINDOW_MS`: The time window in milliseconds for the API rate limiter. Defaults to `60000` (1 minute).
- `API_RATE_LIMIT_MAX`: The maximum number of requests allowed in the time window for the API rate limiter. Defaults to `100`.
- `AUTH_RATE_LIMIT_WINDOW_MS`: The time window in milliseconds for the authentication rate limiter. Defaults to `900000` (15 minutes).
- `AUTH_RATE_LIMIT_MAX`: The maximum number of requests allowed in the time window for the authentication rate limiter. Defaults to `5`.
- `WEBHOOK_RATE_LIMIT_WINDOW_MS`: The time window in milliseconds for the webhook rate limiter. Defaults to `60000` (1 minute).
- `WEBHOOK_RATE_LIMIT_MAX`: The maximum number of requests allowed in the time window for the webhook rate limiter. Defaults to `200`.

Example configuration in `.env` file:

```
RATE_LIMITING_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
WEBHOOK_RATE_LIMIT_WINDOW_MS=60000
WEBHOOK_RATE_LIMIT_MAX=200
```

## Using the Rate Limiting Middleware

The rate limiting middleware provides several methods for creating rate limiters:

### `createRateLimiter`

Creates a rate limiter middleware with the specified options.

```typescript
RateLimitingMiddleware.createRateLimiter(options);
```

Parameters:
- `options`: An object containing rate limiting options.
  - `windowMs`: The time window in milliseconds.
  - `max`: The maximum number of requests allowed in the time window.
  - `message`: The message to send when the rate limit is exceeded.
  - `statusCode`: The HTTP status code to send when the rate limit is exceeded.
  - `keyGenerator`: A function that generates a key for identifying clients.
  - `skip`: A function that determines whether to skip rate limiting for a request.

Example:

```typescript
import RateLimitingMiddleware from '../middleware/rateLimiting.js';

// Create a rate limiter middleware
const rateLimiter = RateLimitingMiddleware.createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.',
  statusCode: 429, // Too Many Requests
});

// Use the rate limiter middleware in a route
app.use('/api', rateLimiter);
```

### `createApiRateLimiter`

Creates a rate limiter middleware for API endpoints.

```typescript
RateLimitingMiddleware.createApiRateLimiter();
```

Example:

```typescript
import RateLimitingMiddleware from '../middleware/rateLimiting.js';

// Create a rate limiter middleware for API endpoints
const apiRateLimiter = RateLimitingMiddleware.createApiRateLimiter();

// Use the rate limiter middleware in a route
app.use('/api', apiRateLimiter);
```

### `createAuthRateLimiter`

Creates a rate limiter middleware for authentication endpoints.

```typescript
RateLimitingMiddleware.createAuthRateLimiter();
```

Example:

```typescript
import RateLimitingMiddleware from '../middleware/rateLimiting.js';

// Create a rate limiter middleware for authentication endpoints
const authRateLimiter = RateLimitingMiddleware.createAuthRateLimiter();

// Use the rate limiter middleware in a route
app.use('/auth', authRateLimiter);
```

### `createWebhookRateLimiter`

Creates a rate limiter middleware for webhook endpoints.

```typescript
RateLimitingMiddleware.createWebhookRateLimiter();
```

Example:

```typescript
import RateLimitingMiddleware from '../middleware/rateLimiting.js';

// Create a rate limiter middleware for webhook endpoints
const webhookRateLimiter = RateLimitingMiddleware.createWebhookRateLimiter();

// Use the rate limiter middleware in a route
app.use('/webhooks', webhookRateLimiter);
```

### `createIpRateLimiter`

Creates a rate limiter middleware for a specific IP address.

```typescript
RateLimitingMiddleware.createIpRateLimiter(ip, options);
```

Parameters:
- `ip`: The IP address to limit.
- `options`: An object containing rate limiting options.
  - `windowMs`: The time window in milliseconds.
  - `max`: The maximum number of requests allowed in the time window.
  - `message`: The message to send when the rate limit is exceeded.
  - `statusCode`: The HTTP status code to send when the rate limit is exceeded.

Example:

```typescript
import RateLimitingMiddleware from '../middleware/rateLimiting.js';

// Create a rate limiter middleware for a specific IP address
const ipRateLimiter = RateLimitingMiddleware.createIpRateLimiter('192.168.1.1', {
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429, // Too Many Requests
});

// Use the rate limiter middleware in a route
app.use('/api', ipRateLimiter);
```

## Response Headers

When rate limiting is enabled, the middleware adds the following headers to responses:

- `RateLimit-Limit`: The maximum number of requests allowed in the time window.
- `RateLimit-Remaining`: The number of requests remaining in the current time window.
- `RateLimit-Reset`: The time in seconds until the current time window resets.

## Error Response

When a client exceeds the rate limit, the middleware returns a response with the following:

- HTTP status code: `429 Too Many Requests`
- Response body: The message specified in the rate limiter options (default: `Too many requests, please try again later.`)

## Logging

When a client exceeds the rate limit, the middleware logs a warning message with the following information:

- IP address of the client
- Path of the request
- HTTP method of the request
- Time window in milliseconds
- Maximum number of requests allowed in the time window

Example log message:

```
WARN: Rate limit exceeded - {"ip":"192.168.1.1","path":"/api/conversations","method":"GET","windowMs":60000,"max":100}
```

## Best Practices

1. **Set Appropriate Limits**: Set rate limits that are appropriate for your API. Consider the expected usage patterns and the resources required to process requests.
2. **Use Different Limiters for Different Endpoints**: Use different rate limiters for different endpoints based on their sensitivity and resource requirements.
3. **Monitor Rate Limit Exceeded Events**: Monitor rate limit exceeded events to identify potential abuse or performance issues.
4. **Communicate Rate Limits to Users**: Communicate rate limits to users through documentation and response headers.
5. **Consider User Authentication**: Consider using user authentication to identify clients instead of IP addresses for more accurate rate limiting.
6. **Implement Retry-After Header**: Consider implementing the `Retry-After` header to inform clients when they can retry their request.
7. **Use Redis for Distributed Environments**: In distributed environments, consider using Redis to store rate limit information to ensure consistent rate limiting across multiple instances.
