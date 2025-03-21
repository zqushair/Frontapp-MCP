import { BaseRequestHandler } from '../base.js';
import { AddCommentArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for the add_comment tool
 * Adds a comment to a conversation in Frontapp
 */
export class AddCommentHandler extends BaseRequestHandler<AddCommentArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: AddCommentArguments): void {
    // Validate conversation_id
    if (!args.conversation_id) {
      throw new Error('conversation_id is required');
    }

    if (typeof args.conversation_id !== 'string') {
      throw new Error('conversation_id must be a string');
    }

    // Validate body
    if (!args.body) {
      throw new Error('body is required');
    }

    if (typeof args.body !== 'string') {
      throw new Error('body must be a string');
    }

    // Validate author_id
    if (!args.author_id) {
      throw new Error('author_id is required');
    }

    if (typeof args.author_id !== 'string') {
      throw new Error('author_id must be a string');
    }
  }

  /**
   * Execute the request to add a comment
   * @param args The validated arguments
   * @returns A response containing the result of adding the comment
   */
  protected async execute(args: AddCommentArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to add a comment
      const response = await frontappClient.addComment(args.conversation_id, {
        author_id: args.author_id,
        body: args.body,
      });

      // Create a success response
      return this.createSuccessResponse({
        message: `Comment added to conversation ${args.conversation_id} successfully`,
        comment: {
          id: response.data.id,
          body: response.data.body,
          author: response.data.author,
          created_at: new Date(response.data.created_at * 1000).toISOString(),
        },
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to add comment: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const addCommentHandler = new AddCommentHandler();
