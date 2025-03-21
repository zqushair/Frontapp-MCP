# Logging and Monitoring Guide

This guide provides information on how to use the logging and monitoring systems in the Frontapp MCP integration.

## Overview

The project uses a comprehensive logging and monitoring system to track application behavior, performance, and errors. The system consists of:

- **Logging**: Using Winston for structured logging with different log levels
- **Request Logging**: HTTP request logging using Morgan
- **Metrics Collection**: Tracking system and application metrics
- **Health Checks**: Endpoints to verify system health and retrieve metrics

## Logging System

### Log Levels

The logging system supports the following log levels (in order of severity):

1. **error**: Critical errors that require immediate attention
2. **warn**: Warning conditions that should be reviewed
3. **info**: Informational messages about normal operation
4. **debug**: Detailed debugging information
5. **verbose**: Even more detailed debugging information

The log level can be configured using the `LOG_LEVEL` environment variable.

### Log Outputs

Logs are written to:

- **Console**: In development mode, logs are output to the console with colors
- **Files**: Logs are written to files in the `logs` directory:
  - `error.log`: Contains only error-level logs
  - `combined.log`: Contains all logs

Log files are automatically rotated when they reach 10MB, with a maximum of 5 files kept.

### Request-Specific Logging

Each HTTP request is assigned a unique ID, which is included in all log messages related to that request. This makes it easier to trace the flow of a request through the system.

Example:
```
2025-03-21 04:15:23 [info]: Request received {"requestId":"550e8400-e29b-41d4-a716-446655440000","method":"GET","path":"/health"}
```

## Monitoring System

### Metrics Collection

The monitoring system collects the following metrics:

#### System Metrics
- **CPU Usage**: Current CPU load average
- **Memory Usage**: Total, free, and used memory
- **Process Memory**: Detailed memory usage of the Node.js process
- **Uptime**: How long the server has been running

#### Application Metrics
- **Request Count**: Number of HTTP requests received
- **Error Count**: Number of errors encountered
- **Webhook Count**: Number of webhooks processed
- **Average Response Time**: Average time to process requests

### Metrics Logging

Metrics are automatically logged at regular intervals (default: every 60 seconds). This interval can be configured using the `METRICS_INTERVAL` environment variable.

## Health Check Endpoints

The API provides the following health check endpoints:

### Basic Health Check
```
GET /health
```

Returns basic health information:
```json
{
  "status": "ok",
  "timestamp": "2025-03-21T04:15:23.000Z",
  "version": "1.0.0"
}
```

### Metrics Endpoint
```
GET /health/metrics
```

Returns detailed system and application metrics:
```json
{
  "system": {
    "uptime": 3600,
    "cpuUsage": 0.5,
    "memoryUsage": {
      "total": 8589934592,
      "free": 4294967296,
      "used": 4294967296,
      "usedPercentage": 50
    },
    "processMemoryUsage": {
      "rss": 50331648,
      "heapTotal": 33554432,
      "heapUsed": 16777216,
      "external": 8388608,
      "arrayBuffers": 4194304
    }
  },
  "application": {
    "requestCount": 1000,
    "errorCount": 5,
    "webhookCount": 50,
    "averageResponseTime": 25
  }
}
```

### Logs Endpoint (Development Only)
```
GET /health/logs
```

In a production environment, this endpoint is disabled for security reasons.

## Using the Logging System in Code

### Basic Logging

```typescript
import logger from '../utils/logger.js';

// Different log levels
logger.error('Critical error occurred', { error: err });
logger.warn('Something unusual happened', { data: result });
logger.info('Operation completed successfully', { id: itemId });
logger.debug('Detailed debug information', { request: req.body });
```

### Request-Specific Logging

In request handlers, use the request-specific logger:

```typescript
app.get('/example', (req, res) => {
  // The req.logger is automatically created by the requestIdMiddleware
  req.logger?.info('Processing example request', { params: req.query });
  
  // Do something...
  
  req.logger?.debug('Request processing complete');
  res.send('Done');
});
```

## Configuration

The logging and monitoring systems can be configured using the following environment variables:

- `LOG_LEVEL`: The minimum log level to record (default: 'info')
- `METRICS_INTERVAL`: How often to log metrics in milliseconds (default: 60000)
- `NODE_ENV`: Set to 'production' to disable development features

## Best Practices

1. **Use Appropriate Log Levels**: Use the correct log level for each message
2. **Include Context**: Always include relevant context data with log messages
3. **Structured Logging**: Use objects for context data rather than string concatenation
4. **Request IDs**: Use the request-specific logger for request handlers
5. **Error Handling**: Always log errors with stack traces and context
6. **Sensitive Data**: Never log sensitive information like API keys or passwords

## Troubleshooting

### Common Issues

- **Missing Logs**: Check the LOG_LEVEL environment variable
- **High Disk Usage**: Check log rotation settings or decrease log verbosity
- **Performance Issues**: Monitor the metrics endpoint for resource usage
