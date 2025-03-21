import { BaseRequestHandler } from '../base.js';
import { CreateContactArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Contact } from '../../../models/frontapp.js';

/**
 * Handler for the create_contact tool
 * Creates a new contact in Frontapp
 */
export class CreateContactHandler extends BaseRequestHandler<CreateContactArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: CreateContactArguments): void {
    // Validate handles
    if (!args.handles || !Array.isArray(args.handles) || args.handles.length === 0) {
      throw new Error('handles is required and must be a non-empty array');
    }

    // Validate each handle
    for (const handle of args.handles) {
      if (!handle.handle || typeof handle.handle !== 'string') {
        throw new Error('Each handle must have a handle property that is a string');
      }

      if (!handle.source || typeof handle.source !== 'string') {
        throw new Error('Each handle must have a source property that is a string');
      }
    }

    // Validate name if provided
    if (args.name !== undefined && typeof args.name !== 'string') {
      throw new Error('name must be a string');
    }

    // Validate description if provided
    if (args.description !== undefined && typeof args.description !== 'string') {
      throw new Error('description must be a string');
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
   * Execute the request to create a contact
   * @param args The validated arguments
   * @returns A response containing the created contact
   */
  protected async execute(args: CreateContactArguments): Promise<ToolResponse> {
    try {
      // Prepare the contact data
      const contactData = {
        handles: args.handles,
      } as any;

      // Add optional fields if provided
      if (args.name) {
        contactData.name = args.name;
      }

      if (args.description) {
        contactData.description = args.description;
      }

      if (args.links) {
        contactData.links = args.links;
      }

      if (args.custom_fields) {
        contactData.custom_fields = args.custom_fields;
      }

      // Call the Frontapp API to create the contact
      const response = await frontappClient.createContact(contactData);
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
        created_at: new Date(contact.created_at * 1000).toISOString(),
      };

      // Create a success response with the formatted contact
      return this.createSuccessResponse({
        contact: formattedContact,
        message: 'Contact created successfully',
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to create contact: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const createContactHandler = new CreateContactHandler();
