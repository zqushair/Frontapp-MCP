import { BaseRequestHandler } from '../base.js';
import { RemoveTagArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for the remove_tag tool
 * Removes a tag from a conversation in Frontapp
 */
export class RemoveTagHandler extends BaseRequestHandler<RemoveTagArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: RemoveTagArguments): void {
    // Validate conversation_id
    if (!args.conversation_id) {
      throw new Error('conversation_id is required');
    }

    if (typeof args.conversation_id !== 'string') {
      throw new Error('conversation_id must be a string');
    }

    // Validate tag_id
    if (!args.tag_id) {
      throw new Error('tag_id is required');
    }

    if (typeof args.tag_id !== 'string') {
      throw new Error('tag_id must be a string');
    }
  }

  /**
   * Execute the request to remove a tag
   * @param args The validated arguments
   * @returns A response indicating success or failure
   */
  protected async execute(args: RemoveTagArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to remove the tag
      // Note: The Frontapp API expects tag_ids as an array in the request body
      await frontappClient.removeTag(args.conversation_id, args.tag_id);

      // Create a success response
      return this.createSuccessResponse({
        message: `Tag ${args.tag_id} removed from conversation ${args.conversation_id} successfully`,
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to remove tag: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const removeTagHandler = new RemoveTagHandler();
