import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BaseWebhookHandler } from '../base.js';
import { WebhookEventType, WebhookPayload } from '../../../models/frontapp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import logger from '../../../utils/logger.js';

/**
 * Handler for contact.created webhook events
 * This handler is triggered when a new contact is created in Frontapp
 */
export class ContactCreatedHandler extends BaseWebhookHandler {
  /**
   * Validate the webhook payload
   * @param payload The webhook payload to validate
   * @throws Error if the payload is invalid
   */
  protected validatePayload(payload: any): void {
    // Check if the payload has the correct type
    if (!payload || !payload.type || payload.type !== WebhookEventType.CONTACT_CREATED) {
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
    this.logWebhookEvent('contact.created', payload);

    try {
      // Get the contact ID from the payload
      const contactId = payload.payload.id;

      // Fetch the contact details
      const contactResponse = await frontappClient.getContact(contactId);
      const contact = contactResponse.data;

      // Log the contact creation
      logger.info(`[Webhook] New contact created`, {
        contactId,
        contactName: contact.name || 'Unnamed Contact',
        handles: contact.handles.map((h: { handle: string; source: string }) => `${h.handle} (${h.source})`),
        groups: contact.groups,
        customFields: contact.custom_fields
      });

      // Here you could implement additional logic such as:
      // - Syncing contact information with external CRM systems
      // - Enriching contact data with information from external sources
      // - Triggering welcome messages or workflows for new contacts
      // - Updating LLM context with new contact information

      logger.info('[Webhook] Contact created event processed successfully');
    } catch (error: any) {
      logger.error(`[Webhook] Error processing contact created event`, { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// Export a singleton instance of the handler
export const contactCreatedHandler = new ContactCreatedHandler();
