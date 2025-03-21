import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import logger from '../../../utils/logger.js';

/**
 * Handler for conversation.untagged webhook events
 * This handler is triggered when a tag is removed from a conversation in Frontapp
 */
export class ConversationUntaggedHandler extends BaseWebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected validatePayload(payload: any): void {
    // Check if the payload has the correct type
    if (!payload || !payload.type || payload.type !== WebhookEventType.CONVERSATION_UNTAGGED) {
      throw new Error(`Invalid webhook type: ${payload?.type}`);
    }

    // Check if the payload has the required fields
    if (!payload.payload || !payload.payload.id || !payload.payload.tag_id) {
      throw new Error('Invalid webhook payload: missing conversation ID or tag ID');
    }
  }

  /**
   * Process the webhook payload
   * @param payload The validated webhook payload
   * @param server The MCP server instance
   */
  protected async process(payload: WebhookPayload, server: Server): Promise<void> {
    // Log the webhook event
    this.logWebhookEvent('conversation.untagged', payload);

    try {
      // Get the conversation ID and tag ID from the payload
      const conversationId = payload.payload.id;
      const tagId = payload.payload.tag_id;

      // Fetch the conversation details
      const conversationResponse = await frontappClient.getConversation(conversationId);
      const conversation = conversationResponse.data;

      // Fetch all tags and find the specific tag by ID
      const tagsResponse = await frontappClient.getTags();
      const tags = tagsResponse.data._results;
      const tag = tags.find(t => t.id === tagId);
      
      if (!tag) {
        throw new Error(`Tag with ID ${tagId} not found`);
      }

      // Log the tag removal
      logger.info(`[Webhook] Tag removed from conversation`, {
        conversationId,
        tagId,
        tagName: tag.name,
        conversationSubject: conversation.subject || '(No subject)'
      });

      // Here you could implement additional logic such as:
      // - Updating automated workflows when tags are removed
      // - Updating external systems with tag removal information
      // - Sending notifications to team members
      // - Updating LLM context with tag removal information

      logger.info('[Webhook] Conversation untagged event processed successfully');
    } catch (error: any) {
      logger.error(`[Webhook] Error processing conversation untagged event`, { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const conversationUntaggedHandler = new ConversationUntaggedHandler();
