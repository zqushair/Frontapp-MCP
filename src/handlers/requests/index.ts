import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import {
  FRONTAPP_TOOL_DEFINITIONS,
  ToolResponse,
  GetConversationsArguments,
  GetConversationArguments,
  SendMessageArguments,
  AddCommentArguments,
  ArchiveConversationArguments,
  AssignConversationArguments,
  GetContactArguments,
  CreateContactArguments,
  UpdateContactArguments,
  GetTeammatesArguments,
  GetTeammateArguments,
  GetAccountsArguments,
  GetAccountArguments,
  CreateAccountArguments,
  UpdateAccountArguments,
  GetTagsArguments,
  ApplyTagArguments,
  RemoveTagArguments,
  GetInboxesArguments,
  GetInboxArguments,
} from '../../models/mcp.js';

// Import conversation handlers
import { getConversationsHandler } from './conversations/getConversations.js';
import { getConversationHandler } from './conversations/getConversation.js';
import { sendMessageHandler } from './conversations/sendMessage.js';
import { addCommentHandler } from './conversations/addComment.js';
import { archiveConversationHandler } from './conversations/archiveConversation.js';
import { assignConversationHandler } from './conversations/assignConversation.js';

// Import contact handlers
import { getContactHandler } from './contacts/getContact.js';
import { createContactHandler } from './contacts/createContact.js';
import { updateContactHandler } from './contacts/updateContact.js';

// Import teammate handlers
import { getTeammatesHandler } from './teammates/getTeammates.js';
import { getTeammateHandler } from './teammates/getTeammate.js';

// Import account handlers
import { getAccountsHandler } from './accounts/getAccounts.js';
import { getAccountHandler } from './accounts/getAccount.js';
import { createAccountHandler } from './accounts/createAccount.js';
import { updateAccountHandler } from './accounts/updateAccount.js';

// Import tag handlers
import { getTagsHandler } from './tags/getTags.js';
import { applyTagHandler } from './tags/applyTag.js';
import { removeTagHandler } from './tags/removeTag.js';

// Import inbox handlers
import { getInboxesHandler } from './inboxes/getInboxes.js';
import { getInboxHandler } from './inboxes/getInbox.js';

/**
 * Set up request handlers for the MCP server
 * This function registers all the tool handlers with the server
 * @param server The MCP server instance
 */
export function setupRequestHandlers(server: Server): void {
  // Register the tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: FRONTAPP_TOOL_DEFINITIONS,
  }));

  // Register the tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Route to the appropriate handler based on the tool name
      let response: ToolResponse;

      switch (name) {
        // Conversation handlers
        case 'get_conversations':
          response = await getConversationsHandler.handle(args as GetConversationsArguments);
          break;
        case 'get_conversation':
          response = await getConversationHandler.handle(args as GetConversationArguments);
          break;
        case 'send_message':
          response = await sendMessageHandler.handle(args as SendMessageArguments);
          break;
        case 'add_comment':
          response = await addCommentHandler.handle(args as AddCommentArguments);
          break;
        case 'archive_conversation':
          response = await archiveConversationHandler.handle(args as ArchiveConversationArguments);
          break;
        case 'assign_conversation':
          response = await assignConversationHandler.handle(args as AssignConversationArguments);
          break;

        // Contact handlers
        case 'get_contact':
          response = await getContactHandler.handle(args as GetContactArguments);
          break;
        case 'create_contact':
          response = await createContactHandler.handle(args as CreateContactArguments);
          break;
        case 'update_contact':
          response = await updateContactHandler.handle(args as UpdateContactArguments);
          break;

        // Teammate handlers
        case 'get_teammates':
          response = await getTeammatesHandler.handle(args as GetTeammatesArguments);
          break;
        case 'get_teammate':
          response = await getTeammateHandler.handle(args as GetTeammateArguments);
          break;

        // Account handlers
        case 'get_accounts':
          response = await getAccountsHandler.handle(args as GetAccountsArguments);
          break;
        case 'get_account':
          response = await getAccountHandler.handle(args as GetAccountArguments);
          break;
        case 'create_account':
          response = await createAccountHandler.handle(args as CreateAccountArguments);
          break;
        case 'update_account':
          response = await updateAccountHandler.handle(args as UpdateAccountArguments);
          break;

        // Tag handlers
        case 'get_tags':
          response = await getTagsHandler.handle(args as GetTagsArguments);
          break;
        case 'apply_tag':
          response = await applyTagHandler.handle(args as ApplyTagArguments);
          break;
        case 'remove_tag':
          response = await removeTagHandler.handle(args as RemoveTagArguments);
          break;

        // Inbox handlers
        case 'get_inboxes':
          response = await getInboxesHandler.handle(args as GetInboxesArguments);
          break;
        case 'get_inbox':
          response = await getInboxHandler.handle(args as GetInboxArguments);
          break;

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }

      // Return the response in the format expected by the MCP SDK
      return {
        result: response,
      };
    } catch (error: any) {
      // If the error is already an McpError, rethrow it
      if (error instanceof McpError) {
        throw error;
      }

      // Otherwise, wrap it in an McpError
      throw new McpError(ErrorCode.InternalError, `Error executing tool ${name}: ${error.message}`);
    }
  });

  console.log('Request handlers set up successfully');
}
