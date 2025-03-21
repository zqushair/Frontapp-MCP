import { BaseRequestHandler } from '../base.js';
import { GetConversationArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Conversation, Message } from '../../../models/frontapp.js';

/**
 * Handler for the get_conversation tool
 * Retrieves details of a specific conversation from Frontapp
 */
export class GetConversationHandler extends BaseRequestHandler<GetConversationArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: GetConversationArguments): void {
    // Validate conversation_id
    if (!args.conversation_id) {
      throw new Error('conversation_id is required');
    }

    if (typeof args.conversation_id !== 'string') {
      throw new Error('conversation_id must be a string');
    }
  }

  /**
   * Execute the request to get a conversation
   * @param args The validated arguments
   * @returns A response containing the conversation details
   */
  protected async execute(args: GetConversationArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to get the conversation
      const conversationResponse = await frontappClient.getConversation(args.conversation_id);
      const conversation = conversationResponse.data as Conversation;

      // Get the messages for this conversation
      const messagesResponse = await frontappClient.getConversationMessages(args.conversation_id);
      const messages = messagesResponse.data._results as Message[];

      // Format the response for the LLM
      const formattedConversation = {
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
        is_private: conversation.is_private,
        messages: messages.map((message) => ({
          id: message.id,
          type: message.type,
          is_inbound: message.is_inbound,
          created_at: new Date(message.created_at * 1000).toISOString(),
          author: message.author.is_teammate
            ? `${message.author.first_name || ''} ${message.author.last_name || ''}`.trim()
            : message.author.email || 'Unknown',
          text: message.text,
          recipients: message.recipients.map((recipient) => ({
            handle: recipient.handle,
            role: recipient.role,
          })),
        })),
      };

      // Create a success response with the formatted conversation
      return this.createSuccessResponse(formattedConversation);
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to get conversation: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const getConversationHandler = new GetConversationHandler();
