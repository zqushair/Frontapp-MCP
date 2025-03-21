import { BaseRequestHandler } from '../base.js';
import { GetConversationsArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Conversation, FrontappPaginatedResponse } from '../../../models/frontapp.js';

/**
 * Handler for the get_conversations tool
 * Retrieves a list of conversations from Frontapp
 */
export class GetConversationsHandler extends BaseRequestHandler<GetConversationsArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: GetConversationsArguments): void {
    // Validate limit if provided
    if (args.limit !== undefined && (typeof args.limit !== 'number' || args.limit <= 0)) {
      throw new Error('Limit must be a positive number');
    }

    // Validate status if provided
    if (
      args.status !== undefined &&
      !['open', 'archived', 'spam', 'deleted'].includes(args.status)
    ) {
      throw new Error('Status must be one of: open, archived, spam, deleted');
    }
  }

  /**
   * Execute the request to get conversations
   * @param args The validated arguments
   * @returns A response containing the conversations
   */
  protected async execute(args: GetConversationsArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to get conversations
      const response = await frontappClient.getConversations(args);

      // Extract the conversations from the response
      const data = response.data as FrontappPaginatedResponse<Conversation>;

      // Format the response for the LLM
      const formattedConversations = data._results.map((conversation) => ({
        id: conversation.id,
        subject: conversation.subject || '(No subject)',
        status: conversation.status,
        assignee: conversation.assignee
          ? {
              id: conversation.assignee.id,
              name: `${conversation.assignee.first_name} ${conversation.assignee.last_name}`,
            }
          : null,
        tags: conversation.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
        })),
        created_at: new Date(conversation.created_at * 1000).toISOString(),
        last_message: conversation.last_message
          ? {
              author: conversation.last_message.author.is_teammate
                ? `${conversation.last_message.author.first_name || ''} ${conversation.last_message.author.last_name || ''}`.trim()
                : conversation.last_message.author.email || 'Unknown',
              text: conversation.last_message.text,
              created_at: new Date(conversation.last_message.created_at * 1000).toISOString(),
            }
          : null,
      }));

      // Create a success response with the formatted conversations
      return this.createSuccessResponse({
        conversations: formattedConversations,
        pagination: {
          next_page_token: data._pagination.next,
        },
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to get conversations: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const getConversationsHandler = new GetConversationsHandler();
