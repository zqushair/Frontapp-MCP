import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebhookPayload } from '../../models/frontapp.js';
import logger from '../../utils/logger.js';
import ErrorLogger from '../../utils/errorLogger.js';
import webhookRetryManager from '../../utils/webhookRetry.js';

/**
 * Base interface for all webhook handlers
 * This provides a consistent structure for handling Frontapp webhooks
 */
export interface WebhookHandler {
  /**
   * Handle a webhook from Frontapp
   * @param payload The webhook payload
   * @param server The MCP server instance
   */
  handle(payload: any, server: Server): Promise<void>;
}

/**
 * Base class for all webhook handlers
 * Implements common functionality for webhook handlers
 */
export abstract class BaseWebhookHandler implements WebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected abstract validatePayload(payload: any): void;

  /**
   * Process the webhook payload
   * @param payload The validated webhook payload
   * @param server The MCP server instance
   */
  protected abstract process(payload: any, server: Server): Promise<void>;

  /**
   * Handle a webhook from Frontapp
   * This method validates the payload and then processes it with retry logic
   * @param payload The webhook payload
   * @param server The MCP server instance
   */
  async handle(payload: any, server: Server): Promise<void> {
    try {
      // Validate the payload
      this.validatePayload(payload);

      // Extract webhook type and ID for logging and retry purposes
      const webhookType = payload.type || 'unknown';
      const webhookId = payload.payload?.id || 'unknown';

      // Process the payload with retry logic
      await webhookRetryManager.executeWithRetry(
        async () => {
          await this.process(payload, server);
        },
        webhookType,
        webhookId
      );

      // Log successful processing
      logger.info(`Webhook processed successfully`, {
        type: webhookType,
        id: webhookId
      });
    } catch (error: any) {
      // Log the error with the ErrorLogger utility
      ErrorLogger.logWebhookError(`Failed to process webhook`, error, {
        type: payload.type,
        payload: payload.payload
      });

      // Rethrow the error
      throw error;
    }
  }

  /**
   * Log a webhook event
   * @param type The type of webhook event
   * @param payload The webhook payload
   */
  protected logWebhookEvent(type: string, payload: any): void {
    logger.info(`Received webhook event`, {
      type,
      id: payload.payload?.id,
      timestamp: new Date().toISOString()
    });

    // Log detailed payload at debug level
    logger.debug(`Webhook payload`, {
      type,
      payload: JSON.stringify(payload)
    });
  }
}
