import { BaseRequestHandler } from '../base.js';
import { GetTagsArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { FrontappPaginatedResponse, Tag } from '../../../models/frontapp.js';

/**
 * Handler for the get_tags tool
 * Retrieves a list of tags from Frontapp
 */
export class GetTagsHandler extends BaseRequestHandler<GetTagsArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: GetTagsArguments): void {
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
   * Execute the request to get tags
   * @param args The validated arguments
   * @returns A response containing the tags
   */
  protected async execute(args: GetTagsArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to get tags
      const response = await frontappClient.getTags();

      // Extract the tags from the response
      const data = response.data as FrontappPaginatedResponse<Tag>;

      // Format the response for the LLM
      const formattedTags = data._results.map((tag) => ({
        id: tag.id,
        name: tag.name,
        highlight: tag.highlight,
        is_private: tag.is_private,
        created_at: new Date(tag.created_at * 1000).toISOString(),
        updated_at: new Date(tag.updated_at * 1000).toISOString(),
      }));

      // Create a success response with the formatted tags
      return this.createSuccessResponse({
        tags: formattedTags,
        pagination: {
          next_page_token: data._pagination.next,
        },
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to get tags: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const getTagsHandler = new GetTagsHandler();
