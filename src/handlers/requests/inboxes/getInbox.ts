import { BaseRequestHandler } from '../base.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { GetInboxArguments, ToolResponse } from '../../../models/mcp.js';

/**
 * Handler for the get_inbox tool
 * Retrieves details of a specific inbox from Frontapp
 */
export class GetInboxHandler extends BaseRequestHandler<GetInboxArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the inbox_id is missing
   */
  protected validateArgs(args: GetInboxArguments): void {
    if (!args.inbox_id) {
      throw new Error('inbox_id is required');
    }
  }

  /**
   * Execute the request to get inbox details
   * @param args The validated arguments
   * @returns A response with the inbox data
   */
  protected async execute(args: GetInboxArguments): Promise<ToolResponse> {
    // Extract the inbox ID
    const { inbox_id } = args;

    // Call the Frontapp API
    const response = await frontappClient.getInbox(inbox_id);

    // Return the response
    return this.createSuccessResponse(response.data);
  }
}

// Export a singleton instance
export const getInboxHandler = new GetInboxHandler();
