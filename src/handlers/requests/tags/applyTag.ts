import { BaseRequestHandler } from '../base.js';
import { ApplyTagArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for the apply_tag tool
 * Applies a tag to a conversation in Frontapp
 */
export class ApplyTagHandler extends BaseRequestHandler<ApplyTagArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: ApplyTagArguments): void {
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
   * Execute the request to apply a tag
   * @param args The validated arguments
   * @returns A response indicating success or failure
   */
  protected async execute(args: ApplyTagArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to apply the tag
      // Note: The Frontapp API expects tag_ids as an array
      await frontappClient.applyTag(args.conversation_id, args.tag_id);

      // Create a success response
      return this.createSuccessResponse({
        message: `Tag ${args.tag_id} applied to conversation ${args.conversation_id} successfully`,
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to apply tag: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const applyTagHandler = new ApplyTagHandler();
