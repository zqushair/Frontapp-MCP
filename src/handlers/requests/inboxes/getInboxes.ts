import { BaseRequestHandler } from '../base.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { GetInboxesArguments, ToolResponse } from '../../../models/mcp.js';

/**
 * Handler for the get_inboxes tool
 * Retrieves a list of inboxes from Frontapp
 */
export class GetInboxesHandler extends BaseRequestHandler<GetInboxesArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   */
  protected validateArgs(_args: GetInboxesArguments): void {
    // No required arguments for this tool
  }

  /**
   * Execute the request to get inboxes
   * @param args The validated arguments
   * @returns A response with the inboxes data
   */
  protected async execute(args: GetInboxesArguments): Promise<ToolResponse> {
    // Extract pagination parameters
    const { limit, page_token } = args;

    // Prepare parameters for the Frontapp API
    const params: Record<string, any> = {};
    if (limit) {
      params.limit = limit;
    }
    if (page_token) {
      params.page_token = page_token;
    }

    // Call the Frontapp API
    const response = await frontappClient.getInboxes(params);

    // Return the response
    return this.createSuccessResponse(response.data);
  }
}

// Export a singleton instance
export const getInboxesHandler = new GetInboxesHandler();
