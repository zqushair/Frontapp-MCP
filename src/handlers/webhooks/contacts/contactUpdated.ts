import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import logger from '../../../utils/logger.js';

/**
 * Handler for contact.updated webhook events
 * This handler is triggered when a contact is updated in Frontapp
 */
export class ContactUpdatedHandler extends BaseWebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected validatePayload(payload: any): void {
    // Check if the payload has the correct type
    if (!payload || !payload.type || payload.type !== WebhookEventType.CONTACT_UPDATED) {
      throw new Error(`Invalid webhook type: ${payload?.type}`);
    }

    // Check if the payload has the required fields
    if (!payload.payload || !payload.payload.id) {
      throw new Error('Invalid webhook payload: missing contact ID');
    }
  }

  /**
   * Process the webhook payload
   * @param payload The validated webhook payload
   * @param server The MCP server instance
   */
  protected async process(payload: WebhookPayload, server: Server): Promise<void> {
    // Log the webhook event
    this.logWebhookEvent('contact.updated', payload);

    try {
      // Get the contact ID from the payload
      const contactId = payload.payload.id;

      // Fetch the contact details
      const contactResponse = await frontappClient.getContact(contactId);
      const contact = contactResponse.data;

      // Log the contact update
      logger.info(`[Webhook] Contact updated`, {
        contactId,
        contactName: contact.name || 'Unnamed Contact',
        handles: contact.handles.map((h: { handle: string; source: string }) => `${h.handle} (${h.source})`),
        groups: contact.groups,
        customFields: contact.custom_fields,
        updatedAt: new Date(contact.updated_at * 1000).toISOString()
      });

      // Here you could implement additional logic such as:
      // - Syncing updated contact information with external CRM systems
      // - Detecting and reacting to specific changes in contact data
      // - Triggering workflows based on contact updates
      // - Updating LLM context with updated contact information

      logger.info('[Webhook] Contact updated event processed successfully');
    } catch (error: any) {
      logger.error(`[Webhook] Error processing contact updated event`, { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const contactUpdatedHandler = new ContactUpdatedHandler();
