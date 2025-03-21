import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for message.received webhook events
 * This handler is triggered when a new message is received in Frontapp
 */
export class MessageReceivedHandler extends BaseWebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected validatePayload(payload: any): void {
    // Check if the payload has the correct type
    if (!payload || !payload.type || payload.type !== WebhookEventType.MESSAGE_RECEIVED) {
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
    this.logWebhookEvent('message.received', payload);

    try {
      // Get the message ID and conversation ID from the payload
      const messageId = payload.payload.id as string;
      const conversationId = payload.payload.conversation_id as string;

      // Fetch the conversation details from Frontapp
      const conversationResponse = await frontappClient.getConversation(conversationId);
      const conversation = conversationResponse.data;

      // Log the conversation details
      console.log(`[Webhook] New message received in conversation: ${conversation.id}`);
      console.log(`[Webhook] Conversation subject: ${conversation.subject || '(No subject)'}`);

      // Fetch the message details
      // Note: Frontapp doesn't have a direct endpoint to get a single message by ID,
      // so we need to get all messages in the conversation and find the one we want
      const messagesResponse = await frontappClient.getConversationMessages(conversationId);
      const messages = messagesResponse.data._results;

      // Find the message with the matching ID
      const message = messages.find((msg: any) => msg.id === messageId);

      if (message) {
        // Log the message details
        console.log(`[Webhook] Message ID: ${message.id}`);
        console.log(`[Webhook] Message type: ${message.type}`);
        console.log(`[Webhook] Is inbound: ${message.is_inbound}`);
        console.log(
          `[Webhook] Author: ${message.author?.first_name || ''} ${message.author?.last_name || ''}`
        );
        console.log(`[Webhook] Message blurb: ${message.blurb}`);

        // Here you could implement additional logic such as:
        // - Automatically responding to messages based on content
        // - Analyzing message content for sentiment or intent
        // - Triggering workflows based on message content
        // - Updating LLM context with new message information

        // For now, we'll just log the event
        console.log('[Webhook] Message received event processed successfully');
      } else {
        console.error(
          `[Webhook] Message with ID ${messageId} not found in conversation ${conversationId}`
        );
      }
    } catch (error: any) {
      console.error(`[Webhook] Error processing message received event: ${error.message}`);
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const messageReceivedHandler = new MessageReceivedHandler();
