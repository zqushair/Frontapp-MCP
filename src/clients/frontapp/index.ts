import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../../config/index.js';

// Define types for Frontapp API responses
export interface FrontappPaginatedResponse<T> {
  _pagination: {
    next?: string;
  };
  _links: {
    self: string;
  };
  _results: T[];
}

export class FrontappClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: config.frontapp.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.frontapp.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      console.log(`[Frontapp API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: any) => {
        if (error.response) {
          console.error(`[Frontapp API Error] Status: ${error.response.status}, Message: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          console.error(`[Frontapp API Error] No response received: ${error.message}`);
        } else {
          console.error(`[Frontapp API Error] ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }
  
  // Conversation methods
  async getConversations(params?: Record<string, any>): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.client.get('/conversations', { params });
  }
  
  async getConversation(conversationId: string): Promise<AxiosResponse<any>> {
    return this.client.get(`/conversations/${conversationId}`);
  }
  
  async getConversationMessages(conversationId: string): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.client.get(`/conversations/${conversationId}/messages`);
  }
  
  async sendMessage(conversationId: string, data: any): Promise<AxiosResponse<any>> {
    return this.client.post(`/conversations/${conversationId}/messages`, data);
  }
  
  async addComment(conversationId: string, data: { author_id: string; body: string }): Promise<AxiosResponse<any>> {
    return this.client.post(`/conversations/${conversationId}/comments`, data);
  }
  
  async archiveConversation(conversationId: string): Promise<AxiosResponse<any>> {
    return this.client.patch(`/conversations/${conversationId}`, { archived: true });
  }
  
  async unarchiveConversation(conversationId: string): Promise<AxiosResponse<any>> {
    return this.client.patch(`/conversations/${conversationId}`, { archived: false });
  }
  
  async assignConversation(conversationId: string, assigneeId: string): Promise<AxiosResponse<any>> {
    return this.client.patch(`/conversations/${conversationId}`, { assignee_id: assigneeId });
  }
  
  // Contact methods
  async getContacts(params?: Record<string, any>): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.client.get('/contacts', { params });
  }
  
  async getContact(contactId: string): Promise<AxiosResponse<any>> {
    return this.client.get(`/contacts/${contactId}`);
  }
  
  async createContact(data: any): Promise<AxiosResponse<any>> {
    return this.client.post('/contacts', data);
  }
  
  async updateContact(contactId: string, data: any): Promise<AxiosResponse<any>> {
    return this.client.patch(`/contacts/${contactId}`, data);
  }
  
  // Tag methods
  async getTags(): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.client.get('/tags');
  }
  
  async applyTag(conversationId: string, tagId: string): Promise<AxiosResponse<any>> {
    return this.client.post(`/conversations/${conversationId}/tags`, { tag_ids: [tagId] });
  }
  
  async removeTag(conversationId: string, tagId: string): Promise<AxiosResponse<any>> {
    // The Frontapp API uses a different endpoint for removing tags
    return this.client.delete(`/conversations/${conversationId}/tags`, {
      data: { tag_ids: [tagId] }
    });
  }
  
  // Inbox methods
  async getInboxes(): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.client.get('/inboxes');
  }
  
  async getInbox(inboxId: string): Promise<AxiosResponse<any>> {
    return this.client.get(`/inboxes/${inboxId}`);
  }
  
  // User methods
  async getTeammates(): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.client.get('/teammates');
  }
  
  async getTeammate(teammateId: string): Promise<AxiosResponse<any>> {
    return this.client.get(`/teammates/${teammateId}`);
  }
  
  // Account methods
  async getAccounts(params?: Record<string, any>): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.client.get('/accounts', { params });
  }
  
  async getAccount(accountId: string): Promise<AxiosResponse<any>> {
    return this.client.get(`/accounts/${accountId}`);
  }
  
  async createAccount(data: any): Promise<AxiosResponse<any>> {
    return this.client.post('/accounts', data);
  }
  
  async updateAccount(accountId: string, data: any): Promise<AxiosResponse<any>> {
    return this.client.patch(`/accounts/${accountId}`, data);
  }
  
  // Webhook methods
  async subscribeWebhook(events: string[], url: string): Promise<AxiosResponse<any>> {
    return this.client.post('/webhooks', {
      url,
      events,
    });
  }
  
  async unsubscribeWebhook(webhookId: string): Promise<AxiosResponse<any>> {
    return this.client.delete(`/webhooks/${webhookId}`);
  }
  
  async listWebhooks(): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.client.get('/webhooks');
  }
}

// Export a singleton instance
export const frontappClient = new FrontappClient();
