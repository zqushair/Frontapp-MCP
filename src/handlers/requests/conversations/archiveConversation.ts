import { BaseRequestHandler } from '../base.js';
import { ArchiveConversationArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for the archive_conversation tool
 * Archives a conversation in Frontapp
 */
export class ArchiveConversationHandler extends BaseRequestHandler<ArchiveConversationArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: ArchiveConversationArguments): void {
    // Validate conversation_id
    if (!args.conversation_id) {
      throw new Error('conversation_id is required');
    }

    if (typeof args.conversation_id !== 'string') {
      throw new Error('conversation_id must be a string');
    }
  }

  /**
   * Execute the request to archive a conversation
   * @param args The validated arguments
   * @returns A response indicating success or failure
   */
  protected async execute(args: ArchiveConversationArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to archive the conversation
      await frontappClient.archiveConversation(args.conversation_id);

      // Create a success response
      return this.createSuccessResponse({
        message: `Conversation ${args.conversation_id} archived successfully`,
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to archive conversation: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const archiveConversationHandler = new ArchiveConversationHandler();
