import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { 
  FRONTAPP_TOOL_DEFINITIONS,
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
  RemoveTagArguments
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

/**
 * Set up request handlers for the MCP server
 * This function registers all the tool handlers with the server
 * @param server The MCP server instance
 */
export function setupRequestHandlers(server: Server): void {
  // Register the tool definitions
  server.setRequestHandler(
    { method: 'mcp.list_tools' },
    async () => ({
      tools: FRONTAPP_TOOL_DEFINITIONS,
    })
  );

  // Register the tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    
    try {
      // Route to the appropriate handler based on the tool name
      switch (name) {
        // Conversation handlers
        case 'get_conversations':
          return await getConversationsHandler.handle(args as GetConversationsArguments);
        case 'get_conversation':
          return await getConversationHandler.handle(args as GetConversationArguments);
        case 'send_message':
          return await sendMessageHandler.handle(args as SendMessageArguments);
        case 'add_comment':
          return await addCommentHandler.handle(args as AddCommentArguments);
        case 'archive_conversation':
          return await archiveConversationHandler.handle(args as ArchiveConversationArguments);
        case 'assign_conversation':
          return await assignConversationHandler.handle(args as AssignConversationArguments);
        
        // Contact handlers
        case 'get_contact':
          return await getContactHandler.handle(args as GetContactArguments);
        case 'create_contact':
          return await createContactHandler.handle(args as CreateContactArguments);
        case 'update_contact':
          return await updateContactHandler.handle(args as UpdateContactArguments);
        
        // Teammate handlers
        case 'get_teammates':
          return await getTeammatesHandler.handle(args as GetTeammatesArguments);
        case 'get_teammate':
          return await getTeammateHandler.handle(args as GetTeammateArguments);
        
        // Account handlers
        case 'get_accounts':
          return await getAccountsHandler.handle(args as GetAccountsArguments);
        case 'get_account':
          return await getAccountHandler.handle(args as GetAccountArguments);
        case 'create_account':
          return await createAccountHandler.handle(args as CreateAccountArguments);
        case 'update_account':
          return await updateAccountHandler.handle(args as UpdateAccountArguments);
        
        // Tag handlers
        case 'get_tags':
          return await getTagsHandler.handle(args as GetTagsArguments);
        case 'apply_tag':
          return await applyTagHandler.handle(args as ApplyTagArguments);
        case 'remove_tag':
          return await removeTagHandler.handle(args as RemoveTagArguments);
        
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error: any) {
      // If the error is already an McpError, rethrow it
      if (error instanceof McpError) {
        throw error;
      }
      
      // Otherwise, wrap it in an McpError
      throw new McpError(
        ErrorCode.InternalError,
        `Error executing tool ${name}: ${error.message}`
      );
    }
  });
  
  console.log('Request handlers set up successfully');
}
