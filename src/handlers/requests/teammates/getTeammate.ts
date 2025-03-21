import { BaseRequestHandler } from '../base.js';
import { GetTeammateArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Teammate } from '../../../models/frontapp.js';

/**
 * Handler for the get_teammate tool
 * Retrieves details of a specific teammate from Frontapp
 */
export class GetTeammateHandler extends BaseRequestHandler<GetTeammateArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: GetTeammateArguments): void {
    // Validate teammate_id
    if (!args.teammate_id) {
      throw new Error('teammate_id is required');
    }

    if (typeof args.teammate_id !== 'string') {
      throw new Error('teammate_id must be a string');
    }
  }

  /**
   * Execute the request to get a teammate
   * @param args The validated arguments
   * @returns A response containing the teammate details
   */
  protected async execute(args: GetTeammateArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to get the teammate
      const response = await frontappClient.getTeammate(args.teammate_id);
      const teammate = response.data as Teammate;

      // Format the response for the LLM
      const formattedTeammate = {
        id: teammate.id,
        email: teammate.email,
        username: teammate.username,
        first_name: teammate.first_name,
        last_name: teammate.last_name,
        is_admin: teammate.is_admin,
        is_available: teammate.is_available,
        is_blocked: teammate.is_blocked,
        custom_fields: teammate.custom_fields,
        inboxes: teammate._links.related.inboxes,
        conversations: teammate._links.related.conversations,
      };

      // Create a success response with the formatted teammate
      return this.createSuccessResponse(formattedTeammate);
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to get teammate: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const getTeammateHandler = new GetTeammateHandler();
