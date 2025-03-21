import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebhookPayload } from '../../models/frontapp.js';

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
   * This method validates the payload and then processes it
   * @param payload The webhook payload
   * @param server The MCP server instance
   */
  async handle(payload: any, server: Server): Promise<void> {
    try {
      // Validate the payload
      this.validatePayload(payload);

      // Process the payload
      await this.process(payload, server);
    } catch (error: any) {
      // Log the error
      console.error(`[Webhook Error] ${error.message}`);

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
    console.log(`[Webhook] Received ${type} event: ${JSON.stringify(payload)}`);
  }
}
