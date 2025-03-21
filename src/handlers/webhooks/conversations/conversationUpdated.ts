import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for conversation.updated webhook events
 * This handler is triggered when a conversation is updated in Frontapp
 */
export class ConversationUpdatedHandler extends BaseWebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected validatePayload(payload: any): void {
    // Check if the payload has the correct type
    if (!payload || !payload.type || payload.type !== WebhookEventType.CONVERSATION_ASSIGNED) {
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
    this.logWebhookEvent('conversation.updated', payload);

    try {
      // Get the conversation ID from the payload
      const conversationId = payload.payload.id;

      // Fetch the full conversation details from Frontapp
      const response = await frontappClient.getConversation(conversationId);
      const conversation = response.data;

      // Log the conversation details
      console.log(`[Webhook] Conversation updated: ${conversation.id}`);
      console.log(`[Webhook] Subject: ${conversation.subject || '(No subject)'}`);
      console.log(`[Webhook] Status: ${conversation.status}`);

      // Check if the conversation has an assignee
      if (conversation.assignee) {
        console.log(
          `[Webhook] Assigned to: ${conversation.assignee.first_name} ${conversation.assignee.last_name}`
        );
      } else {
        console.log('[Webhook] Conversation is unassigned');
      }

      // Check if the conversation has tags
      if (conversation.tags && conversation.tags.length > 0) {
        console.log(
          `[Webhook] Tags: ${conversation.tags.map((tag: { name: string }) => tag.name).join(', ')}`
        );
      } else {
        console.log('[Webhook] Conversation has no tags');
      }

      // Here you could implement additional logic such as:
      // - Triggering automated workflows based on conversation updates
      // - Sending notifications to external systems
      // - Updating LLM context with updated conversation information

      // For now, we'll just log the event
      console.log('[Webhook] Conversation updated event processed successfully');
    } catch (error: any) {
      console.error(`[Webhook] Error processing conversation updated event: ${error.message}`);
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const conversationUpdatedHandler = new ConversationUpdatedHandler();
