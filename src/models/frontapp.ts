/**
 * Frontapp data models
 * These interfaces represent the structure of data returned by the Frontapp API
 */

import { CustomFields, MetadataFields, WebhookPayloadData } from './customFields.js';

// Common pagination interface for Frontapp API responses
export interface FrontappPagination {
  next?: string;
  prev?: string;
}

// Common links interface for Frontapp API responses
export interface FrontappLinks {
  self: string;
}

// Base interface for paginated Frontapp API responses
export interface FrontappPaginatedResponse<T> {
  _pagination: FrontappPagination;
  _links: FrontappLinks;
  _results: T[];
}

// Conversation status enum
export enum ConversationStatus {
  ARCHIVED = 'archived',
  OPEN = 'open',
  SPAM = 'spam',
  DELETED = 'deleted',
}

// Conversation interface
export interface Conversation {
  id: string;
  subject?: string;
  status: ConversationStatus;
  assignee?: Teammate;
  recipient?: Recipient;
  tags: Tag[];
  last_message?: Message;
  created_at: number;
  is_private: boolean;
  metadata?: MetadataFields;
  _links: {
    self: string;
    related: {
      messages: string;
      comments: string;
      inboxes: string;
      followers: string;
    };
  };
}

// Message interface
export interface Message {
  id: string;
  type: 'email' | 'tweet' | 'facebook' | 'intercom' | 'custom';
  is_inbound: boolean;
  created_at: number;
  blurb: string;
  body: string;
  text: string;
  author: Author;
  recipients: Recipient[];
  attachments: Attachment[];
  metadata?: MetadataFields;
  _links: {
    self: string;
    related: {
      conversation: string;
    };
  };
}

// Comment interface
export interface Comment {
  id: string;
  author: Author;
  body: string;
  posted_at: number;
  _links: {
    self: string;
    related: {
      conversation: string;
      mentions: string;
    };
  };
}

// Author interface
export interface Author {
  id?: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_teammate: boolean;
}

// Recipient interface
export interface Recipient {
  _links?: {
    related: {
      contact?: string;
    };
  };
  handle: string;
  role: 'to' | 'cc' | 'bcc';
}

// Attachment interface
export interface Attachment {
  id: string;
  filename: string;
  url: string;
  content_type: string;
  size: number;
  metadata?: MetadataFields;
}

// Contact interface
export interface Contact {
  id: string;
  name?: string;
  description?: string;
  avatar_url?: string;
  is_spammer: boolean;
  links: ContactLink[];
  handles: ContactHandle[];
  groups: string[];
  custom_fields: CustomFields;
  created_at: number;
  updated_at: number;
  _links: {
    self: string;
    related: {
      notes: string;
      conversations: string;
    };
  };
}

// Contact link interface
export interface ContactLink {
  name: string;
  url: string;
}

// Contact handle interface
export interface ContactHandle {
  handle: string;
  source: string;
}

// Tag interface
export interface Tag {
  id: string;
  name: string;
  highlight: string | null;
  is_private: boolean;
  created_at: number;
  updated_at: number;
  _links: {
    self: string;
    related: {
      conversations: string;
      owner?: string;
    };
  };
}

// Inbox interface
export interface Inbox {
  id: string;
  name: string;
  is_private: boolean;
  address: string;
  send_as: string;
  type: 'smtp' | 'imap' | 'twilio' | 'custom';
  custom_fields: CustomFields;
  teammates: string[];
  _links: {
    self: string;
    related: {
      conversations: string;
      channels: string;
      owner?: string;
    };
  };
}

// Teammate interface
export interface Teammate {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_available: boolean;
  is_blocked: boolean;
  custom_fields: CustomFields;
  _links: {
    self: string;
    related: {
      inboxes: string;
      conversations: string;
    };
  };
}

// Webhook interface
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: number;
  _links: {
    self: string;
  };
}

// Webhook event types
export enum WebhookEventType {
  CONVERSATION_ASSIGNED = 'conversation.assigned',
  CONVERSATION_CREATED = 'conversation.created',
  CONVERSATION_DELETED = 'conversation.deleted',
  CONVERSATION_RESTORED = 'conversation.restored',
  CONVERSATION_TAGGED = 'conversation.tagged',
  CONVERSATION_TRASHED = 'conversation.trashed',
  CONVERSATION_UNASSIGNED = 'conversation.unassigned',
  CONVERSATION_UNTAGGED = 'conversation.untagged',
  INBOUND_MESSAGE = 'inbound.message',
  OUTBOUND_MESSAGE = 'outbound.message',
  OUTBOUND_REPLY = 'outbound.reply',
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  COMMENT_CREATED = 'comment.created',
  COMMENT_MENTION = 'comment.mention',
  CONTACT_CREATED = 'contact.created',
  CONTACT_UPDATED = 'contact.updated',
}

// Account interface
export interface Account {
  id: string;
  name: string;
  description?: string;
  domains: string[];
  external_id?: string;
  custom_fields: CustomFields;
  created_at: number;
  updated_at: number;
  _links: {
    self: string;
    related: {
      contacts: string;
      conversations: string;
      owner?: string;
    };
  };
}

// Webhook payload interface
export interface WebhookPayload {
  type: WebhookEventType;
  payload: WebhookPayloadData;
  _links: {
    self: string;
  };
}
