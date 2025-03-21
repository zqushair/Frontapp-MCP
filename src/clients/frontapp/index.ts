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
import logger from '../../utils/logger.js';
import ErrorLogger from '../../utils/errorLogger.js';
import cacheManager from '../../utils/cache.js';

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
  private requestTimeout: number = 30000; // default request timeout in ms (30 seconds)

  constructor() {
    this.client = axios.create({
      baseURL: config.frontapp.baseUrl,
      headers: {
        Authorization: `Bearer ${config.frontapp.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: this.requestTimeout, // Set default request timeout
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      logger.info(`Frontapp API request: ${config.method?.toUpperCase()} ${config.url}`);
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
          ErrorLogger.logClientError(`Frontapp API error`, error, {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
            method: error.config?.method
          });

          // Handle rate limiting (429 Too Many Requests)
          if (error.response.status === 429) {
            // Update rate limit info from headers
            this.updateRateLimitInfo(error.response);

            // Get retry-after header or use default
            const retryAfter = error.response.headers['retry-after'];
            const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : this.rateLimitDelay;

            logger.info(`Rate limit reached, waiting before retrying`, { delayMs });
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
          ErrorLogger.logClientError(`Frontapp API network error - no response received`, error, {
            url: error.config?.url,
            method: error.config?.method
          });
          // Network errors should be retried
          return this.retryRequest(error);
        } else {
          ErrorLogger.logClientError(`Frontapp API error during request creation`, error);
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

        logger.info(`Rate limit status`, {
          remainingRequests,
          timeUntilReset,
          delayMs: this.rateLimitDelay,
          resetTime: new Date(this.rateLimitReset).toISOString()
        });
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
      logger.info(`Retrying failed request`, {
        attempt: retryCount,
        maxRetries: this.maxRetries,
        delayMs: delay,
        url: error.config.url,
        method: error.config.method
      });

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
    logger.info(`Configured retry settings`, {
      maxRetries,
      retryDelayMs: retryDelay
    });
  }

  /**
   * Configure request timeout
   * @param timeout Timeout in milliseconds
   */
  public configureTimeout(timeout: number): void {
    if (timeout <= 0) {
      logger.warn(`Invalid timeout value: ${timeout}ms. Using default: ${this.requestTimeout}ms`);
      return;
    }
    
    this.requestTimeout = timeout;
    
    // Update the default timeout for all future requests
    this.client.defaults.timeout = timeout;
    
    logger.info(`Configured request timeout`, { timeoutMs: timeout });
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
        logger.info(`Applying rate limit delay before request`, { delayMs: this.rateLimitDelay });
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
    // Cache key for tags
    const cacheKey = 'frontapp:tags';
    
    // Try to get from cache first
    const cachedResponse = cacheManager.get<AxiosResponse<FrontappPaginatedResponse<any>>>(cacheKey);
    if (cachedResponse) {
      logger.debug('Using cached tags');
      return cachedResponse;
    }
    
    // If not in cache, fetch from API
    const response = await this.rateLimitedRequest(() => this.client.get('/tags'));
    
    // Cache the response for 1 hour (tags don't change frequently)
    cacheManager.set(cacheKey, response, 60 * 60 * 1000);
    
    return response;
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
    // For requests with params, don't use cache
    if (params && Object.keys(params).length > 0) {
      return this.rateLimitedRequest(() => this.client.get('/inboxes', { params }));
    }
    
    // Cache key for inboxes
    const cacheKey = 'frontapp:inboxes';
    
    // Try to get from cache first
    const cachedResponse = cacheManager.get<AxiosResponse<FrontappPaginatedResponse<any>>>(cacheKey);
    if (cachedResponse) {
      logger.debug('Using cached inboxes');
      return cachedResponse;
    }
    
    // If not in cache, fetch from API
    const response = await this.rateLimitedRequest(() => this.client.get('/inboxes'));
    
    // Cache the response for 1 hour (inboxes don't change frequently)
    cacheManager.set(cacheKey, response, 60 * 60 * 1000);
    
    return response;
  }

  async getInbox(inboxId: string): Promise<AxiosResponse<any>> {
    // Cache key for inbox
    const cacheKey = `frontapp:inbox:${inboxId}`;
    
    // Try to get from cache first
    const cachedResponse = cacheManager.get<AxiosResponse<any>>(cacheKey);
    if (cachedResponse) {
      logger.debug(`Using cached inbox: ${inboxId}`);
      return cachedResponse;
    }
    
    // If not in cache, fetch from API
    const response = await this.rateLimitedRequest(() => this.client.get(`/inboxes/${inboxId}`));
    
    // Cache the response for 1 hour (inbox details don't change frequently)
    cacheManager.set(cacheKey, response, 60 * 60 * 1000);
    
    return response;
  }

  // User methods
  async getTeammates(): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    // Cache key for teammates
    const cacheKey = 'frontapp:teammates';
    
    // Try to get from cache first
    const cachedResponse = cacheManager.get<AxiosResponse<FrontappPaginatedResponse<any>>>(cacheKey);
    if (cachedResponse) {
      logger.debug('Using cached teammates');
      return cachedResponse;
    }
    
    // If not in cache, fetch from API
    const response = await this.rateLimitedRequest(() => this.client.get('/teammates'));
    
    // Cache the response for 1 hour (teammates don't change frequently)
    cacheManager.set(cacheKey, response, 60 * 60 * 1000);
    
    return response;
  }

  async getTeammate(teammateId: string): Promise<AxiosResponse<any>> {
    // Cache key for teammate
    const cacheKey = `frontapp:teammate:${teammateId}`;
    
    // Try to get from cache first
    const cachedResponse = cacheManager.get<AxiosResponse<any>>(cacheKey);
    if (cachedResponse) {
      logger.debug(`Using cached teammate: ${teammateId}`);
      return cachedResponse;
    }
    
    // If not in cache, fetch from API
    const response = await this.rateLimitedRequest(() => this.client.get(`/teammates/${teammateId}`));
    
    // Cache the response for 1 hour (teammate details don't change frequently)
    cacheManager.set(cacheKey, response, 60 * 60 * 1000);
    
    return response;
  }

  // Account methods
  async getAccounts(
    params?: Record<string, any>
  ): Promise<AxiosResponse<FrontappPaginatedResponse<any>>> {
    // For requests with params, don't use cache
    if (params && Object.keys(params).length > 0) {
      return this.rateLimitedRequest(() => this.client.get('/accounts', { params }));
    }
    
    // Cache key for accounts
    const cacheKey = 'frontapp:accounts';
    
    // Try to get from cache first
    const cachedResponse = cacheManager.get<AxiosResponse<FrontappPaginatedResponse<any>>>(cacheKey);
    if (cachedResponse) {
      logger.debug('Using cached accounts');
      return cachedResponse;
    }
    
    // If not in cache, fetch from API
    const response = await this.rateLimitedRequest(() => this.client.get('/accounts'));
    
    // Cache the response for 1 hour (accounts don't change frequently)
    cacheManager.set(cacheKey, response, 60 * 60 * 1000);
    
    return response;
  }

  async getAccount(accountId: string): Promise<AxiosResponse<any>> {
    // Cache key for account
    const cacheKey = `frontapp:account:${accountId}`;
    
    // Try to get from cache first
    const cachedResponse = cacheManager.get<AxiosResponse<any>>(cacheKey);
    if (cachedResponse) {
      logger.debug(`Using cached account: ${accountId}`);
      return cachedResponse;
    }
    
    // If not in cache, fetch from API
    const response = await this.rateLimitedRequest(() => this.client.get(`/accounts/${accountId}`));
    
    // Cache the response for 1 hour (account details don't change frequently)
    cacheManager.set(cacheKey, response, 60 * 60 * 1000);
    
    return response;
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
    // Cache key for webhooks
    const cacheKey = 'frontapp:webhooks';
    
    // Try to get from cache first
    const cachedResponse = cacheManager.get<AxiosResponse<FrontappPaginatedResponse<any>>>(cacheKey);
    if (cachedResponse) {
      logger.debug('Using cached webhooks');
      return cachedResponse;
    }
    
    // If not in cache, fetch from API
    const response = await this.rateLimitedRequest(() => this.client.get('/webhooks'));
    
    // Cache the response for 1 hour (webhooks don't change frequently)
    cacheManager.set(cacheKey, response, 60 * 60 * 1000);
    
    return response;
  }
}

// Export a singleton instance
export const frontappClient = new FrontappClient();
