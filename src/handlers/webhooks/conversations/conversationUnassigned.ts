import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import logger from '../../../utils/logger.js';

/**
 * Handler for conversation.unassigned webhook events
 * This handler is triggered when a conversation is unassigned from a teammate in Frontapp
 */
export class ConversationUnassignedHandler extends BaseWebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected validatePayload(payload: any): void {
    // Check if the payload has the correct type
    if (!payload || !payload.type || payload.type !== WebhookEventType.CONVERSATION_UNASSIGNED) {
      throw new Error(`Invalid webhook type: ${payload?.type}`);
    }

    // Check if the payload has the required fields
    if (!payload.payload || !payload.payload.id || !payload.payload.prev_assignee_id) {
      throw new Error('Invalid webhook payload: missing conversation ID or previous assignee ID');
    }
  }

  /**
   * Process the webhook payload
   * @param payload The validated webhook payload
   * @param server The MCP server instance
   */
  protected async process(payload: WebhookPayload, server: Server): Promise<void> {
    // Log the webhook event
    this.logWebhookEvent('conversation.unassigned', payload);

    try {
      // Get the conversation ID and previous assignee ID from the payload
      const conversationId = payload.payload.id;
      const prevAssigneeId = payload.payload.prev_assignee_id;

      // Fetch the conversation details
      const conversationResponse = await frontappClient.getConversation(conversationId);
      const conversation = conversationResponse.data;

      // Fetch the previous assignee details
      const teammateResponse = await frontappClient.getTeammate(prevAssigneeId);
      const teammate = teammateResponse.data;

      // Log the unassignment
      logger.info(`[Webhook] Conversation unassigned`, {
        conversationId,
        prevAssigneeId,
        prevAssigneeName: `${teammate.first_name} ${teammate.last_name}`,
        conversationSubject: conversation.subject || '(No subject)'
      });

      // Here you could implement additional logic such as:
      // - Sending notifications about unassigned conversations
      // - Updating external systems with unassignment information
      // - Triggering automated workflows for unassigned conversations
      // - Updating LLM context with unassignment information

      logger.info('[Webhook] Conversation unassigned event processed successfully');
    } catch (error: any) {
      logger.error(`[Webhook] Error processing conversation unassigned event`, { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const conversationUnassignedHandler = new ConversationUnassignedHandler();
