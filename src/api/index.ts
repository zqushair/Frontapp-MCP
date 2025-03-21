import express, { Request, Response, NextFunction } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { startMetricsLogging } from '../utils/monitoring.js';
import {
  requestIdMiddleware,
  httpLogger,
  requestMetricsMiddleware,
  requestBodyLogger,
} from '../middleware/requestLogger.js';
import { securityMiddleware, apiKeyAuth, httpsRedirect } from '../middleware/security.js';
import { setupSwagger } from './swagger.js';
import { initToolsRouter } from './tools.js';
import healthRouter from './health.js';
import { verifyWebhookSignature } from '../middleware/webhookAuth.js';

// Create Express app
const app = express();

// Apply middleware
// Apply HTTPS redirect first to ensure all traffic uses HTTPS
app.use(httpsRedirect);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(httpLogger);
app.use(requestMetricsMiddleware);
app.use(requestBodyLogger);
app.use(securityMiddleware);

// Apply routes
app.use('/health', healthRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // Log the error
  req.logger?.error('Request error', { error: err.message, stack: err.stack });
  
  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

/**
 * Initialize the API gateway
 * @param mcpServer The MCP server instance
 * @returns The Express app
 */
export function initApiGateway(mcpServer: Server): express.Application {
  // Start metrics logging
  const metricsInterval = startMetricsLogging(config.logging.metricsInterval || 60000);
  
  // Handle process termination
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    clearInterval(metricsInterval);
    // Close any other resources here
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    clearInterval(metricsInterval);
    // Close any other resources here
  });
  
  // Set up Swagger documentation
  setupSwagger(app);
  
  // Set up API routes
  app.use('/tools', apiKeyAuth, initToolsRouter(mcpServer));
  
  // Webhook route with signature verification
  app.use('/webhooks', verifyWebhookSignature);
  
  // Set up webhook handlers
  app.post('/webhooks', (req: Request, res: Response) => {
    try {
      const { type, data } = req.body;
      
      // Log the webhook
      req.logger?.info('Webhook received', { type });
      
      // Route to appropriate handler based on webhook type
      switch (type) {
        case 'conversation.created':
          // Handle conversation created webhook
          // conversationCreatedHandler(data, mcpServer);
          break;
        case 'message.received':
          // Handle message received webhook
          // messageReceivedHandler(data, mcpServer);
          break;
        // Add more cases for other webhook types
        default:
          req.logger?.warn('Unknown webhook type', { type });
      }
      
      // Acknowledge receipt of webhook
      res.status(200).send('OK');
    } catch (error) {
      req.logger?.error('Error processing webhook', { error });
      res.status(500).send('Error processing webhook');
    }
  });
  
  return app;
}

/**
 * Start the API server
 * @param mcpServer The MCP server instance
 * @returns The HTTP server instance
 */
export function startApiServer(mcpServer: Server): any {
  const app = initApiGateway(mcpServer);
  const port = config.server.port || 3000;
  
  const server = app.listen(port, () => {
    logger.info(`API server listening on port ${port}`);
    logger.info(`API documentation available at http://localhost:${port}/api-docs`);
  });
  
  return server;
}
