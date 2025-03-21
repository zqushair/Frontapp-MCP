import { BaseRequestHandler } from '../base.js';
import { GetTeammatesArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { FrontappPaginatedResponse, Teammate } from '../../../models/frontapp.js';

/**
 * Handler for the get_teammates tool
 * Retrieves a list of teammates from Frontapp
 */
export class GetTeammatesHandler extends BaseRequestHandler<GetTeammatesArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: GetTeammatesArguments): void {
    // Validate limit if provided
    if (args.limit !== undefined && (typeof args.limit !== 'number' || args.limit <= 0)) {
      throw new Error('Limit must be a positive number');
    }

    // Validate page_token if provided
    if (args.page_token !== undefined && typeof args.page_token !== 'string') {
      throw new Error('page_token must be a string');
    }
  }

  /**
   * Execute the request to get teammates
   * @param args The validated arguments
   * @returns A response containing the teammates
   */
  protected async execute(args: GetTeammatesArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to get teammates
      const response = await frontappClient.getTeammates();

      // Extract the teammates from the response
      const data = response.data as FrontappPaginatedResponse<Teammate>;

      // Format the response for the LLM
      const formattedTeammates = data._results.map((teammate) => ({
        id: teammate.id,
        email: teammate.email,
        username: teammate.username,
        first_name: teammate.first_name,
        last_name: teammate.last_name,
        is_admin: teammate.is_admin,
        is_available: teammate.is_available,
        is_blocked: teammate.is_blocked,
        custom_fields: teammate.custom_fields,
      }));

      // Create a success response with the formatted teammates
      return this.createSuccessResponse({
        teammates: formattedTeammates,
        pagination: {
          next_page_token: data._pagination.next,
        },
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to get teammates: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const getTeammatesHandler = new GetTeammatesHandler();
