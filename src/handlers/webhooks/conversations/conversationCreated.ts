import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for conversation.created webhook events
 * This handler is triggered when a new conversation is created in Frontapp
 */
export class ConversationCreatedHandler extends BaseWebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected validatePayload(payload: any): void {
    // Check if the payload has the correct type
    if (!payload || !payload.type || payload.type !== WebhookEventType.CONVERSATION_CREATED) {
      throw new Error(`Invalid webhook type: ${payload?.type}`);
    }

    // Check if the payload has the required fields
    if (!payload.payload || !payload.payload.id) {
      throw new Error('Invalid webhook payload: missing conversation ID');
    }
  }

  /**
   * Process the webhook payload
   * @param payload The validated webhook payload
   * @param server The MCP server instance
   */
  protected async process(payload: WebhookPayload, server: Server): Promise<void> {
    // Log the webhook event
    this.logWebhookEvent('conversation.created', payload);

    try {
      // Get the conversation ID from the payload
      const conversationId = payload.payload.id;

      // Fetch the full conversation details from Frontapp
      const response = await frontappClient.getConversation(conversationId);
      const conversation = response.data;

      // Log the conversation details
      console.log(`[Webhook] New conversation created: ${conversation.id}`);
      console.log(`[Webhook] Subject: ${conversation.subject || '(No subject)'}`);
      console.log(`[Webhook] Status: ${conversation.status}`);

      // Here you could implement additional logic such as:
      // - Automatically tagging conversations based on content
      // - Assigning conversations to teammates based on rules
      // - Sending notifications to external systems
      // - Updating LLM context with new conversation information

      // For now, we'll just log the event
      console.log('[Webhook] Conversation created event processed successfully');
    } catch (error: any) {
      console.error(`[Webhook] Error processing conversation created event: ${error.message}`);
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const conversationCreatedHandler = new ConversationCreatedHandler();
