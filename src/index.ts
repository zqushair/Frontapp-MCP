#!/usr/bin/env node

/**
 * Frontapp MCP Server
 * 
 * A comprehensive Model Context Protocol server for Frontapp API integration.
 * Allows Claude Code to interact with conversations, messages, contacts, and more.
 * 
 * Setup:
 * 1. npm install @modelcontextprotocol/sdk axios
 * 2. Set FRONTAPP_API_TOKEN environment variable
 * 3. Run: node frontapp-mcp-server.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import express from 'express';

const API_BASE_URL = 'https://api2.frontapp.com';

class FrontappMCPServer {
  private server: Server;
  private axiosInstance: AxiosInstance;

  constructor(apiToken: string) {
    this.server = new Server(
      {
        name: 'frontapp-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Configure axios with API token
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.setupHandlers();
    this.setupErrorHandling();
  }

  async connectTo(transport: any): Promise<void> {
    await this.server.connect(transport);
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Conversation tools
        {
          name: 'list_conversations',
          description: 'List conversations in Front. Returns conversations in reverse chronological order (most recently updated first). Supports pagination and filtering via query parameter.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results (max 100, default 50)' },
              page_token: { type: 'string', description: 'Pagination token from previous response' },
              q: { type: 'string', description: 'Query string for filtering (e.g., "status:archived")' },
            },
          },
        },
        {
          name: 'get_conversation',
          description: 'Get details of a specific conversation by ID',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID (e.g., cnv_abc123)' },
            },
            required: ['conversation_id'],
          },
        },
        {
          name: 'search_conversations',
          description: 'Search for conversations using Front search syntax. Supports complex queries with status, tags, assignees, etc.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query (e.g., "tag:urgent status:open")' },
              limit: { type: 'number', description: 'Number of results (max 100, default 50)' },
              page_token: { type: 'string', description: 'Pagination token from previous response for fetching next page of results' },
            },
            required: ['query'],
          },
        },
        {
          name: 'update_conversation',
          description: 'Update conversation properties like assignee, tags, status',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              assignee_id: { type: 'string', description: 'Teammate ID to assign' },
              status: { type: 'string', enum: ['archived', 'deleted', 'unassigned', 'assigned'], description: 'Conversation status' },
              tag_ids: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs' },
            },
            required: ['conversation_id'],
          },
        },

        // Message tools
        {
          name: 'list_conversation_messages',
          description: 'List all messages in a conversation in reverse chronological order (newest first)',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              limit: { type: 'number', description: 'Number of results (max 100, default 50)' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['conversation_id'],
          },
        },
        {
          name: 'get_message',
          description: 'Get details of a specific message by ID',
          inputSchema: {
            type: 'object',
            properties: {
              message_id: { type: 'string', description: 'Message ID (e.g., msg_abc123)' },
            },
            required: ['message_id'],
          },
        },
        {
          name: 'send_message',
          description: 'Send a new message to a channel (creates a new conversation)',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID to send from' },
              to: { type: 'array', items: { type: 'string' }, description: 'Recipient email addresses or handles' },
              subject: { type: 'string', description: 'Message subject' },
              body: { type: 'string', description: 'Message body (text or HTML)' },
              text: { type: 'string', description: 'Plain text version of body' },
              cc: { type: 'array', items: { type: 'string' }, description: 'CC recipients' },
              bcc: { type: 'array', items: { type: 'string' }, description: 'BCC recipients' },
              tag_ids: { type: 'array', items: { type: 'string' }, description: 'Tags to apply' },
            },
            required: ['channel_id', 'to', 'body'],
          },
        },
        {
          name: 'reply_to_conversation',
          description: 'Send a reply to an existing conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID to reply to' },
              type: { type: 'string', enum: ['comment', 'reply'], description: 'Type of reply' },
              body: { type: 'string', description: 'Reply body' },
              text: { type: 'string', description: 'Plain text version' },
              author_id: { type: 'string', description: 'Teammate ID sending the reply' },
              channel_id: { type: 'string', description: 'Channel to send from (required for reply type)' },
            },
            required: ['conversation_id', 'type', 'body'],
          },
        },

        // Contact tools
        {
          name: 'list_contacts',
          description: 'List contacts in Front with pagination support',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results (max 100, default 50)' },
              page_token: { type: 'string', description: 'Pagination token' },
              sort_by: { type: 'string', description: 'Sort field' },
              sort_order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
            },
          },
        },
        {
          name: 'get_contact',
          description: 'Get details of a specific contact by ID',
          inputSchema: {
            type: 'object',
            properties: {
              contact_id: { type: 'string', description: 'Contact ID (e.g., crd_abc123)' },
            },
            required: ['contact_id'],
          },
        },
        {
          name: 'create_contact',
          description: 'Create a new contact in Front',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Contact name' },
              description: { type: 'string', description: 'Contact description' },
              handles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    handle: { type: 'string', description: 'Email, phone, or social handle' },
                    source: { type: 'string', description: 'Source type (email, phone, twitter, etc.)' },
                  },
                },
                description: 'Contact handles (email, phone, etc.)',
              },
              custom_fields: { type: 'object', description: 'Custom field key-value pairs' },
            },
            required: ['handles'],
          },
        },
        {
          name: 'update_contact',
          description: 'Update an existing contact',
          inputSchema: {
            type: 'object',
            properties: {
              contact_id: { type: 'string', description: 'Contact ID' },
              name: { type: 'string', description: 'Updated name' },
              description: { type: 'string', description: 'Updated description' },
              handles: { type: 'array', items: { type: 'object' }, description: 'Updated handles' },
              custom_fields: { type: 'object', description: 'Updated custom fields' },
            },
            required: ['contact_id'],
          },
        },

        // Teammate tools
        {
          name: 'list_teammates',
          description: 'List all teammates in the Front account',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'get_teammate',
          description: 'Get details of a specific teammate by ID',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID (e.g., tea_abc123)' },
            },
            required: ['teammate_id'],
          },
        },

        // Tag tools
        {
          name: 'list_tags',
          description: 'List all tags in the Front account',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'create_tag',
          description: 'Create a new tag',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Tag name' },
              highlight: {
                type: 'string',
                enum: ['grey', 'pink', 'red', 'orange', 'yellow', 'green', 'light-blue', 'blue', 'purple'],
                description: 'Tag color',
              },
              is_private: { type: 'boolean', description: 'Whether tag is private' },
            },
            required: ['name'],
          },
        },

        // Inbox tools
        {
          name: 'list_inboxes',
          description: 'List all inboxes accessible to the API token',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'get_inbox',
          description: 'Get details of a specific inbox by ID',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_id: { type: 'string', description: 'Inbox ID (e.g., inb_abc123)' },
            },
            required: ['inbox_id'],
          },
        },

        // Comment tools
        {
          name: 'list_conversation_comments',
          description: 'List all comments (internal discussions) in a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
            },
            required: ['conversation_id'],
          },
        },
        {
          name: 'add_comment',
          description: 'Add an internal comment to a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              body: { type: 'string', description: 'Comment body' },
              author_id: { type: 'string', description: 'Teammate ID posting the comment' },
            },
            required: ['conversation_id', 'body'],
          },
        },

        // Analytics tools
        {
          name: 'get_analytics',
          description: 'Get analytics data for conversations, messages, or teammates',
          inputSchema: {
            type: 'object',
            properties: {
              start: { type: 'number', description: 'Start timestamp (Unix time)' },
              end: { type: 'number', description: 'End timestamp (Unix time)' },
              metrics: {
                type: 'array',
                items: { type: 'string' },
                description: 'Metrics to retrieve (e.g., avg_first_response_time)',
              },
              filters: { type: 'object', description: 'Filters to apply' },
            },
            required: ['start', 'end'],
          },
        },

        // Account tools
        {
          name: 'list_accounts',
          description: 'List all accounts in Front',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results (max 100, default 50)' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'create_account',
          description: 'Create a new account',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Account name' },
              description: { type: 'string', description: 'Account description' },
              domains: { type: 'array', items: { type: 'string' }, description: 'Account domains' },
              custom_fields: { type: 'object', description: 'Custom field key-value pairs' },
            },
            required: ['name'],
          },
        },
        {
          name: 'get_account',
          description: 'Get details of a specific account by ID',
          inputSchema: {
            type: 'object',
            properties: {
              account_id: { type: 'string', description: 'Account ID' },
            },
            required: ['account_id'],
          },
        },
        {
          name: 'update_account',
          description: 'Update an existing account',
          inputSchema: {
            type: 'object',
            properties: {
              account_id: { type: 'string', description: 'Account ID' },
              name: { type: 'string', description: 'Updated name' },
              description: { type: 'string', description: 'Updated description' },
              domains: { type: 'array', items: { type: 'string' }, description: 'Updated domains' },
              custom_fields: { type: 'object', description: 'Updated custom fields' },
            },
            required: ['account_id'],
          },
        },
        {
          name: 'delete_account',
          description: 'Delete an account',
          inputSchema: {
            type: 'object',
            properties: {
              account_id: { type: 'string', description: 'Account ID' },
            },
            required: ['account_id'],
          },
        },
        {
          name: 'list_account_contacts',
          description: 'List all contacts associated with an account',
          inputSchema: {
            type: 'object',
            properties: {
              account_id: { type: 'string', description: 'Account ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['account_id'],
          },
        },
        {
          name: 'add_contact_to_account',
          description: 'Add a contact to an account',
          inputSchema: {
            type: 'object',
            properties: {
              account_id: { type: 'string', description: 'Account ID' },
              contact_ids: { type: 'array', items: { type: 'string' }, description: 'Contact IDs to add' },
            },
            required: ['account_id', 'contact_ids'],
          },
        },
        {
          name: 'remove_contact_from_account',
          description: 'Remove a contact from an account',
          inputSchema: {
            type: 'object',
            properties: {
              account_id: { type: 'string', description: 'Account ID' },
              contact_ids: { type: 'array', items: { type: 'string' }, description: 'Contact IDs to remove' },
            },
            required: ['account_id', 'contact_ids'],
          },
        },

        // Additional Contact tools
        {
          name: 'delete_contact',
          description: 'Delete a contact',
          inputSchema: {
            type: 'object',
            properties: {
              contact_id: { type: 'string', description: 'Contact ID' },
            },
            required: ['contact_id'],
          },
        },
        {
          name: 'merge_contacts',
          description: 'Merge two contacts into one',
          inputSchema: {
            type: 'object',
            properties: {
              target_contact_id: { type: 'string', description: 'Contact ID to merge into (will be kept)' },
              contact_ids: { type: 'array', items: { type: 'string' }, description: 'Array of contact IDs to merge into target' },
            },
            required: ['target_contact_id', 'contact_ids'],
          },
        },
        {
          name: 'list_contact_conversations',
          description: 'List all conversations for a contact',
          inputSchema: {
            type: 'object',
            properties: {
              contact_id: { type: 'string', description: 'Contact ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['contact_id'],
          },
        },
        {
          name: 'list_contact_notes',
          description: 'List all notes for a contact',
          inputSchema: {
            type: 'object',
            properties: {
              contact_id: { type: 'string', description: 'Contact ID' },
            },
            required: ['contact_id'],
          },
        },
        {
          name: 'add_contact_note',
          description: 'Add a note to a contact',
          inputSchema: {
            type: 'object',
            properties: {
              contact_id: { type: 'string', description: 'Contact ID' },
              body: { type: 'string', description: 'Note content' },
              author_id: { type: 'string', description: 'Teammate ID creating the note' },
            },
            required: ['contact_id', 'body'],
          },
        },
        {
          name: 'add_contact_handle',
          description: 'Add a handle (email, phone, etc.) to a contact',
          inputSchema: {
            type: 'object',
            properties: {
              contact_id: { type: 'string', description: 'Contact ID' },
              handle: { type: 'string', description: 'Handle value (email, phone, etc.)' },
              source: { type: 'string', description: 'Handle source type (email, phone, twitter, etc.)' },
            },
            required: ['contact_id', 'handle', 'source'],
          },
        },
        {
          name: 'delete_contact_handle',
          description: 'Delete a handle from a contact',
          inputSchema: {
            type: 'object',
            properties: {
              contact_id: { type: 'string', description: 'Contact ID' },
              handle: { type: 'string', description: 'Handle to remove' },
              source: { type: 'string', description: 'Handle source type' },
            },
            required: ['contact_id', 'handle', 'source'],
          },
        },
        {
          name: 'list_teammate_contacts',
          description: 'List contacts for a specific teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['teammate_id'],
          },
        },
        {
          name: 'create_teammate_contact',
          description: 'Create a contact scoped to a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
              name: { type: 'string', description: 'Contact name' },
              handles: { type: 'array', items: { type: 'object' }, description: 'Contact handles' },
            },
            required: ['teammate_id', 'handles'],
          },
        },
        {
          name: 'list_team_contacts',
          description: 'List contacts for a specific team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['team_id'],
          },
        },

        // Channel tools
        {
          name: 'list_channels',
          description: 'List all channels',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'create_channel',
          description: 'Create a new channel',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Channel type (smtp, imap, twilio, custom, etc.)' },
              settings: { type: 'object', description: 'Channel-specific settings' },
              inbox_id: { type: 'string', description: 'Inbox ID to associate with' },
            },
            required: ['type', 'settings'],
          },
        },
        {
          name: 'get_channel',
          description: 'Get details of a specific channel',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID' },
            },
            required: ['channel_id'],
          },
        },
        {
          name: 'update_channel',
          description: 'Update a channel',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID' },
              settings: { type: 'object', description: 'Updated channel settings' },
            },
            required: ['channel_id'],
          },
        },
        {
          name: 'validate_channel',
          description: 'Validate channel configuration',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID' },
            },
            required: ['channel_id'],
          },
        },
        {
          name: 'list_teammate_channels',
          description: 'List channels for a specific teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
            },
            required: ['teammate_id'],
          },
        },
        {
          name: 'list_team_channels',
          description: 'List channels for a specific team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
            },
            required: ['team_id'],
          },
        },
        {
          name: 'sync_inbound_message',
          description: 'Sync an inbound message to a custom channel',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID' },
              sender: { type: 'object', description: 'Sender information' },
              subject: { type: 'string', description: 'Message subject' },
              body: { type: 'string', description: 'Message body' },
              body_format: { type: 'string', enum: ['html', 'markdown'], description: 'Body format' },
              metadata: { type: 'object', description: 'Message metadata' },
            },
            required: ['channel_id', 'sender', 'body'],
          },
        },
        {
          name: 'sync_outbound_message',
          description: 'Sync an outbound message to a custom channel',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID' },
              to: { type: 'array', items: { type: 'string' }, description: 'Recipients' },
              subject: { type: 'string', description: 'Message subject' },
              body: { type: 'string', description: 'Message body' },
              metadata: { type: 'object', description: 'Message metadata' },
            },
            required: ['channel_id', 'to', 'body'],
          },
        },
        {
          name: 'update_external_message_status',
          description: 'Update the status of an external message',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID' },
              message_id: { type: 'string', description: 'Message ID' },
              status: { type: 'string', enum: ['delivered', 'bounced', 'opened'], description: 'Message status' },
            },
            required: ['channel_id', 'message_id', 'status'],
          },
        },
        {
          name: 'sync_application_message_template',
          description: 'Sync an application message template',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID' },
              template: { type: 'object', description: 'Template data' },
            },
            required: ['channel_id', 'template'],
          },
        },

        // Additional Comment tools
        {
          name: 'get_comment',
          description: 'Get a specific comment by ID',
          inputSchema: {
            type: 'object',
            properties: {
              comment_id: { type: 'string', description: 'Comment ID' },
            },
            required: ['comment_id'],
          },
        },
        {
          name: 'update_comment',
          description: 'Update a comment',
          inputSchema: {
            type: 'object',
            properties: {
              comment_id: { type: 'string', description: 'Comment ID' },
              body: { type: 'string', description: 'Updated comment body' },
            },
            required: ['comment_id', 'body'],
          },
        },
        {
          name: 'list_comment_mentions',
          description: 'List all mentions in a comment',
          inputSchema: {
            type: 'object',
            properties: {
              comment_id: { type: 'string', description: 'Comment ID' },
            },
            required: ['comment_id'],
          },
        },
        {
          name: 'add_comment_reply',
          description: 'Add a reply to a comment',
          inputSchema: {
            type: 'object',
            properties: {
              comment_id: { type: 'string', description: 'Comment ID to reply to' },
              body: { type: 'string', description: 'Reply body' },
              author_id: { type: 'string', description: 'Teammate ID posting the reply' },
            },
            required: ['comment_id', 'body'],
          },
        },

        // Contact Group tools (deprecated)
        {
          name: 'list_contact_groups',
          description: 'List all contact groups (deprecated - use contact lists)',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'create_contact_group',
          description: 'Create a new contact group (deprecated - use contact lists)',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Group name' },
            },
            required: ['name'],
          },
        },
        {
          name: 'delete_contact_group',
          description: 'Delete a contact group',
          inputSchema: {
            type: 'object',
            properties: {
              group_id: { type: 'string', description: 'Group ID' },
            },
            required: ['group_id'],
          },
        },
        {
          name: 'list_group_contacts',
          description: 'List contacts in a contact group',
          inputSchema: {
            type: 'object',
            properties: {
              group_id: { type: 'string', description: 'Group ID' },
            },
            required: ['group_id'],
          },
        },
        {
          name: 'add_contacts_to_group',
          description: 'Add contacts to a contact group',
          inputSchema: {
            type: 'object',
            properties: {
              group_id: { type: 'string', description: 'Group ID' },
              contact_ids: { type: 'array', items: { type: 'string' }, description: 'Contact IDs to add' },
            },
            required: ['group_id', 'contact_ids'],
          },
        },
        {
          name: 'remove_contacts_from_group',
          description: 'Remove contacts from a contact group',
          inputSchema: {
            type: 'object',
            properties: {
              group_id: { type: 'string', description: 'Group ID' },
              contact_ids: { type: 'array', items: { type: 'string' }, description: 'Contact IDs to remove' },
            },
            required: ['group_id', 'contact_ids'],
          },
        },
        {
          name: 'list_teammate_groups',
          description: 'List contact groups for a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
            },
            required: ['teammate_id'],
          },
        },
        {
          name: 'create_teammate_group',
          description: 'Create a contact group for a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
              name: { type: 'string', description: 'Group name' },
            },
            required: ['teammate_id', 'name'],
          },
        },
        {
          name: 'list_team_groups',
          description: 'List contact groups for a team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
            },
            required: ['team_id'],
          },
        },
        {
          name: 'create_team_group',
          description: 'Create a contact group for a team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
              name: { type: 'string', description: 'Group name' },
            },
            required: ['team_id', 'name'],
          },
        },

        // Contact List tools
        {
          name: 'list_contact_lists',
          description: 'List all contact lists',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'create_contact_list',
          description: 'Create a new contact list',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'List name' },
              is_private: { type: 'boolean', description: 'Whether list is private' },
            },
            required: ['name'],
          },
        },
        {
          name: 'delete_contact_list',
          description: 'Delete a contact list',
          inputSchema: {
            type: 'object',
            properties: {
              list_id: { type: 'string', description: 'List ID' },
            },
            required: ['list_id'],
          },
        },
        {
          name: 'list_contact_list_contacts',
          description: 'List contacts in a contact list',
          inputSchema: {
            type: 'object',
            properties: {
              list_id: { type: 'string', description: 'List ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['list_id'],
          },
        },
        {
          name: 'add_contacts_to_list',
          description: 'Add contacts to a contact list',
          inputSchema: {
            type: 'object',
            properties: {
              list_id: { type: 'string', description: 'List ID' },
              contact_ids: { type: 'array', items: { type: 'string' }, description: 'Contact IDs to add' },
            },
            required: ['list_id', 'contact_ids'],
          },
        },
        {
          name: 'remove_contacts_from_list',
          description: 'Remove contacts from a contact list',
          inputSchema: {
            type: 'object',
            properties: {
              list_id: { type: 'string', description: 'List ID' },
              contact_ids: { type: 'array', items: { type: 'string' }, description: 'Contact IDs to remove' },
            },
            required: ['list_id', 'contact_ids'],
          },
        },
        {
          name: 'list_teammate_contact_lists',
          description: 'List contact lists for a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
            },
            required: ['teammate_id'],
          },
        },
        {
          name: 'create_teammate_contact_list',
          description: 'Create a contact list for a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
              name: { type: 'string', description: 'List name' },
            },
            required: ['teammate_id', 'name'],
          },
        },
        {
          name: 'list_team_contact_lists',
          description: 'List contact lists for a team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
            },
            required: ['team_id'],
          },
        },
        {
          name: 'create_team_contact_list',
          description: 'Create a contact list for a team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
              name: { type: 'string', description: 'List name' },
            },
            required: ['team_id', 'name'],
          },
        },

        // Additional Conversation tools
        {
          name: 'create_discussion_conversation',
          description: 'Create a new discussion conversation',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_ids: { type: 'array', items: { type: 'string' }, description: 'Teammate IDs to include' },
              subject: { type: 'string', description: 'Discussion subject' },
              comment_body: { type: 'string', description: 'Initial comment body' },
            },
            required: ['teammate_ids', 'comment_body'],
          },
        },
        {
          name: 'update_conversation_assignee',
          description: 'Update the assignee of a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              assignee_id: { type: 'string', description: 'Teammate ID to assign (null to unassign)' },
            },
            required: ['conversation_id', 'assignee_id'],
          },
        },
        {
          name: 'list_conversation_events',
          description: 'List all events for a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['conversation_id'],
          },
        },
        {
          name: 'list_conversation_followers',
          description: 'List all followers of a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
            },
            required: ['conversation_id'],
          },
        },
        {
          name: 'add_conversation_followers',
          description: 'Add followers to a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              teammate_ids: { type: 'array', items: { type: 'string' }, description: 'Teammate IDs to add as followers' },
            },
            required: ['conversation_id', 'teammate_ids'],
          },
        },
        {
          name: 'delete_conversation_followers',
          description: 'Remove followers from a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              teammate_ids: { type: 'array', items: { type: 'string' }, description: 'Teammate IDs to remove' },
            },
            required: ['conversation_id', 'teammate_ids'],
          },
        },
        {
          name: 'list_conversation_inboxes',
          description: 'List all inboxes associated with a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
            },
            required: ['conversation_id'],
          },
        },
        {
          name: 'add_conversation_link',
          description: 'Add a link to a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              link_ids: { type: 'array', items: { type: 'string' }, description: 'Link IDs to add' },
            },
            required: ['conversation_id', 'link_ids'],
          },
        },
        {
          name: 'remove_conversation_links',
          description: 'Remove links from a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              link_ids: { type: 'array', items: { type: 'string' }, description: 'Link IDs to remove' },
            },
            required: ['conversation_id', 'link_ids'],
          },
        },
        {
          name: 'update_conversation_reminders',
          description: 'Update reminders for a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              scheduled_at: { type: 'number', description: 'Unix timestamp for reminder' },
            },
            required: ['conversation_id'],
          },
        },
        {
          name: 'add_conversation_tag',
          description: 'Add a tag to a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              tag_ids: { type: 'array', items: { type: 'string' }, description: 'Tag IDs to add' },
            },
            required: ['conversation_id', 'tag_ids'],
          },
        },
        {
          name: 'remove_conversation_tag',
          description: 'Remove a tag from a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              tag_ids: { type: 'array', items: { type: 'string' }, description: 'Tag IDs to remove' },
            },
            required: ['conversation_id', 'tag_ids'],
          },
        },

        // Custom Fields tools
        {
          name: 'list_account_custom_fields',
          description: 'List all custom fields for accounts',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_contact_custom_fields',
          description: 'List all custom fields for contacts',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_conversation_custom_fields',
          description: 'List all custom fields for conversations',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_custom_fields',
          description: 'List all custom fields',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_inbox_custom_fields',
          description: 'List all custom fields for inboxes',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_link_custom_fields',
          description: 'List all custom fields for links',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_teammate_custom_fields',
          description: 'List all custom fields for teammates',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },

        // Draft tools
        {
          name: 'create_draft',
          description: 'Create a new draft message',
          inputSchema: {
            type: 'object',
            properties: {
              author_id: { type: 'string', description: 'Teammate ID creating the draft' },
              to: { type: 'array', items: { type: 'string' }, description: 'Recipients' },
              subject: { type: 'string', description: 'Draft subject' },
              body: { type: 'string', description: 'Draft body' },
              channel_id: { type: 'string', description: 'Channel ID' },
            },
            required: ['author_id', 'body'],
          },
        },
        {
          name: 'list_conversation_drafts',
          description: 'List all drafts for a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
            },
            required: ['conversation_id'],
          },
        },
        {
          name: 'create_draft_reply',
          description: 'Create a draft reply to a conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string', description: 'Conversation ID' },
              author_id: { type: 'string', description: 'Teammate ID' },
              body: { type: 'string', description: 'Draft body' },
            },
            required: ['conversation_id', 'author_id', 'body'],
          },
        },
        {
          name: 'delete_draft',
          description: 'Delete a draft',
          inputSchema: {
            type: 'object',
            properties: {
              draft_id: { type: 'string', description: 'Draft ID' },
              version: { type: 'string', description: 'Draft version for conflict prevention' },
            },
            required: ['draft_id', 'version'],
          },
        },
        {
          name: 'edit_draft',
          description: 'Edit an existing draft',
          inputSchema: {
            type: 'object',
            properties: {
              draft_id: { type: 'string', description: 'Draft ID' },
              version: { type: 'string', description: 'Draft version for conflict prevention' },
              body: { type: 'string', description: 'Updated draft body' },
              subject: { type: 'string', description: 'Updated subject' },
            },
            required: ['draft_id', 'version'],
          },
        },

        // Event tools
        {
          name: 'list_events',
          description: 'List events with optional filtering by type, date range, and inbox',
          inputSchema: {
            type: 'object',
            properties: {
              q: { type: 'string', description: 'Query string for filtering events' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'get_event',
          description: 'Get details of a specific event',
          inputSchema: {
            type: 'object',
            properties: {
              event_id: { type: 'string', description: 'Event ID' },
            },
            required: ['event_id'],
          },
        },

        // Additional Inbox tools
        {
          name: 'create_inbox',
          description: 'Create a new inbox',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Inbox name' },
              teammate_ids: { type: 'array', items: { type: 'string' }, description: 'Teammate IDs with access' },
            },
            required: ['name'],
          },
        },
        {
          name: 'list_inbox_channels',
          description: 'List all channels for an inbox',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_id: { type: 'string', description: 'Inbox ID' },
            },
            required: ['inbox_id'],
          },
        },
        {
          name: 'list_inbox_conversations',
          description: 'List all conversations in an inbox',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_id: { type: 'string', description: 'Inbox ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['inbox_id'],
          },
        },
        {
          name: 'list_inbox_access',
          description: 'List all teammates with access to an inbox',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_id: { type: 'string', description: 'Inbox ID' },
            },
            required: ['inbox_id'],
          },
        },
        {
          name: 'add_inbox_access',
          description: 'Grant teammates access to an inbox',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_id: { type: 'string', description: 'Inbox ID' },
              teammate_ids: { type: 'array', items: { type: 'string' }, description: 'Teammate IDs to grant access' },
            },
            required: ['inbox_id', 'teammate_ids'],
          },
        },
        {
          name: 'remove_inbox_access',
          description: 'Remove teammates access from an inbox',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_id: { type: 'string', description: 'Inbox ID' },
              teammate_ids: { type: 'array', items: { type: 'string' }, description: 'Teammate IDs to remove' },
            },
            required: ['inbox_id', 'teammate_ids'],
          },
        },
        {
          name: 'list_team_inboxes',
          description: 'List all inboxes for a team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
            },
            required: ['team_id'],
          },
        },
        {
          name: 'create_team_inbox',
          description: 'Create an inbox for a team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
              name: { type: 'string', description: 'Inbox name' },
            },
            required: ['team_id', 'name'],
          },
        },

        // Additional Message tools
        {
          name: 'receive_custom_message',
          description: 'Receive a custom message on a channel',
          inputSchema: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Channel ID' },
              sender: { type: 'object', description: 'Sender information' },
              body: { type: 'string', description: 'Message body' },
              subject: { type: 'string', description: 'Message subject' },
              metadata: { type: 'object', description: 'Message metadata' },
            },
            required: ['channel_id', 'sender', 'body'],
          },
        },
        {
          name: 'import_message',
          description: 'Import a historical message to an inbox',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_id: { type: 'string', description: 'Inbox ID' },
              sender: { type: 'object', description: 'Sender information' },
              to: { type: 'array', items: { type: 'string' }, description: 'Recipients' },
              body: { type: 'string', description: 'Message body' },
              subject: { type: 'string', description: 'Message subject' },
              created_at: { type: 'number', description: 'Unix timestamp of original message' },
              metadata: { type: 'object', description: 'Message metadata' },
            },
            required: ['inbox_id', 'sender', 'to', 'body', 'created_at'],
          },
        },
        {
          name: 'get_message_seen_status',
          description: 'Get the seen status of a message',
          inputSchema: {
            type: 'object',
            properties: {
              message_id: { type: 'string', description: 'Message ID' },
            },
            required: ['message_id'],
          },
        },
        {
          name: 'mark_message_seen',
          description: 'Mark a message as seen by a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              message_id: { type: 'string', description: 'Message ID' },
            },
            required: ['message_id'],
          },
        },

        // Message Template Folder tools
        {
          name: 'list_message_template_folders',
          description: 'List all message template folders',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'create_message_template_folder',
          description: 'Create a new message template folder',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Folder name' },
              parent_folder_id: { type: 'string', description: 'Parent folder ID (optional)' },
            },
            required: ['name'],
          },
        },
        {
          name: 'get_message_template_folder',
          description: 'Get details of a message template folder',
          inputSchema: {
            type: 'object',
            properties: {
              folder_id: { type: 'string', description: 'Folder ID' },
            },
            required: ['folder_id'],
          },
        },
        {
          name: 'update_message_template_folder',
          description: 'Update a message template folder',
          inputSchema: {
            type: 'object',
            properties: {
              folder_id: { type: 'string', description: 'Folder ID' },
              name: { type: 'string', description: 'Updated folder name' },
            },
            required: ['folder_id', 'name'],
          },
        },
        {
          name: 'delete_message_template_folder',
          description: 'Delete a message template folder',
          inputSchema: {
            type: 'object',
            properties: {
              folder_id: { type: 'string', description: 'Folder ID' },
            },
            required: ['folder_id'],
          },
        },
        {
          name: 'list_child_folders',
          description: 'List child folders of a message template folder',
          inputSchema: {
            type: 'object',
            properties: {
              folder_id: { type: 'string', description: 'Folder ID' },
            },
            required: ['folder_id'],
          },
        },
        {
          name: 'create_child_folder',
          description: 'Create a child folder within a message template folder',
          inputSchema: {
            type: 'object',
            properties: {
              folder_id: { type: 'string', description: 'Parent folder ID' },
              name: { type: 'string', description: 'Child folder name' },
            },
            required: ['folder_id', 'name'],
          },
        },
        {
          name: 'list_teammate_folders',
          description: 'List message template folders for a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
            },
            required: ['teammate_id'],
          },
        },
        {
          name: 'create_teammate_folder',
          description: 'Create a message template folder for a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
              name: { type: 'string', description: 'Folder name' },
            },
            required: ['teammate_id', 'name'],
          },
        },
        {
          name: 'list_team_folders',
          description: 'List message template folders for a team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
            },
            required: ['team_id'],
          },
        },

        // Message Template tools
        {
          name: 'list_message_templates',
          description: 'List all message templates',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
          },
        },
        {
          name: 'create_message_template',
          description: 'Create a new message template',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Template name' },
              subject: { type: 'string', description: 'Template subject' },
              body: { type: 'string', description: 'Template body' },
              folder_id: { type: 'string', description: 'Folder ID (optional)' },
            },
            required: ['name', 'body'],
          },
        },
        {
          name: 'get_message_template',
          description: 'Get details of a message template',
          inputSchema: {
            type: 'object',
            properties: {
              template_id: { type: 'string', description: 'Template ID' },
            },
            required: ['template_id'],
          },
        },
        {
          name: 'update_message_template',
          description: 'Update a message template',
          inputSchema: {
            type: 'object',
            properties: {
              template_id: { type: 'string', description: 'Template ID' },
              name: { type: 'string', description: 'Updated name' },
              subject: { type: 'string', description: 'Updated subject' },
              body: { type: 'string', description: 'Updated body' },
            },
            required: ['template_id'],
          },
        },
        {
          name: 'delete_message_template',
          description: 'Delete a message template',
          inputSchema: {
            type: 'object',
            properties: {
              template_id: { type: 'string', description: 'Template ID' },
            },
            required: ['template_id'],
          },
        },
        {
          name: 'list_child_templates',
          description: 'List child templates of a message template',
          inputSchema: {
            type: 'object',
            properties: {
              template_id: { type: 'string', description: 'Template ID' },
            },
            required: ['template_id'],
          },
        },
        {
          name: 'create_child_template',
          description: 'Create a child template within a message template',
          inputSchema: {
            type: 'object',
            properties: {
              template_id: { type: 'string', description: 'Parent template ID' },
              name: { type: 'string', description: 'Child template name' },
              body: { type: 'string', description: 'Template body' },
            },
            required: ['template_id', 'name', 'body'],
          },
        },

        // Additional Tag tools
        {
          name: 'get_tag',
          description: 'Get details of a specific tag',
          inputSchema: {
            type: 'object',
            properties: {
              tag_id: { type: 'string', description: 'Tag ID' },
            },
            required: ['tag_id'],
          },
        },
        {
          name: 'update_tag',
          description: 'Update a tag',
          inputSchema: {
            type: 'object',
            properties: {
              tag_id: { type: 'string', description: 'Tag ID' },
              name: { type: 'string', description: 'Updated tag name' },
              highlight: { type: 'string', description: 'Updated tag color' },
            },
            required: ['tag_id'],
          },
        },
        {
          name: 'delete_tag',
          description: 'Delete a tag',
          inputSchema: {
            type: 'object',
            properties: {
              tag_id: { type: 'string', description: 'Tag ID' },
            },
            required: ['tag_id'],
          },
        },
        {
          name: 'list_tag_children',
          description: 'List child tags of a tag',
          inputSchema: {
            type: 'object',
            properties: {
              tag_id: { type: 'string', description: 'Tag ID' },
            },
            required: ['tag_id'],
          },
        },
        {
          name: 'create_child_tag',
          description: 'Create a child tag',
          inputSchema: {
            type: 'object',
            properties: {
              tag_id: { type: 'string', description: 'Parent tag ID' },
              name: { type: 'string', description: 'Child tag name' },
              highlight: { type: 'string', description: 'Tag color' },
            },
            required: ['tag_id', 'name'],
          },
        },
        {
          name: 'list_tagged_conversations',
          description: 'List all conversations with a specific tag',
          inputSchema: {
            type: 'object',
            properties: {
              tag_id: { type: 'string', description: 'Tag ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['tag_id'],
          },
        },
        {
          name: 'list_teammate_tags',
          description: 'List tags for a specific teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
            },
            required: ['teammate_id'],
          },
        },
        {
          name: 'create_teammate_tag',
          description: 'Create a tag for a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
              name: { type: 'string', description: 'Tag name' },
              highlight: { type: 'string', description: 'Tag color' },
            },
            required: ['teammate_id', 'name'],
          },
        },
        {
          name: 'list_team_tags',
          description: 'List tags for a specific team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
            },
            required: ['team_id'],
          },
        },
        {
          name: 'create_team_tag',
          description: 'Create a tag for a team',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Team ID' },
              name: { type: 'string', description: 'Tag name' },
              highlight: { type: 'string', description: 'Tag color' },
            },
            required: ['team_id', 'name'],
          },
        },

        // Additional Teammate tools
        {
          name: 'update_teammate',
          description: 'Update a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
              username: { type: 'string', description: 'Updated username' },
              first_name: { type: 'string', description: 'Updated first name' },
              last_name: { type: 'string', description: 'Updated last name' },
              is_available: { type: 'boolean', description: 'Updated availability status' },
            },
            required: ['teammate_id'],
          },
        },
        {
          name: 'list_teammate_conversations',
          description: 'List conversations assigned to a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
              limit: { type: 'number', description: 'Number of results' },
              page_token: { type: 'string', description: 'Pagination token' },
            },
            required: ['teammate_id'],
          },
        },
        {
          name: 'list_teammate_inboxes',
          description: 'List inboxes accessible to a teammate',
          inputSchema: {
            type: 'object',
            properties: {
              teammate_id: { type: 'string', description: 'Teammate ID' },
            },
            required: ['teammate_id'],
          },
        },
      ],
    }));

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'frontapp://conversations/recent',
          name: 'Recent Conversations',
          description: 'Most recently updated conversations',
          mimeType: 'application/json',
        },
        {
          uri: 'frontapp://teammates',
          name: 'Teammates',
          description: 'List of all teammates',
          mimeType: 'application/json',
        },
        {
          uri: 'frontapp://inboxes',
          name: 'Inboxes',
          description: 'List of all inboxes',
          mimeType: 'application/json',
        },
        {
          uri: 'frontapp://tags',
          name: 'Tags',
          description: 'List of all tags',
          mimeType: 'application/json',
        },
      ],
    }));

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri.toString();

      if (uri === 'frontapp://conversations/recent') {
        const response = await this.axiosInstance.get('/conversations', {
          params: { limit: 20 },
        });
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(response.data, null, 2),
          }],
        };
      }

      if (uri === 'frontapp://teammates') {
        const response = await this.axiosInstance.get('/teammates');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(response.data, null, 2),
          }],
        };
      }

      if (uri === 'frontapp://inboxes') {
        const response = await this.axiosInstance.get('/inboxes');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(response.data, null, 2),
          }],
        };
      }

      if (uri === 'frontapp://tags') {
        const response = await this.axiosInstance.get('/tags');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(response.data, null, 2),
          }],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const typedArgs = args as any; // Type assertion for MCP protocol args

      try {
        let result;

        switch (name) {
          // Conversation operations
          case 'list_conversations':
            result = await this.listConversations(typedArgs);
            break;
          case 'get_conversation':
            result = await this.getConversation(typedArgs.conversation_id);
            break;
          case 'search_conversations':
            result = await this.searchConversations(typedArgs.query, typedArgs.limit, typedArgs.page_token);
            break;
          case 'update_conversation':
            result = await this.updateConversation(typedArgs);
            break;

          // Message operations
          case 'list_conversation_messages':
            result = await this.listConversationMessages(typedArgs);
            break;
          case 'get_message':
            result = await this.getMessage(typedArgs.message_id);
            break;
          case 'send_message':
            result = await this.sendMessage(typedArgs);
            break;
          case 'reply_to_conversation':
            result = await this.replyToConversation(typedArgs);
            break;

          // Contact operations
          case 'list_contacts':
            result = await this.listContacts(typedArgs);
            break;
          case 'get_contact':
            result = await this.getContact(typedArgs.contact_id);
            break;
          case 'create_contact':
            result = await this.createContact(typedArgs);
            break;
          case 'update_contact':
            result = await this.updateContact(typedArgs);
            break;

          // Teammate operations
          case 'list_teammates':
            result = await this.listTeammates(typedArgs);
            break;
          case 'get_teammate':
            result = await this.getTeammate(typedArgs.teammate_id);
            break;

          // Tag operations
          case 'list_tags':
            result = await this.listTags(typedArgs);
            break;
          case 'create_tag':
            result = await this.createTag(typedArgs);
            break;

          // Inbox operations
          case 'list_inboxes':
            result = await this.listInboxes(typedArgs);
            break;
          case 'get_inbox':
            result = await this.getInbox(typedArgs.inbox_id);
            break;

          // Comment operations
          case 'list_conversation_comments':
            result = await this.listConversationComments(typedArgs.conversation_id);
            break;
          case 'add_comment':
            result = await this.addComment(typedArgs);
            break;

          // Analytics
          case 'get_analytics':
            result = await this.getAnalytics(typedArgs);
            break;

          // Account operations
          case 'list_accounts':
            result = await this.listAccounts(typedArgs);
            break;
          case 'create_account':
            result = await this.createAccount(typedArgs);
            break;
          case 'get_account':
            result = await this.getAccount(typedArgs.account_id);
            break;
          case 'update_account':
            result = await this.updateAccount(typedArgs);
            break;
          case 'delete_account':
            result = await this.deleteAccount(typedArgs.account_id);
            break;
          case 'list_account_contacts':
            result = await this.listAccountContacts(typedArgs);
            break;
          case 'add_contact_to_account':
            result = await this.addContactToAccount(typedArgs);
            break;
          case 'remove_contact_from_account':
            result = await this.removeContactFromAccount(typedArgs);
            break;

          // Additional Contact operations
          case 'delete_contact':
            result = await this.deleteContact(typedArgs.contact_id);
            break;
          case 'merge_contacts':
            result = await this.mergeContacts(typedArgs);
            break;
          case 'list_contact_conversations':
            result = await this.listContactConversations(typedArgs);
            break;
          case 'list_contact_notes':
            result = await this.listContactNotes(typedArgs.contact_id);
            break;
          case 'add_contact_note':
            result = await this.addContactNote(typedArgs);
            break;
          case 'add_contact_handle':
            result = await this.addContactHandle(typedArgs);
            break;
          case 'delete_contact_handle':
            result = await this.deleteContactHandle(typedArgs);
            break;
          case 'list_teammate_contacts':
            result = await this.listTeammateContacts(typedArgs);
            break;
          case 'create_teammate_contact':
            result = await this.createTeammateContact(typedArgs);
            break;
          case 'list_team_contacts':
            result = await this.listTeamContacts(typedArgs);
            break;

          // Channel operations
          case 'list_channels':
            result = await this.listChannels(typedArgs);
            break;
          case 'create_channel':
            result = await this.createChannel(typedArgs);
            break;
          case 'get_channel':
            result = await this.getChannel(typedArgs.channel_id);
            break;
          case 'update_channel':
            result = await this.updateChannel(typedArgs);
            break;
          case 'validate_channel':
            result = await this.validateChannel(typedArgs.channel_id);
            break;
          case 'list_teammate_channels':
            result = await this.listTeammateChannels(typedArgs.teammate_id);
            break;
          case 'list_team_channels':
            result = await this.listTeamChannels(typedArgs.team_id);
            break;
          case 'sync_inbound_message':
            result = await this.syncInboundMessage(typedArgs);
            break;
          case 'sync_outbound_message':
            result = await this.syncOutboundMessage(typedArgs);
            break;
          case 'update_external_message_status':
            result = await this.updateExternalMessageStatus(typedArgs);
            break;
          case 'sync_application_message_template':
            result = await this.syncApplicationMessageTemplate(typedArgs);
            break;

          // Additional Comment operations
          case 'get_comment':
            result = await this.getComment(typedArgs.comment_id);
            break;
          case 'update_comment':
            result = await this.updateComment(typedArgs);
            break;
          case 'list_comment_mentions':
            result = await this.listCommentMentions(typedArgs.comment_id);
            break;
          case 'add_comment_reply':
            result = await this.addCommentReply(typedArgs);
            break;

          // Contact Group operations
          case 'list_contact_groups':
            result = await this.listContactGroups(typedArgs);
            break;
          case 'create_contact_group':
            result = await this.createContactGroup(typedArgs);
            break;
          case 'delete_contact_group':
            result = await this.deleteContactGroup(typedArgs.group_id);
            break;
          case 'list_group_contacts':
            result = await this.listGroupContacts(typedArgs.group_id);
            break;
          case 'add_contacts_to_group':
            result = await this.addContactsToGroup(typedArgs);
            break;
          case 'remove_contacts_from_group':
            result = await this.removeContactsFromGroup(typedArgs);
            break;
          case 'list_teammate_groups':
            result = await this.listTeammateGroups(typedArgs.teammate_id);
            break;
          case 'create_teammate_group':
            result = await this.createTeammateGroup(typedArgs);
            break;
          case 'list_team_groups':
            result = await this.listTeamGroups(typedArgs.team_id);
            break;
          case 'create_team_group':
            result = await this.createTeamGroup(typedArgs);
            break;

          // Contact List operations
          case 'list_contact_lists':
            result = await this.listContactLists(typedArgs);
            break;
          case 'create_contact_list':
            result = await this.createContactList(typedArgs);
            break;
          case 'delete_contact_list':
            result = await this.deleteContactList(typedArgs.list_id);
            break;
          case 'list_contact_list_contacts':
            result = await this.listContactListContacts(typedArgs);
            break;
          case 'add_contacts_to_list':
            result = await this.addContactsToList(typedArgs);
            break;
          case 'remove_contacts_from_list':
            result = await this.removeContactsFromList(typedArgs);
            break;
          case 'list_teammate_contact_lists':
            result = await this.listTeammateContactLists(typedArgs.teammate_id);
            break;
          case 'create_teammate_contact_list':
            result = await this.createTeammateContactList(typedArgs);
            break;
          case 'list_team_contact_lists':
            result = await this.listTeamContactLists(typedArgs.team_id);
            break;
          case 'create_team_contact_list':
            result = await this.createTeamContactList(typedArgs);
            break;

          // Additional Conversation operations
          case 'create_discussion_conversation':
            result = await this.createDiscussionConversation(typedArgs);
            break;
          case 'update_conversation_assignee':
            result = await this.updateConversationAssignee(typedArgs);
            break;
          case 'list_conversation_events':
            result = await this.listConversationEvents(typedArgs);
            break;
          case 'list_conversation_followers':
            result = await this.listConversationFollowers(typedArgs.conversation_id);
            break;
          case 'add_conversation_followers':
            result = await this.addConversationFollowers(typedArgs);
            break;
          case 'delete_conversation_followers':
            result = await this.deleteConversationFollowers(typedArgs);
            break;
          case 'list_conversation_inboxes':
            result = await this.listConversationInboxes(typedArgs.conversation_id);
            break;
          case 'add_conversation_link':
            result = await this.addConversationLink(typedArgs);
            break;
          case 'remove_conversation_links':
            result = await this.removeConversationLinks(typedArgs);
            break;
          case 'update_conversation_reminders':
            result = await this.updateConversationReminders(typedArgs);
            break;
          case 'add_conversation_tag':
            result = await this.addConversationTag(typedArgs);
            break;
          case 'remove_conversation_tag':
            result = await this.removeConversationTag(typedArgs);
            break;

          // Custom Fields operations
          case 'list_account_custom_fields':
            result = await this.listAccountCustomFields();
            break;
          case 'list_contact_custom_fields':
            result = await this.listContactCustomFields();
            break;
          case 'list_conversation_custom_fields':
            result = await this.listConversationCustomFields();
            break;
          case 'list_custom_fields':
            result = await this.listCustomFields();
            break;
          case 'list_inbox_custom_fields':
            result = await this.listInboxCustomFields();
            break;
          case 'list_link_custom_fields':
            result = await this.listLinkCustomFields();
            break;
          case 'list_teammate_custom_fields':
            result = await this.listTeammateCustomFields();
            break;

          // Draft operations
          case 'create_draft':
            result = await this.createDraft(typedArgs);
            break;
          case 'list_conversation_drafts':
            result = await this.listConversationDrafts(typedArgs.conversation_id);
            break;
          case 'create_draft_reply':
            result = await this.createDraftReply(typedArgs);
            break;
          case 'delete_draft':
            result = await this.deleteDraft(typedArgs);
            break;
          case 'edit_draft':
            result = await this.editDraft(typedArgs);
            break;

          // Event operations
          case 'list_events':
            result = await this.listEvents(typedArgs);
            break;
          case 'get_event':
            result = await this.getEvent(typedArgs.event_id);
            break;

          // Additional Inbox operations
          case 'create_inbox':
            result = await this.createInbox(typedArgs);
            break;
          case 'list_inbox_channels':
            result = await this.listInboxChannels(typedArgs.inbox_id);
            break;
          case 'list_inbox_conversations':
            result = await this.listInboxConversations(typedArgs);
            break;
          case 'list_inbox_access':
            result = await this.listInboxAccess(typedArgs.inbox_id);
            break;
          case 'add_inbox_access':
            result = await this.addInboxAccess(typedArgs);
            break;
          case 'remove_inbox_access':
            result = await this.removeInboxAccess(typedArgs);
            break;
          case 'list_team_inboxes':
            result = await this.listTeamInboxes(typedArgs.team_id);
            break;
          case 'create_team_inbox':
            result = await this.createTeamInbox(typedArgs);
            break;

          // Additional Message operations
          case 'receive_custom_message':
            result = await this.receiveCustomMessage(typedArgs);
            break;
          case 'import_message':
            result = await this.importMessage(typedArgs);
            break;
          case 'get_message_seen_status':
            result = await this.getMessageSeenStatus(typedArgs.message_id);
            break;
          case 'mark_message_seen':
            result = await this.markMessageSeen(typedArgs.message_id);
            break;

          // Message Template Folder operations
          case 'list_message_template_folders':
            result = await this.listMessageTemplateFolders(typedArgs);
            break;
          case 'create_message_template_folder':
            result = await this.createMessageTemplateFolder(typedArgs);
            break;
          case 'get_message_template_folder':
            result = await this.getMessageTemplateFolder(typedArgs.folder_id);
            break;
          case 'update_message_template_folder':
            result = await this.updateMessageTemplateFolder(typedArgs);
            break;
          case 'delete_message_template_folder':
            result = await this.deleteMessageTemplateFolder(typedArgs.folder_id);
            break;
          case 'list_child_folders':
            result = await this.listChildFolders(typedArgs.folder_id);
            break;
          case 'create_child_folder':
            result = await this.createChildFolder(typedArgs);
            break;
          case 'list_teammate_folders':
            result = await this.listTeammateFolders(typedArgs.teammate_id);
            break;
          case 'create_teammate_folder':
            result = await this.createTeammateFolder(typedArgs);
            break;
          case 'list_team_folders':
            result = await this.listTeamFolders(typedArgs.team_id);
            break;

          // Message Template operations
          case 'list_message_templates':
            result = await this.listMessageTemplates(typedArgs);
            break;
          case 'create_message_template':
            result = await this.createMessageTemplate(typedArgs);
            break;
          case 'get_message_template':
            result = await this.getMessageTemplate(typedArgs.template_id);
            break;
          case 'update_message_template':
            result = await this.updateMessageTemplate(typedArgs);
            break;
          case 'delete_message_template':
            result = await this.deleteMessageTemplate(typedArgs.template_id);
            break;
          case 'list_child_templates':
            result = await this.listChildTemplates(typedArgs.template_id);
            break;
          case 'create_child_template':
            result = await this.createChildTemplate(typedArgs);
            break;

          // Additional Tag operations
          case 'get_tag':
            result = await this.getTag(typedArgs.tag_id);
            break;
          case 'update_tag':
            result = await this.updateTag(typedArgs);
            break;
          case 'delete_tag':
            result = await this.deleteTag(typedArgs.tag_id);
            break;
          case 'list_tag_children':
            result = await this.listTagChildren(typedArgs.tag_id);
            break;
          case 'create_child_tag':
            result = await this.createChildTag(typedArgs);
            break;
          case 'list_tagged_conversations':
            result = await this.listTaggedConversations(typedArgs);
            break;
          case 'list_teammate_tags':
            result = await this.listTeammateTags(typedArgs.teammate_id);
            break;
          case 'create_teammate_tag':
            result = await this.createTeammateTag(typedArgs);
            break;
          case 'list_team_tags':
            result = await this.listTeamTags(typedArgs.team_id);
            break;
          case 'create_team_tag':
            result = await this.createTeamTag(typedArgs);
            break;

          // Additional Teammate operations
          case 'update_teammate':
            result = await this.updateTeammate(typedArgs);
            break;
          case 'list_teammate_conversations':
            result = await this.listTeammateConversations(typedArgs);
            break;
          case 'list_teammate_inboxes':
            result = await this.listTeammateInboxes(typedArgs.teammate_id);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    });
  }

  // Conversation methods
  private async listConversations(params: any) {
    const response = await this.axiosInstance.get('/conversations', { params });
    return response.data;
  }

  private async getConversation(conversationId: string) {
    const response = await this.axiosInstance.get(`/conversations/${conversationId}`);
    return response.data;
  }

  private async searchConversations(query: string, limit?: number, pageToken?: string) {
    const encodedQuery = encodeURIComponent(query);
    const response = await this.axiosInstance.get(`/conversations/search/${encodedQuery}`, {
      params: { limit, page_token: pageToken },
    });
    return response.data;
  }

  private async updateConversation(params: any) {
    const { conversation_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/conversations/${conversation_id}`, data);
    return response.data;
  }

  // Message methods
  private async listConversationMessages(params: any) {
    const { conversation_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(
      `/conversations/${conversation_id}/messages`,
      { params: queryParams }
    );
    return response.data;
  }

  private async getMessage(messageId: string) {
    const response = await this.axiosInstance.get(`/messages/${messageId}`);
    return response.data;
  }

  private async sendMessage(params: any) {
    const { channel_id, ...data } = params;
    const response = await this.axiosInstance.post(`/channels/${channel_id}/messages`, data);
    return response.data;
  }

  private async replyToConversation(params: any) {
    const { conversation_id, type, ...data } = params;
    const endpoint = type === 'comment' ? 'comments' : 'messages';
    const response = await this.axiosInstance.post(
      `/conversations/${conversation_id}/${endpoint}`,
      data
    );
    return response.data;
  }

  // Contact methods
  private async listContacts(params: any) {
    const response = await this.axiosInstance.get('/contacts', { params });
    return response.data;
  }

  private async getContact(contactId: string) {
    const response = await this.axiosInstance.get(`/contacts/${contactId}`);
    return response.data;
  }

  private async createContact(params: any) {
    const response = await this.axiosInstance.post('/contacts', params);
    return response.data;
  }

  private async updateContact(params: any) {
    const { contact_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/contacts/${contact_id}`, data);
    return response.data;
  }

  // Teammate methods
  private async listTeammates(params: any) {
    const response = await this.axiosInstance.get('/teammates', { params });
    return response.data;
  }

  private async getTeammate(teammateId: string) {
    const response = await this.axiosInstance.get(`/teammates/${teammateId}`);
    return response.data;
  }

  // Tag methods
  private async listTags(params: any) {
    const response = await this.axiosInstance.get('/tags', { params });
    return response.data;
  }

  private async createTag(params: any) {
    const response = await this.axiosInstance.post('/tags', params);
    return response.data;
  }

  // Inbox methods
  private async listInboxes(params: any) {
    const response = await this.axiosInstance.get('/inboxes', { params });
    return response.data;
  }

  private async getInbox(inboxId: string) {
    const response = await this.axiosInstance.get(`/inboxes/${inboxId}`);
    return response.data;
  }

  // Comment methods
  private async listConversationComments(conversationId: string) {
    const response = await this.axiosInstance.get(`/conversations/${conversationId}/comments`);
    return response.data;
  }

  private async addComment(params: any) {
    const { conversation_id, ...data } = params;
    const response = await this.axiosInstance.post(
      `/conversations/${conversation_id}/comments`,
      data
    );
    return response.data;
  }

  // Analytics methods
  private async getAnalytics(params: any) {
    const { start, end, metrics, filters } = params;
    // Step 1: Create the analytics report
    const createResponse = await this.axiosInstance.post('/analytics/reports', {
      start,
      end,
      metrics,
      filters,
    });
    const reportUid = createResponse.data._links?.self?.match(/reports\/(.+)/)?.[1]
      || createResponse.data.report_uid;
    if (!reportUid) {
      return createResponse.data;
    }
    // Step 2: Poll for the report result (max 10 attempts)
    for (let i = 0; i < 10; i++) {
      const reportResponse = await this.axiosInstance.get(`/analytics/reports/${reportUid}`);
      if (reportResponse.data.status === 'done' || reportResponse.data.metrics) {
        return reportResponse.data;
      }
      if (reportResponse.data.status === 'failed') {
        return { error: 'Analytics report failed', details: reportResponse.data };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return { error: 'Analytics report timed out after 10 seconds' };
  }

  // Account methods
  private async listAccounts(params: any) {
    const response = await this.axiosInstance.get('/accounts', { params });
    return response.data;
  }

  private async createAccount(params: any) {
    const response = await this.axiosInstance.post('/accounts', params);
    return response.data;
  }

  private async getAccount(accountId: string) {
    const response = await this.axiosInstance.get(`/accounts/${accountId}`);
    return response.data;
  }

  private async updateAccount(params: any) {
    const { account_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/accounts/${account_id}`, data);
    return response.data;
  }

  private async deleteAccount(accountId: string) {
    const response = await this.axiosInstance.delete(`/accounts/${accountId}`);
    return response.data;
  }

  private async listAccountContacts(params: any) {
    const { account_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/accounts/${account_id}/contacts`, { params: queryParams });
    return response.data;
  }

  private async addContactToAccount(params: any) {
    const { account_id, contact_ids } = params;
    const response = await this.axiosInstance.post(`/accounts/${account_id}/contacts`, { contact_ids });
    return response.data;
  }

  private async removeContactFromAccount(params: any) {
    const { account_id, contact_ids } = params;
    const response = await this.axiosInstance.delete(`/accounts/${account_id}/contacts`, { data: { contact_ids } });
    return response.data;
  }

  // Additional Contact methods
  private async deleteContact(contactId: string) {
    const response = await this.axiosInstance.delete(`/contacts/${contactId}`);
    return response.data;
  }

  private async mergeContacts(params: any) {
    const { target_contact_id, contact_ids } = params;
    const response = await this.axiosInstance.post('/contacts/merge', {
      target_contact_id,
      contact_ids,
    });
    return response.data;
  }

  private async listContactConversations(params: any) {
    const { contact_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/contacts/${contact_id}/conversations`, { params: queryParams });
    return response.data;
  }

  private async listContactNotes(contactId: string) {
    const response = await this.axiosInstance.get(`/contacts/${contactId}/notes`);
    return response.data;
  }

  private async addContactNote(params: any) {
    const { contact_id, ...data } = params;
    const response = await this.axiosInstance.post(`/contacts/${contact_id}/notes`, data);
    return response.data;
  }

  private async addContactHandle(params: any) {
    const { contact_id, handle, source } = params;
    const response = await this.axiosInstance.post(`/contacts/${contact_id}/handles`, { handle, source });
    return response.data;
  }

  private async deleteContactHandle(params: any) {
    const { contact_id, handle, source } = params;
    const response = await this.axiosInstance.delete(`/contacts/${contact_id}/handles`, {
      data: { handle, source },
    });
    return response.data;
  }

  private async listTeammateContacts(params: any) {
    const { teammate_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/teammates/${teammate_id}/contacts`, { params: queryParams });
    return response.data;
  }

  private async createTeammateContact(params: any) {
    const { teammate_id, ...data } = params;
    const response = await this.axiosInstance.post(`/teammates/${teammate_id}/contacts`, data);
    return response.data;
  }

  private async listTeamContacts(params: any) {
    const { team_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/teams/${team_id}/contacts`, { params: queryParams });
    return response.data;
  }

  // Channel methods
  private async listChannels(params: any) {
    const response = await this.axiosInstance.get('/channels', { params });
    return response.data;
  }

  private async createChannel(params: any) {
    const response = await this.axiosInstance.post('/channels', params);
    return response.data;
  }

  private async getChannel(channelId: string) {
    const response = await this.axiosInstance.get(`/channels/${channelId}`);
    return response.data;
  }

  private async updateChannel(params: any) {
    const { channel_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/channels/${channel_id}`, data);
    return response.data;
  }

  private async validateChannel(channelId: string) {
    const response = await this.axiosInstance.post(`/channels/${channelId}/validate`);
    return response.data;
  }

  private async listTeammateChannels(teammateId: string) {
    const response = await this.axiosInstance.get(`/teammates/${teammateId}/channels`);
    return response.data;
  }

  private async listTeamChannels(teamId: string) {
    const response = await this.axiosInstance.get(`/teams/${teamId}/channels`);
    return response.data;
  }

  private async syncInboundMessage(params: any) {
    const { channel_id, ...data } = params;
    const response = await this.axiosInstance.post(`/channels/${channel_id}/inbound_messages`, data);
    return response.data;
  }

  private async syncOutboundMessage(params: any) {
    const { channel_id, ...data } = params;
    const response = await this.axiosInstance.post(`/channels/${channel_id}/outbound_messages`, data);
    return response.data;
  }

  private async updateExternalMessageStatus(params: any) {
    const { channel_id, message_id, status } = params;
    const response = await this.axiosInstance.put(
      `/channels/${channel_id}/messages/${message_id}/status`,
      { status }
    );
    return response.data;
  }

  private async syncApplicationMessageTemplate(params: any) {
    const { channel_id, template } = params;
    const response = await this.axiosInstance.put(
      `/channels/${channel_id}/application_message_templates`,
      template
    );
    return response.data;
  }

  // Additional Comment methods
  private async getComment(commentId: string) {
    const response = await this.axiosInstance.get(`/comments/${commentId}`);
    return response.data;
  }

  private async updateComment(params: any) {
    const { comment_id, body } = params;
    const response = await this.axiosInstance.patch(`/comments/${comment_id}`, { body });
    return response.data;
  }

  private async listCommentMentions(commentId: string) {
    const response = await this.axiosInstance.get(`/comments/${commentId}/mentions`);
    return response.data;
  }

  private async addCommentReply(params: any) {
    const { comment_id, ...data } = params;
    const response = await this.axiosInstance.post(`/comments/${comment_id}/replies`, data);
    return response.data;
  }

  // Contact Group methods (deprecated)
  private async listContactGroups(params: any) {
    const response = await this.axiosInstance.get('/contact_groups', { params });
    return response.data;
  }

  private async createContactGroup(params: any) {
    const response = await this.axiosInstance.post('/contact_groups', params);
    return response.data;
  }

  private async deleteContactGroup(groupId: string) {
    const response = await this.axiosInstance.delete(`/contact_groups/${groupId}`);
    return response.data;
  }

  private async listGroupContacts(groupId: string) {
    const response = await this.axiosInstance.get(`/contact_groups/${groupId}/contacts`);
    return response.data;
  }

  private async addContactsToGroup(params: any) {
    const { group_id, contact_ids } = params;
    const response = await this.axiosInstance.post(`/contact_groups/${group_id}/contacts`, { contact_ids });
    return response.data;
  }

  private async removeContactsFromGroup(params: any) {
    const { group_id, contact_ids } = params;
    const response = await this.axiosInstance.delete(`/contact_groups/${group_id}/contacts`, {
      data: { contact_ids },
    });
    return response.data;
  }

  private async listTeammateGroups(teammateId: string) {
    const response = await this.axiosInstance.get(`/teammates/${teammateId}/contact_groups`);
    return response.data;
  }

  private async createTeammateGroup(params: any) {
    const { teammate_id, ...data } = params;
    const response = await this.axiosInstance.post(`/teammates/${teammate_id}/contact_groups`, data);
    return response.data;
  }

  private async listTeamGroups(teamId: string) {
    const response = await this.axiosInstance.get(`/teams/${teamId}/contact_groups`);
    return response.data;
  }

  private async createTeamGroup(params: any) {
    const { team_id, ...data } = params;
    const response = await this.axiosInstance.post(`/teams/${team_id}/contact_groups`, data);
    return response.data;
  }

  // Contact List methods
  private async listContactLists(params: any) {
    const response = await this.axiosInstance.get('/contact_lists', { params });
    return response.data;
  }

  private async createContactList(params: any) {
    const response = await this.axiosInstance.post('/contact_lists', params);
    return response.data;
  }

  private async deleteContactList(listId: string) {
    const response = await this.axiosInstance.delete(`/contact_lists/${listId}`);
    return response.data;
  }

  private async listContactListContacts(params: any) {
    const { list_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/contact_lists/${list_id}/contacts`, { params: queryParams });
    return response.data;
  }

  private async addContactsToList(params: any) {
    const { list_id, contact_ids } = params;
    const response = await this.axiosInstance.post(`/contact_lists/${list_id}/contacts`, { contact_ids });
    return response.data;
  }

  private async removeContactsFromList(params: any) {
    const { list_id, contact_ids } = params;
    const response = await this.axiosInstance.delete(`/contact_lists/${list_id}/contacts`, {
      data: { contact_ids },
    });
    return response.data;
  }

  private async listTeammateContactLists(teammateId: string) {
    const response = await this.axiosInstance.get(`/teammates/${teammateId}/contact_lists`);
    return response.data;
  }

  private async createTeammateContactList(params: any) {
    const { teammate_id, ...data } = params;
    const response = await this.axiosInstance.post(`/teammates/${teammate_id}/contact_lists`, data);
    return response.data;
  }

  private async listTeamContactLists(teamId: string) {
    const response = await this.axiosInstance.get(`/teams/${teamId}/contact_lists`);
    return response.data;
  }

  private async createTeamContactList(params: any) {
    const { team_id, ...data } = params;
    const response = await this.axiosInstance.post(`/teams/${team_id}/contact_lists`, data);
    return response.data;
  }

  // Additional Conversation methods
  private async createDiscussionConversation(params: any) {
    const response = await this.axiosInstance.post('/conversations', params);
    return response.data;
  }

  private async updateConversationAssignee(params: any) {
    const { conversation_id, assignee_id } = params;
    const response = await this.axiosInstance.put(`/conversations/${conversation_id}/assignee`, {
      assignee_id,
    });
    return response.data;
  }

  private async listConversationEvents(params: any) {
    const { conversation_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/conversations/${conversation_id}/events`, {
      params: queryParams,
    });
    return response.data;
  }

  private async listConversationFollowers(conversationId: string) {
    const response = await this.axiosInstance.get(`/conversations/${conversationId}/followers`);
    return response.data;
  }

  private async addConversationFollowers(params: any) {
    const { conversation_id, teammate_ids } = params;
    const response = await this.axiosInstance.post(`/conversations/${conversation_id}/followers`, {
      teammate_ids,
    });
    return response.data;
  }

  private async deleteConversationFollowers(params: any) {
    const { conversation_id, teammate_ids } = params;
    const response = await this.axiosInstance.delete(`/conversations/${conversation_id}/followers`, {
      data: { teammate_ids },
    });
    return response.data;
  }

  private async listConversationInboxes(conversationId: string) {
    const response = await this.axiosInstance.get(`/conversations/${conversationId}/inboxes`);
    return response.data;
  }

  private async addConversationLink(params: any) {
    const { conversation_id, link_ids } = params;
    const response = await this.axiosInstance.post(`/conversations/${conversation_id}/links`, { link_ids });
    return response.data;
  }

  private async removeConversationLinks(params: any) {
    const { conversation_id, link_ids } = params;
    const response = await this.axiosInstance.delete(`/conversations/${conversation_id}/links`, {
      data: { link_ids },
    });
    return response.data;
  }

  private async updateConversationReminders(params: any) {
    const { conversation_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/conversations/${conversation_id}/reminders`, data);
    return response.data;
  }

  private async addConversationTag(params: any) {
    const { conversation_id, tag_ids } = params;
    const response = await this.axiosInstance.post(`/conversations/${conversation_id}/tags`, { tag_ids });
    return response.data;
  }

  private async removeConversationTag(params: any) {
    const { conversation_id, tag_ids } = params;
    const response = await this.axiosInstance.delete(`/conversations/${conversation_id}/tags`, {
      data: { tag_ids },
    });
    return response.data;
  }

  // Custom Fields methods
  private async listAccountCustomFields() {
    const response = await this.axiosInstance.get('/accounts/custom_fields');
    return response.data;
  }

  private async listContactCustomFields() {
    const response = await this.axiosInstance.get('/contacts/custom_fields');
    return response.data;
  }

  private async listConversationCustomFields() {
    const response = await this.axiosInstance.get('/conversations/custom_fields');
    return response.data;
  }

  private async listCustomFields() {
    const response = await this.axiosInstance.get('/custom_fields');
    return response.data;
  }

  private async listInboxCustomFields() {
    const response = await this.axiosInstance.get('/inboxes/custom_fields');
    return response.data;
  }

  private async listLinkCustomFields() {
    const response = await this.axiosInstance.get('/links/custom_fields');
    return response.data;
  }

  private async listTeammateCustomFields() {
    const response = await this.axiosInstance.get('/teammates/custom_fields');
    return response.data;
  }

  // Draft methods
  private async createDraft(params: any) {
    const response = await this.axiosInstance.post('/drafts', params);
    return response.data;
  }

  private async listConversationDrafts(conversationId: string) {
    const response = await this.axiosInstance.get(`/conversations/${conversationId}/drafts`);
    return response.data;
  }

  private async createDraftReply(params: any) {
    const { conversation_id, ...data } = params;
    const response = await this.axiosInstance.post(`/conversations/${conversation_id}/drafts`, data);
    return response.data;
  }

  private async deleteDraft(params: any) {
    const { draft_id, version } = params;
    const response = await this.axiosInstance.delete(`/drafts/${draft_id}`, { data: { version } });
    return response.data;
  }

  private async editDraft(params: any) {
    const { draft_id, version, ...data } = params;
    const response = await this.axiosInstance.patch(`/drafts/${draft_id}`, { version, ...data });
    return response.data;
  }

  // Event methods
  private async listEvents(params: any) {
    const response = await this.axiosInstance.get('/events', { params });
    return response.data;
  }

  private async getEvent(eventId: string) {
    const response = await this.axiosInstance.get(`/events/${eventId}`);
    return response.data;
  }

  // Additional Inbox methods
  private async createInbox(params: any) {
    const response = await this.axiosInstance.post('/inboxes', params);
    return response.data;
  }

  private async listInboxChannels(inboxId: string) {
    const response = await this.axiosInstance.get(`/inboxes/${inboxId}/channels`);
    return response.data;
  }

  private async listInboxConversations(params: any) {
    const { inbox_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/inboxes/${inbox_id}/conversations`, {
      params: queryParams,
    });
    return response.data;
  }

  private async listInboxAccess(inboxId: string) {
    const response = await this.axiosInstance.get(`/inboxes/${inboxId}/teammates`);
    return response.data;
  }

  private async addInboxAccess(params: any) {
    const { inbox_id, teammate_ids } = params;
    const response = await this.axiosInstance.post(`/inboxes/${inbox_id}/teammates`, { teammate_ids });
    return response.data;
  }

  private async removeInboxAccess(params: any) {
    const { inbox_id, teammate_ids } = params;
    const response = await this.axiosInstance.delete(`/inboxes/${inbox_id}/teammates`, {
      data: { teammate_ids },
    });
    return response.data;
  }

  private async listTeamInboxes(teamId: string) {
    const response = await this.axiosInstance.get(`/teams/${teamId}/inboxes`);
    return response.data;
  }

  private async createTeamInbox(params: any) {
    const { team_id, ...data } = params;
    const response = await this.axiosInstance.post(`/teams/${team_id}/inboxes`, data);
    return response.data;
  }

  // Additional Message methods
  private async receiveCustomMessage(params: any) {
    const { channel_id, ...data } = params;
    const response = await this.axiosInstance.post(`/channels/${channel_id}/incoming_messages`, data);
    return response.data;
  }

  private async importMessage(params: any) {
    const { inbox_id, ...data } = params;
    const response = await this.axiosInstance.post(`/inboxes/${inbox_id}/imported_messages`, data);
    return response.data;
  }

  private async getMessageSeenStatus(messageId: string) {
    const response = await this.axiosInstance.get(`/messages/${messageId}/seen`);
    return response.data;
  }

  private async markMessageSeen(messageId: string) {
    const response = await this.axiosInstance.post(`/messages/${messageId}/seen`);
    return response.data;
  }

  // Message Template Folder methods
  private async listMessageTemplateFolders(params: any) {
    const response = await this.axiosInstance.get('/message_template_folders', { params });
    return response.data;
  }

  private async createMessageTemplateFolder(params: any) {
    const response = await this.axiosInstance.post('/message_template_folders', params);
    return response.data;
  }

  private async getMessageTemplateFolder(folderId: string) {
    const response = await this.axiosInstance.get(`/message_template_folders/${folderId}`);
    return response.data;
  }

  private async updateMessageTemplateFolder(params: any) {
    const { folder_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/message_template_folders/${folder_id}`, data);
    return response.data;
  }

  private async deleteMessageTemplateFolder(folderId: string) {
    const response = await this.axiosInstance.delete(`/message_template_folders/${folderId}`);
    return response.data;
  }

  private async listChildFolders(folderId: string) {
    const response = await this.axiosInstance.get(`/message_template_folders/${folderId}/children`);
    return response.data;
  }

  private async createChildFolder(params: any) {
    const { folder_id, ...data } = params;
    const response = await this.axiosInstance.post(
      `/message_template_folders/${folder_id}/children`,
      data
    );
    return response.data;
  }

  private async listTeammateFolders(teammateId: string) {
    const response = await this.axiosInstance.get(`/teammates/${teammateId}/message_template_folders`);
    return response.data;
  }

  private async createTeammateFolder(params: any) {
    const { teammate_id, ...data } = params;
    const response = await this.axiosInstance.post(
      `/teammates/${teammate_id}/message_template_folders`,
      data
    );
    return response.data;
  }

  private async listTeamFolders(teamId: string) {
    const response = await this.axiosInstance.get(`/teams/${teamId}/message_template_folders`);
    return response.data;
  }

  // Message Template methods
  private async listMessageTemplates(params: any) {
    const response = await this.axiosInstance.get('/message_templates', { params });
    return response.data;
  }

  private async createMessageTemplate(params: any) {
    const response = await this.axiosInstance.post('/message_templates', params);
    return response.data;
  }

  private async getMessageTemplate(templateId: string) {
    const response = await this.axiosInstance.get(`/message_templates/${templateId}`);
    return response.data;
  }

  private async updateMessageTemplate(params: any) {
    const { template_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/message_templates/${template_id}`, data);
    return response.data;
  }

  private async deleteMessageTemplate(templateId: string) {
    const response = await this.axiosInstance.delete(`/message_templates/${templateId}`);
    return response.data;
  }

  private async listChildTemplates(templateId: string) {
    const response = await this.axiosInstance.get(`/message_templates/${templateId}/children`);
    return response.data;
  }

  private async createChildTemplate(params: any) {
    const { template_id, ...data } = params;
    const response = await this.axiosInstance.post(`/message_templates/${template_id}/children`, data);
    return response.data;
  }

  // Additional Tag methods
  private async getTag(tagId: string) {
    const response = await this.axiosInstance.get(`/tags/${tagId}`);
    return response.data;
  }

  private async updateTag(params: any) {
    const { tag_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/tags/${tag_id}`, data);
    return response.data;
  }

  private async deleteTag(tagId: string) {
    const response = await this.axiosInstance.delete(`/tags/${tagId}`);
    return response.data;
  }

  private async listTagChildren(tagId: string) {
    const response = await this.axiosInstance.get(`/tags/${tagId}/children`);
    return response.data;
  }

  private async createChildTag(params: any) {
    const { tag_id, ...data } = params;
    const response = await this.axiosInstance.post(`/tags/${tag_id}/children`, data);
    return response.data;
  }

  private async listTaggedConversations(params: any) {
    const { tag_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/tags/${tag_id}/conversations`, { params: queryParams });
    return response.data;
  }

  private async listTeammateTags(teammateId: string) {
    const response = await this.axiosInstance.get(`/teammates/${teammateId}/tags`);
    return response.data;
  }

  private async createTeammateTag(params: any) {
    const { teammate_id, ...data } = params;
    const response = await this.axiosInstance.post(`/teammates/${teammate_id}/tags`, data);
    return response.data;
  }

  private async listTeamTags(teamId: string) {
    const response = await this.axiosInstance.get(`/teams/${teamId}/tags`);
    return response.data;
  }

  private async createTeamTag(params: any) {
    const { team_id, ...data } = params;
    const response = await this.axiosInstance.post(`/teams/${team_id}/tags`, data);
    return response.data;
  }

  // Additional Teammate methods
  private async updateTeammate(params: any) {
    const { teammate_id, ...data } = params;
    const response = await this.axiosInstance.patch(`/teammates/${teammate_id}`, data);
    return response.data;
  }

  private async listTeammateConversations(params: any) {
    const { teammate_id, ...queryParams } = params;
    const response = await this.axiosInstance.get(`/teammates/${teammate_id}/conversations`, {
      params: queryParams,
    });
    return response.data;
  }

  private async listTeammateInboxes(teammateId: string) {
    const response = await this.axiosInstance.get(`/teammates/${teammateId}/inboxes`);
    return response.data;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Frontapp MCP server running on stdio');
  }
}

// Main execution
const apiToken = process.env.FRONTAPP_API_TOKEN;

if (!apiToken) {
  console.error('Error: FRONTAPP_API_TOKEN environment variable is required');
  process.exit(1);
}

if (process.env.TRANSPORT_MODE === 'stdio') {
  // Legacy local stdio mode (for Claude Code desktop / Docker wrapper)
  const server = new FrontappMCPServer(apiToken);
  server.run().catch(console.error);
} else {
  // HTTP server mode — default for remote hosting (Render, Railway, Fly.io, etc.)
  const port = parseInt(process.env.PORT || '3000', 10);
  const authToken = process.env.MCP_AUTH_TOKEN;

  const app = express();
  app.use(express.json());

  // CORS headers required by Claude.ai and other remote MCP clients
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health check — used by Render to verify the service is up
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'frontapp-mcp-server', version: '1.0.0' });
  });

  app.get('/', (_req, res) => {
    res.json({
      service: 'Frontapp MCP Server',
      mcp_endpoint: '/mcp',
      auth_required: authToken ? true : false,
    });
  });

  // Optional Bearer token auth — set MCP_AUTH_TOKEN env var to enable
  const checkAuth = (req: any, res: any, next: any) => {
    if (!authToken) return next();
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${authToken}`) {
      res.status(401).json({ error: 'Unauthorized — provide Bearer token in Authorization header' });
      return;
    }
    next();
  };

  // MCP Streamable HTTP endpoint — handles POST (requests) and GET (SSE stream)
  app.all('/mcp', checkAuth, async (req: any, res: any) => {
    try {
      const mcpInstance = new FrontappMCPServer(apiToken);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await mcpInstance.connectTo(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err: any) {
      console.error('MCP request error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.error(`Frontapp MCP server running on port ${port}`);
    console.error(`MCP endpoint: POST http://0.0.0.0:${port}/mcp`);
    console.error(`Auth: ${authToken ? 'Bearer token required (MCP_AUTH_TOKEN set)' : 'open — set MCP_AUTH_TOKEN to protect'}`);
  });
}
