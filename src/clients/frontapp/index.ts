import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
  AxiosRequestHeaders,
} from 'axios';
import { config } from '../../config/index.js';
import { setTimeout } from 'timers/promises';

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
  private rateLimitDelay: number = 0; // ms to wait before next request
  private rateLimitReset: number = 0; // timestamp when rate limit resets
  private maxRetries: number = 3; // maximum number of retries
  private retryDelay: number = 1000; // initial retry delay in ms

  constructor() {
    this.client = axios.create({
      baseURL: config.frontapp.baseUrl,
      headers: {
        Authorization: `Bearer ${config.frontapp.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      console.log(`[Frontapp API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for error handling, rate limiting, and retries
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Check for rate limit headers
        this.updateRateLimitInfo(response);
        return response;
      },
      async (error: AxiosError) => {
        // Log the error
        if (error.response) {
          console.error(
            `[Frontapp API Error] Status: ${error.response.status}, Message: ${JSON.stringify(error.response.data)}`
          );

          // Handle rate limiting (429 Too Many Requests)
          if (error.response.status === 429) {
            // Update rate limit info from headers
            this.updateRateLimitInfo(error.response);

            // Get retry-after header or use default
            const retryAfter = error.response.headers['retry-after'];
            const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : this.rateLimitDelay;

            console.log(`[Rate Limit] Waiting for ${delayMs}ms before retrying`);
            await setTimeout(delayMs);

            // Retry the request
            if (error.config) {
              return this.client(error.config);
            }
          }

          // Handle server errors (5xx) with retry logic
          if (error.response.status >= 500 && error.response.status < 600) {
            return this.retryRequest(error);
          }
        } else if (error.request) {
          console.error(`[Frontapp API Error] No response received: ${error.message}`);
          // Network errors should be retried
          return this.retryRequest(error);
        } else {
          console.error(`[Frontapp API Error] ${error.message}`);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Update rate limit information from response headers
   * @param response The Axios response
   */
  private updateRateLimitInfo(response: AxiosResponse): void {
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];

    if (remaining && reset) {
      const remainingRequests = parseInt(remaining);
      const resetTime = parseInt(reset) * 1000; // Convert to milliseconds

      // If we're running low on requests, calculate delay to spread remaining requests
      if (remainingRequests < 10) {
        const now = Date.now();
        const timeUntilReset = Math.max(0, resetTime - now);
        this.rateLimitDelay = Math.ceil(timeUntilReset / (remainingRequests + 1));
        this.rateLimitReset = resetTime;

        console.log(
          `[Rate Limit] ${remainingRequests} requests remaining, reset in ${timeUntilReset}ms, delay set to ${this.rateLimitDelay}ms`
        );
      }
    }
  }

  /**
   * Retry a failed request with exponential backoff
   * @param error The Axios error
   * @returns A promise that resolves to the retried request
   */
  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    if (!error.config) {
      return Promise.reject(error);
    }

    let retryCount = error.config.headers?.['x-retry-count']
      ? parseInt(error.config.headers['x-retry-count'] as string)
      : 0;

    if (retryCount < this.maxRetries) {
      retryCount++;

      // Calculate delay with exponential backoff
      const delay = this.retryDelay * Math.pow(2, retryCount - 1);
      console.log(`[Retry] Attempt ${retryCount}/${this.maxRetries} after ${delay}ms`);

      // Wait before retrying
      await setTimeout(delay);

      // Update retry count in headers
      if (!error.config.headers) {
        error.config.headers = {} as AxiosRequestHeaders;
      }
      error.config.headers['x-retry-count'] = retryCount.toString();

      // Retry the request
      return this.client(error.config);
    }

    // Max retries reached, reject with original error
    return Promise.reject(error);
  }

  /**
   * Configure rate limiting and retry settings
   * @param maxRetries Maximum number of retries for failed requests
   * @param retryDelay Initial delay between retries in milliseconds
   */
  public configureRetries(maxRetries: number = 3, retryDelay: number = 1000): void {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    console.log(`[Config] Retries configured: max=${maxRetries}, delay=${retryDelay}ms`);
  }

  /**
   * Make a rate-limited request
   * This method ensures we respect rate limits by adding delays when necessary
   * @param requestFn Function that makes the actual request
   * @returns The response from the request
   */
  private async rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // If we have a rate limit delay, wait before making the request
    if (this.rateLimitDelay > 0) {
      const now = Date.now();

      // If the rate limit has reset, clear the delay
      if (now > this.rateLimitReset) {
        this.rateLimitDelay = 0;
      } else {
        console.log(`[Rate Limit] Waiting for ${this.rateLimitDelay}ms before request`);
        await setTimeout(this.rateLimitDelay);
      }
    }

    // Make the request
    return requestFn();
  }

  // Conversation methods
  async getConversations(
    params?: Record<string, any>
  ): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.rateLimitedRequest(() => this.client.get('/conversations', { params }));
  }

  async getConversation(conversationId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.get(`/conversations/${conversationId}`));
  }

  async getConversationMessages(
    conversationId: string
  ): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.rateLimitedRequest(() =>
      this.client.get(`/conversations/${conversationId}/messages`)
    );
  }

  async sendMessage(conversationId: string, data: any): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() =>
      this.client.post(`/conversations/${conversationId}/messages`, data)
    );
  }

  async addComment(
    conversationId: string,
    data: { author_id: string; body: string }
  ): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() =>
      this.client.post(`/conversations/${conversationId}/comments`, data)
    );
  }

  async archiveConversation(conversationId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() =>
      this.client.patch(`/conversations/${conversationId}`, { archived: true })
    );
  }

  async unarchiveConversation(conversationId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() =>
      this.client.patch(`/conversations/${conversationId}`, { archived: false })
    );
  }

  async assignConversation(
    conversationId: string,
    assigneeId: string
  ): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() =>
      this.client.patch(`/conversations/${conversationId}`, { assignee_id: assigneeId })
    );
  }

  // Contact methods
  async getContacts(
    params?: Record<string, any>
  ): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.rateLimitedRequest(() => this.client.get('/contacts', { params }));
  }

  async getContact(contactId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.get(`/contacts/${contactId}`));
  }

  async createContact(data: any): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.post('/contacts', data));
  }

  async updateContact(contactId: string, data: any): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.patch(`/contacts/${contactId}`, data));
  }

  // Tag methods
  async getTags(): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.rateLimitedRequest(() => this.client.get('/tags'));
  }

  async applyTag(conversationId: string, tagId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() =>
      this.client.post(`/conversations/${conversationId}/tags`, { tag_ids: [tagId] })
    );
  }

  async removeTag(conversationId: string, tagId: string): Promise<AxiosResponse<any>> {
    // The Frontapp API uses a different endpoint for removing tags
    return this.rateLimitedRequest(() =>
      this.client.delete(`/conversations/${conversationId}/tags`, {
        data: { tag_ids: [tagId] },
      })
    );
  }

  // Inbox methods
  async getInboxes(
    params?: Record<string, any>
  ): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.rateLimitedRequest(() => this.client.get('/inboxes', { params }));
  }

  async getInbox(inboxId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.get(`/inboxes/${inboxId}`));
  }

  // User methods
  async getTeammates(): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.rateLimitedRequest(() => this.client.get('/teammates'));
  }

  async getTeammate(teammateId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.get(`/teammates/${teammateId}`));
  }

  // Account methods
  async getAccounts(
    params?: Record<string, any>
  ): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.rateLimitedRequest(() => this.client.get('/accounts', { params }));
  }

  async getAccount(accountId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.get(`/accounts/${accountId}`));
  }

  async createAccount(data: any): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.post('/accounts', data));
  }

  async updateAccount(accountId: string, data: any): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.patch(`/accounts/${accountId}`, data));
  }

  // Webhook methods
  async subscribeWebhook(events: string[], url: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() =>
      this.client.post('/webhooks', {
        url,
        events,
      })
    );
  }

  async unsubscribeWebhook(webhookId: string): Promise<AxiosResponse<any>> {
    return this.rateLimitedRequest(() => this.client.delete(`/webhooks/${webhookId}`));
  }

  async listWebhooks(): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    return this.rateLimitedRequest(() => this.client.get('/webhooks'));
  }
}

// Export a singleton instance
export const frontappClient = new FrontappClient();
