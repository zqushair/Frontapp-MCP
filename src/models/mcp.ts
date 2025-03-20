/**
 * MCP request/response models
 * These interfaces represent the structure of data exchanged between the LLM and the MCP server
 */

// Tool response content types
export type ToolResponseContentType = 'text' | 'json' | 'html' | 'markdown';

// Tool response content item
export interface ToolResponseContentItem {
  type: ToolResponseContentType;
  text: string;
}

// Base tool response
export interface ToolResponse {
  content: ToolResponseContentItem[];
  isError?: boolean;
}

// Base tool arguments
export interface ToolArguments {
  [key: string]: any;
}

// Conversation tool arguments
export interface GetConversationsArguments extends ToolArguments {
  q?: string;
  inbox_id?: string;
  tag_id?: string;
  assignee_id?: string;
  status?: 'open' | 'archived' | 'spam' | 'deleted';
  limit?: number;
  page_token?: string;
}

export interface GetConversationArguments extends ToolArguments {
  conversation_id: string;
}

export interface SendMessageArguments extends ToolArguments {
  conversation_id: string;
  content: string;
  author_id?: string;
  subject?: string;
  options?: {
    tags?: string[];
    archive?: boolean;
    draft?: boolean;
  };
}

export interface AddCommentArguments extends ToolArguments {
  conversation_id: string;
  body: string;
  author_id: string;
}

export interface ArchiveConversationArguments extends ToolArguments {
  conversation_id: string;
}

export interface AssignConversationArguments extends ToolArguments {
  conversation_id: string;
  assignee_id: string;
}

// Contact tool arguments
export interface GetContactsArguments extends ToolArguments {
  q?: string;
  limit?: number;
  page_token?: string;
}

export interface GetContactArguments extends ToolArguments {
  contact_id: string;
}

export interface CreateContactArguments extends ToolArguments {
  name?: string;
  description?: string;
  handles: {
    handle: string;
    source: string;
  }[];
  links?: {
    name: string;
    url: string;
  }[];
  custom_fields?: Record<string, any>;
}

export interface UpdateContactArguments extends ToolArguments {
  contact_id: string;
  name?: string;
  description?: string;
  handles?: {
    handle: string;
    source: string;
  }[];
  links?: {
    name: string;
    url: string;
  }[];
  custom_fields?: Record<string, any>;
}

// Tag tool arguments
export interface GetTagsArguments extends ToolArguments {
  limit?: number;
  page_token?: string;
}

export interface ApplyTagArguments extends ToolArguments {
  conversation_id: string;
  tag_id: string;
}

export interface RemoveTagArguments extends ToolArguments {
  conversation_id: string;
  tag_id: string;
}

// Inbox tool arguments
export interface GetInboxesArguments extends ToolArguments {
  limit?: number;
  page_token?: string;
}

export interface GetInboxArguments extends ToolArguments {
  inbox_id: string;
}

// User tool arguments
export interface GetTeammatesArguments extends ToolArguments {
  limit?: number;
  page_token?: string;
}

export interface GetTeammateArguments extends ToolArguments {
  teammate_id: string;
}

// Account tool arguments
export interface GetAccountsArguments extends ToolArguments {
  q?: string;
  limit?: number;
  page_token?: string;
}

export interface GetAccountArguments extends ToolArguments {
  account_id: string;
}

export interface CreateAccountArguments extends ToolArguments {
  name: string;
  description?: string;
  domains: string[];
  external_id?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateAccountArguments extends ToolArguments {
  account_id: string;
  name?: string;
  description?: string;
  domains?: string[];
  external_id?: string;
  custom_fields?: Record<string, any>;
}

// Webhook tool arguments
export interface SubscribeWebhookArguments extends ToolArguments {
  events: string[];
  url: string;
}

export interface UnsubscribeWebhookArguments extends ToolArguments {
  webhook_id: string;
}

export interface ListWebhooksArguments extends ToolArguments {
  limit?: number;
  page_token?: string;
}

// Tool definitions for MCP server
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// MCP tool definitions
export const FRONTAPP_TOOL_DEFINITIONS: ToolDefinition[] = [
  // Conversation tools
  {
    name: 'get_conversations',
    description: 'Get a list of conversations from Frontapp',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query' },
        inbox_id: { type: 'string', description: 'Filter by inbox ID' },
        tag_id: { type: 'string', description: 'Filter by tag ID' },
        assignee_id: { type: 'string', description: 'Filter by assignee ID' },
        status: { 
          type: 'string', 
          description: 'Filter by conversation status',
          enum: ['open', 'archived', 'spam', 'deleted']
        },
        limit: { type: 'number', description: 'Maximum number of results to return' },
        page_token: { type: 'string', description: 'Token for pagination' }
      }
    }
  },
  {
    name: 'get_conversation',
    description: 'Get details of a specific conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: { type: 'string', description: 'ID of the conversation' }
      },
      required: ['conversation_id']
    }
  },
  {
    name: 'send_message',
    description: 'Send a message to a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: { type: 'string', description: 'ID of the conversation' },
        content: { type: 'string', description: 'Message content' },
        author_id: { type: 'string', description: 'ID of the message author' },
        subject: { type: 'string', description: 'Message subject' },
        options: {
          type: 'object',
          description: 'Additional options',
          properties: {
            tags: { 
              type: 'array', 
              description: 'Tags to apply to the conversation',
              items: { type: 'string' }
            },
            archive: { type: 'boolean', description: 'Whether to archive the conversation after sending' },
            draft: { type: 'boolean', description: 'Whether to create a draft instead of sending' }
          }
        }
      },
      required: ['conversation_id', 'content']
    }
  },
  {
    name: 'add_comment',
    description: 'Add a comment to a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: { type: 'string', description: 'ID of the conversation' },
        body: { type: 'string', description: 'Comment body' },
        author_id: { type: 'string', description: 'ID of the comment author' }
      },
      required: ['conversation_id', 'body', 'author_id']
    }
  },
  {
    name: 'archive_conversation',
    description: 'Archive a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: { type: 'string', description: 'ID of the conversation' }
      },
      required: ['conversation_id']
    }
  },
  {
    name: 'assign_conversation',
    description: 'Assign a conversation to a teammate',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: { type: 'string', description: 'ID of the conversation' },
        assignee_id: { type: 'string', description: 'ID of the teammate to assign the conversation to' }
      },
      required: ['conversation_id', 'assignee_id']
    }
  },
  
  // Tag tools
  {
    name: 'get_tags',
    description: 'Get a list of tags from Frontapp',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of results to return' },
        page_token: { type: 'string', description: 'Token for pagination' }
      }
    }
  },
  {
    name: 'apply_tag',
    description: 'Apply a tag to a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: { type: 'string', description: 'ID of the conversation' },
        tag_id: { type: 'string', description: 'ID of the tag to apply' }
      },
      required: ['conversation_id', 'tag_id']
    }
  },
  {
    name: 'remove_tag',
    description: 'Remove a tag from a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: { type: 'string', description: 'ID of the conversation' },
        tag_id: { type: 'string', description: 'ID of the tag to remove' }
      },
      required: ['conversation_id', 'tag_id']
    }
  },
  
  // Add more tool definitions as needed...
];
