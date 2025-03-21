import { BaseRequestHandler } from '../base.js';
import { UpdateContactArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Contact } from '../../../models/frontapp.js';

/**
 * Handler for the update_contact tool
 * Updates an existing contact in Frontapp
 */
export class UpdateContactHandler extends BaseRequestHandler<UpdateContactArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: UpdateContactArguments): void {
    // Validate contact_id
    if (!args.contact_id) {
      throw new Error('contact_id is required');
    }

    if (typeof args.contact_id !== 'string') {
      throw new Error('contact_id must be a string');
    }

    // Validate that at least one field to update is provided
    if (!args.name && !args.description && !args.handles && !args.links && !args.custom_fields) {
      throw new Error('At least one field to update must be provided');
    }

    // Validate name if provided
    if (args.name !== undefined && typeof args.name !== 'string') {
      throw new Error('name must be a string');
    }

    // Validate description if provided
    if (args.description !== undefined && typeof args.description !== 'string') {
      throw new Error('description must be a string');
    }

    // Validate handles if provided
    if (args.handles !== undefined) {
      if (!Array.isArray(args.handles)) {
        throw new Error('handles must be an array');
      }

      for (const handle of args.handles) {
        if (!handle.handle || typeof handle.handle !== 'string') {
          throw new Error('Each handle must have a handle property that is a string');
        }

        if (!handle.source || typeof handle.source !== 'string') {
          throw new Error('Each handle must have a source property that is a string');
        }
      }
    }

    // Validate links if provided
    if (args.links !== undefined) {
      if (!Array.isArray(args.links)) {
        throw new Error('links must be an array');
      }

      for (const link of args.links) {
        if (!link.name || typeof link.name !== 'string') {
          throw new Error('Each link must have a name property that is a string');
        }

        if (!link.url || typeof link.url !== 'string') {
          throw new Error('Each link must have a url property that is a string');
        }
      }
    }

    // Validate custom_fields if provided
    if (args.custom_fields !== undefined && typeof args.custom_fields !== 'object') {
      throw new Error('custom_fields must be an object');
    }
  }

  /**
   * Execute the request to update a contact
   * @param args The validated arguments
   * @returns A response containing the updated contact
   */
  protected async execute(args: UpdateContactArguments): Promise<ToolResponse> {
    try {
      // Prepare the contact data
      const contactData: Record<string, any> = {};

      // Add fields to update if provided
      if (args.name !== undefined) {
        contactData.name = args.name;
      }

      if (args.description !== undefined) {
        contactData.description = args.description;
      }

      if (args.handles !== undefined) {
        contactData.handles = args.handles;
      }

      if (args.links !== undefined) {
        contactData.links = args.links;
      }

      if (args.custom_fields !== undefined) {
        contactData.custom_fields = args.custom_fields;
      }

      // Call the Frontapp API to update the contact
      const response = await frontappClient.updateContact(args.contact_id, contactData);
      const contact = response.data as Contact;

      // Format the response for the LLM
      const formattedContact = {
        id: contact.id,
        name: contact.name || '(No name)',
        description: contact.description || '',
        handles: contact.handles.map((handle) => ({
          handle: handle.handle,
          source: handle.source,
        })),
        links: contact.links.map((link) => ({
          name: link.name,
          url: link.url,
        })),
        updated_at: new Date(contact.updated_at * 1000).toISOString(),
      };

      // Create a success response with the formatted contact
      return this.createSuccessResponse({
        contact: formattedContact,
        message: 'Contact updated successfully',
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to update contact: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const updateContactHandler = new UpdateContactHandler();
