import axios, { AxiosInstance } from 'axios';

export class FrontappMcpClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, apiKey?: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });
  }

  // Generic method to call any tool
  async callTool(name: string, args: Record<string, any> = {}) {
    try {
      const response = await this.client.post('/tools/call', {
        name,
        arguments: args,
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Tool call failed: ${error.response.data.message || error.message}`);
      }
      throw error;
    }
  }

  // Conversation methods
  async getConversations(
    params: {
      q?: string;
      inbox_id?: string;
      tag_id?: string;
      assignee_id?: string;
      status?: 'open' | 'archived' | 'spam' | 'deleted';
      limit?: number;
      page_token?: string;
    } = {}
  ) {
    return this.callTool('get_conversations', params);
  }

  async getConversation(conversationId: string) {
    return this.callTool('get_conversation', { conversation_id: conversationId });
  }

  async sendMessage(
    conversationId: string,
    content: string,
    options?: {
      author_id?: string;
      subject?: string;
      tags?: string[];
      archive?: boolean;
      draft?: boolean;
    }
  ) {
    return this.callTool('send_message', {
      conversation_id: conversationId,
      content,
      ...options,
    });
  }

  async addComment(conversationId: string, body: string, authorId: string) {
    return this.callTool('add_comment', {
      conversation_id: conversationId,
      body,
      author_id: authorId,
    });
  }

  async archiveConversation(conversationId: string) {
    return this.callTool('archive_conversation', { conversation_id: conversationId });
  }

  async assignConversation(conversationId: string, assigneeId: string) {
    return this.callTool('assign_conversation', {
      conversation_id: conversationId,
      assignee_id: assigneeId,
    });
  }

  // Contact methods
  async getContact(contactId: string) {
    return this.callTool('get_contact', { contact_id: contactId });
  }

  async createContact(data: {
    name?: string;
    description?: string;
    handles: { handle: string; source: string }[];
    links?: { name: string; url: string }[];
    custom_fields?: Record<string, any>;
  }) {
    return this.callTool('create_contact', data);
  }

  async updateContact(
    contactId: string,
    data: {
      name?: string;
      description?: string;
      handles?: { handle: string; source: string }[];
      links?: { name: string; url: string }[];
      custom_fields?: Record<string, any>;
    }
  ) {
    return this.callTool('update_contact', {
      contact_id: contactId,
      ...data,
    });
  }

  // Tag methods
  async getTags(params: { limit?: number; page_token?: string } = {}) {
    return this.callTool('get_tags', params);
  }

  async applyTag(conversationId: string, tagId: string) {
    return this.callTool('apply_tag', {
      conversation_id: conversationId,
      tag_id: tagId,
    });
  }

  async removeTag(conversationId: string, tagId: string) {
    return this.callTool('remove_tag', {
      conversation_id: conversationId,
      tag_id: tagId,
    });
  }

  // Teammate methods
  async getTeammates(params: { limit?: number; page_token?: string } = {}) {
    return this.callTool('get_teammates', params);
  }

  async getTeammate(teammateId: string) {
    return this.callTool('get_teammate', { teammate_id: teammateId });
  }

  // Account methods
  async getAccounts(params: { q?: string; limit?: number; page_token?: string } = {}) {
    return this.callTool('get_accounts', params);
  }

  async getAccount(accountId: string) {
    return this.callTool('get_account', { account_id: accountId });
  }

  async createAccount(data: {
    name: string;
    domains: string[];
    description?: string;
    external_id?: string;
    custom_fields?: Record<string, any>;
  }) {
    return this.callTool('create_account', data);
  }

  async updateAccount(
    accountId: string,
    data: {
      name?: string;
      domains?: string[];
      description?: string;
      external_id?: string;
      custom_fields?: Record<string, any>;
    }
  ) {
    return this.callTool('update_account', {
      account_id: accountId,
      ...data,
    });
  }

  // Inbox methods
  async getInboxes(params: { limit?: number; page_token?: string } = {}) {
    return this.callTool('get_inboxes', params);
  }

  async getInbox(inboxId: string) {
    return this.callTool('get_inbox', { inbox_id: inboxId });
  }

  // Error handling and retries
  setErrorHandler(handler: (error: Error) => void) {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        handler(error);
        return Promise.reject(error);
      }
    );
  }

  // Add retry logic with exponential backoff
  enableRetries(maxRetries = 3, initialDelayMs = 1000) {
    let retryCount = 0;

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Only retry on network errors or 429 (rate limit) or 5xx (server errors)
        if (
          !error.response ||
          error.response.status === 429 ||
          (error.response.status >= 500 && error.response.status < 600)
        ) {
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = initialDelayMs * Math.pow(2, retryCount - 1);
            console.log(`Retrying request (${retryCount}/${maxRetries}) after ${delay}ms`);

            return new Promise((resolve) => {
              setTimeout(() => resolve(this.client(error.config)), delay);
            });
          }
        }

        return Promise.reject(error);
      }
    );
  }
}
