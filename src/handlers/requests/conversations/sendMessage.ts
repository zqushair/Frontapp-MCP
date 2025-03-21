import { BaseRequestHandler } from '../base.js';
import { SendMessageArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

/**
 * Handler for the send_message tool
 * Sends a message to a conversation in Frontapp
 */
export class SendMessageHandler extends BaseRequestHandler<SendMessageArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: SendMessageArguments): void {
    // Validate conversation_id
    if (!args.conversation_id) {
      throw new Error('conversation_id is required');
    }

    if (typeof args.conversation_id !== 'string') {
      throw new Error('conversation_id must be a string');
    }

    // Validate content
    if (!args.content) {
      throw new Error('content is required');
    }

    if (typeof args.content !== 'string') {
      throw new Error('content must be a string');
    }

    // Validate author_id if provided
    if (args.author_id !== undefined && typeof args.author_id !== 'string') {
      throw new Error('author_id must be a string');
    }

    // Validate subject if provided
    if (args.subject !== undefined && typeof args.subject !== 'string') {
      throw new Error('subject must be a string');
    }

    // Validate options if provided
    if (args.options) {
      // Validate tags if provided
      if (args.options.tags !== undefined) {
        if (!Array.isArray(args.options.tags)) {
          throw new Error('options.tags must be an array');
        }

        for (const tag of args.options.tags) {
          if (typeof tag !== 'string') {
            throw new Error('options.tags must contain only strings');
          }
        }
      }

      // Validate archive if provided
      if (args.options.archive !== undefined && typeof args.options.archive !== 'boolean') {
        throw new Error('options.archive must be a boolean');
      }

      // Validate draft if provided
      if (args.options.draft !== undefined && typeof args.options.draft !== 'boolean') {
        throw new Error('options.draft must be a boolean');
      }
    }
  }

  /**
   * Execute the request to send a message
   * @param args The validated arguments
   * @returns A response indicating success or failure
   */
  protected async execute(args: SendMessageArguments): Promise<ToolResponse> {
    try {
      // Prepare the message data
      const messageData: Record<string, any> = {
        body: args.content,
        type: 'comment',
      };

      // Add author_id if provided
      if (args.author_id) {
        messageData.author_id = args.author_id;
      }

      // Add subject if provided
      if (args.subject) {
        messageData.subject = args.subject;
      }

      // Add options if provided
      if (args.options) {
        if (args.options.draft !== undefined) {
          messageData.draft = args.options.draft;
        }
      }

      // Send the message
      const response = await frontappClient.sendMessage(args.conversation_id, messageData);

      // Apply tags if provided
      if (args.options?.tags && args.options.tags.length > 0) {
        for (const tagId of args.options.tags) {
          await frontappClient.applyTag(args.conversation_id, tagId);
        }
      }

      // Archive the conversation if requested
      if (args.options?.archive) {
        await frontappClient.archiveConversation(args.conversation_id);
      }

      // Create a success response
      return this.createSuccessResponse({
        message_id: response.data.id,
        conversation_id: args.conversation_id,
        status: 'sent',
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to send message: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const sendMessageHandler = new SendMessageHandler();
