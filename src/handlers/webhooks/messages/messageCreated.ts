import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import logger from '../../../utils/logger.js';

/**
 * Handler for message.created webhook events
 * This handler is triggered when a new message is created in Frontapp
 */
export class MessageCreatedHandler extends BaseWebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected validatePayload(payload: any): void {
    // Check if the payload has the correct type
    if (!payload || !payload.type || payload.type !== 'message.created') {
      throw new Error(`Invalid webhook type: ${payload?.type}`);
    }

    // Check if the payload has the required fields
    if (!payload.payload || !payload.payload.id || !payload.payload.conversation_id) {
      throw new Error('Invalid webhook payload: missing message ID or conversation ID');
    }
  }

  /**
   * Process the webhook payload
   * @param payload The validated webhook payload
   * @param server The MCP server instance
   */
  protected async process(payload: WebhookPayload, server: Server): Promise<void> {
    // Log the webhook event
    this.logWebhookEvent('message.created', payload);

    try {
      // Get the message ID and conversation ID from the payload
      const messageId = payload.payload.id as string;
      const conversationId = payload.payload.conversation_id as string;

      // Fetch the conversation details
      const conversationResponse = await frontappClient.getConversation(conversationId);
      const conversation = conversationResponse.data;

      // Fetch the message details
      const messagesResponse = await frontappClient.getConversationMessages(conversationId);
      const messages = messagesResponse.data._results;
      const message = messages.find(m => m.id === messageId);

      if (!message) {
        throw new Error(`Message with ID ${messageId} not found in conversation ${conversationId}`);
      }

      // Log the message creation
      logger.info(`[Webhook] New message created`, {
        messageId,
        conversationId,
        conversationSubject: conversation.subject || '(No subject)',
        isInbound: message.is_inbound,
        authorName: message.author?.first_name 
          ? `${message.author.first_name} ${message.author.last_name || ''}`
          : (message.author?.username || 'Unknown'),
        messageBlurb: message.blurb
      });

      // Here you could implement additional logic such as:
      // - Analyzing message content for sentiment or keywords
      // - Triggering automated responses based on message content
      // - Updating external systems with new message information
      // - Updating LLM context with new message information

      logger.info('[Webhook] Message created event processed successfully');
    } catch (error: any) {
      logger.error(`[Webhook] Error processing message created event`, { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const messageCreatedHandler = new MessageCreatedHandler();
