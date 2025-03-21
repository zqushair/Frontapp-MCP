import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import logger from './logger.js';
import ErrorLogger from './errorLogger.js';

/**
 * Retry configuration for webhook handlers
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay between retries in milliseconds */
  initialDelay: number;
  /** Whether to use exponential backoff for retries */
  useExponentialBackoff: boolean;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** List of error types that should be retried */
  retryableErrors: string[];
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  useExponentialBackoff: true,
  maxDelay: 60000, // 1 minute
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'EAI_AGAIN',
    'socket hang up',
    'socket timeout',
    'timeout',
    'network error',
    'Network Error',
    'read ECONNRESET',
    'getaddrinfo ENOTFOUND',
    '429', // Too Many Requests
    '500', // Internal Server Error
    '502', // Bad Gateway
    '503', // Service Unavailable
    '504', // Gateway Timeout
  ],
};

/**
 * Webhook retry manager
 * This utility provides retry functionality for webhook handlers
 */
export class WebhookRetryManager {
  private config: RetryConfig;

  /**
   * Create a new webhook retry manager
   * @param config Retry configuration
   */
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
    };
  }

  /**
   * Execute a function with retry logic
   * @param fn The function to execute
   * @param webhookType The type of webhook
   * @param webhookId The ID of the webhook
   * @returns The result of the function
   * @throws The error from the function if it fails after all retries
   */
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    webhookType: string,
    webhookId: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        // If this is a retry attempt, log it
        if (attempt > 0) {
          logger.info(`Retrying webhook processing`, {
            webhookType,
            webhookId,
            attempt,
            maxRetries: this.config.maxRetries,
          });
        }

        // Execute the function
        return await fn();
      } catch (error: any) {
        lastError = error;
        attempt++;

        // Check if we've reached the maximum number of retries
        if (attempt > this.config.maxRetries) {
          ErrorLogger.logWebhookError(
            `Failed to process webhook after ${this.config.maxRetries} retries`,
            error,
            {
              webhookType,
              webhookId,
              attempts: attempt,
            }
          );
          break;
        }

        // Check if the error is retryable
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable) {
          ErrorLogger.logWebhookError(`Non-retryable error processing webhook`, error, {
            webhookType,
            webhookId,
            attempt,
          });
          break;
        }

        // Calculate the delay for the next retry
        const delay = this.calculateDelay(attempt);

        // Log the retry
        logger.warn(`Error processing webhook, will retry`, {
          webhookType,
          webhookId,
          attempt,
          maxRetries: this.config.maxRetries,
          delayMs: delay,
          error: error.message,
        });

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we've reached this point, all retries have failed
    throw lastError || new Error('Unknown error');
  }

  /**
   * Check if an error is retryable
   * @param error The error to check
   * @returns Whether the error is retryable
   */
  private isRetryableError(error: any): boolean {
    // If the error has a code, check if it's in the list of retryable errors
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }

    // If the error has a status, check if it's in the list of retryable errors
    if (error.status && this.config.retryableErrors.includes(error.status.toString())) {
      return true;
    }

    // If the error has a response with a status, check if it's in the list of retryable errors
    if (
      error.response &&
      error.response.status &&
      this.config.retryableErrors.includes(error.response.status.toString())
    ) {
      return true;
    }

    // If the error message contains a retryable error string
    for (const retryableError of this.config.retryableErrors) {
      if (error.message && error.message.includes(retryableError)) {
        return true;
      }
    }

    // Default to not retryable
    return false;
  }

  /**
   * Calculate the delay for a retry attempt
   * @param attempt The current attempt number (1-based)
   * @returns The delay in milliseconds
   */
  private calculateDelay(attempt: number): number {
    if (this.config.useExponentialBackoff) {
      // Calculate delay with exponential backoff: initialDelay * 2^(attempt-1)
      const delay = this.config.initialDelay * Math.pow(2, attempt - 1);
      // Add jitter to prevent thundering herd problem (±10%)
      const jitter = delay * 0.1 * (Math.random() * 2 - 1);
      // Ensure the delay doesn't exceed the maximum
      return Math.min(delay + jitter, this.config.maxDelay);
    } else {
      // Use a fixed delay
      return this.config.initialDelay;
    }
  }
}

// Export a singleton instance with default configuration
export const webhookRetryManager = new WebhookRetryManager();

// Export default
export default webhookRetryManager;
