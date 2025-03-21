import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import logger from '../../../utils/logger.js';

/**
 * Handler for conversation.assigned webhook events
 * This handler is triggered when a conversation is assigned to a teammate in Frontapp
 */
export class ConversationAssignedHandler extends BaseWebhookHandler {
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
    if (!payload.payload || !payload.payload.id || !payload.payload.assignee_id) {
      throw new Error('Invalid webhook payload: missing conversation ID or assignee ID');
    }
  }

  /**
   * Process the webhook payload
   * @param payload The validated webhook payload
   * @param server The MCP server instance
   */
  protected async process(payload: WebhookPayload, server: Server): Promise<void> {
    // Log the webhook event
    this.logWebhookEvent('conversation.assigned', payload);

    try {
      // Get the conversation ID and assignee ID from the payload
      const conversationId = payload.payload.id;
      const assigneeId = payload.payload.assignee_id;

      // Fetch the conversation details
      const conversationResponse = await frontappClient.getConversation(conversationId);
      const conversation = conversationResponse.data;

      // Fetch the assignee details
      const teammateResponse = await frontappClient.getTeammate(assigneeId);
      const teammate = teammateResponse.data;

      // Log the assignment
      logger.info(`[Webhook] Conversation assigned`, {
        conversationId,
        assigneeId,
        assigneeName: `${teammate.first_name} ${teammate.last_name}`,
        conversationSubject: conversation.subject || '(No subject)'
      });

      // Here you could implement additional logic such as:
      // - Sending notifications to the assigned teammate
      // - Updating external systems with assignment information
      // - Triggering automated workflows based on assignments
      // - Updating LLM context with assignment information

      logger.info('[Webhook] Conversation assigned event processed successfully');
    } catch (error: any) {
      logger.error(`[Webhook] Error processing conversation assigned event`, { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const conversationAssignedHandler = new ConversationAssignedHandler();
