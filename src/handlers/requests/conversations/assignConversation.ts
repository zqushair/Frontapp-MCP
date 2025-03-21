import { BaseRequestHandler } from '../base.js';
import { AssignConversationArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for the assign_conversation tool
 * Assigns a conversation to a teammate in Frontapp
 */
export class AssignConversationHandler extends BaseRequestHandler<AssignConversationArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: AssignConversationArguments): void {
    // Validate conversation_id
    if (!args.conversation_id) {
      throw new Error('conversation_id is required');
    }

    if (typeof args.conversation_id !== 'string') {
      throw new Error('conversation_id must be a string');
    }

    // Validate assignee_id
    if (!args.assignee_id) {
      throw new Error('assignee_id is required');
    }

    if (typeof args.assignee_id !== 'string') {
      throw new Error('assignee_id must be a string');
    }
  }

  /**
   * Execute the request to assign a conversation
   * @param args The validated arguments
   * @returns A response indicating success or failure
   */
  protected async execute(args: AssignConversationArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to assign the conversation
      await frontappClient.assignConversation(args.conversation_id, args.assignee_id);

      // Create a success response
      return this.createSuccessResponse({
        message: `Conversation ${args.conversation_id} assigned to teammate ${args.assignee_id} successfully`,
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to assign conversation: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const assignConversationHandler = new AssignConversationHandler();
