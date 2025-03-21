import { BaseRequestHandler } from '../base.js';
import { GetContactArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Contact } from '../../../models/frontapp.js';

/**
 * Handler for the get_contact tool
 * Retrieves details of a specific contact from Frontapp
 */
export class GetContactHandler extends BaseRequestHandler<GetContactArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: GetContactArguments): void {
    // Validate contact_id
    if (!args.contact_id) {
      throw new Error('contact_id is required');
    }

    if (typeof args.contact_id !== 'string') {
      throw new Error('contact_id must be a string');
    }
  }

  /**
   * Execute the request to get a contact
   * @param args The validated arguments
   * @returns A response containing the contact details
   */
  protected async execute(args: GetContactArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to get the contact
      const response = await frontappClient.getContact(args.contact_id);
      const contact = response.data as Contact;

      // Format the response for the LLM
      const formattedContact = {
        id: contact.id,
        name: contact.name || '(No name)',
        description: contact.description || '',
        avatar_url: contact.avatar_url,
        is_spammer: contact.is_spammer,
        handles: contact.handles.map((handle) => ({
          handle: handle.handle,
          source: handle.source,
        })),
        links: contact.links.map((link) => ({
          name: link.name,
          url: link.url,
        })),
        groups: contact.groups,
        custom_fields: contact.custom_fields,
        created_at: new Date(contact.created_at * 1000).toISOString(),
        updated_at: new Date(contact.updated_at * 1000).toISOString(),
      };

      // Create a success response with the formatted contact
      return this.createSuccessResponse(formattedContact);
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to get contact: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const getContactHandler = new GetContactHandler();
