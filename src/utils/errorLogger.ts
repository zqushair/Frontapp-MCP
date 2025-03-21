import logger from './logger.js';

/**
 * Error logging utility
 * This utility provides standardized error logging functions for different components
 */
export class ErrorLogger {
  /**
   * Log an API error
   * @param message Error message
   * @param error Error object or message
   * @param context Additional context information
   */
  public static logApiError(message: string, error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`API Error: ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    });
  }

  /**
   * Log a client error (e.g., Frontapp API client)
   * @param message Error message
   * @param error Error object or message
   * @param context Additional context information
   */
  public static logClientError(message: string, error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Client Error: ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    });
  }

  /**
   * Log a webhook error
   * @param message Error message
   * @param error Error object or message
   * @param context Additional context information
   */
  public static logWebhookError(message: string, error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Webhook Error: ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    });
  }

  /**
   * Log a validation error
   * @param message Error message
   * @param errors Validation errors
   * @param context Additional context information
   */
  public static logValidationError(message: string, errors: string[], context?: Record<string, any>): void {
    logger.error(`Validation Error: ${message}`, {
      errors,
      ...context,
    });
  }

  /**
   * Log a security error
   * @param message Error message
   * @param error Error object or message
   * @param context Additional context information
   */
  public static logSecurityError(message: string, error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Security Error: ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    });
  }

  /**
   * Log a configuration error
   * @param message Error message
   * @param error Error object or message
   * @param context Additional context information
   */
  public static logConfigError(message: string, error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Configuration Error: ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    });
  }

  /**
   * Log a database error
   * @param message Error message
   * @param error Error object or message
   * @param context Additional context information
   */
  public static logDatabaseError(message: string, error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Database Error: ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    });
  }

  /**
   * Log a system error
   * @param message Error message
   * @param error Error object or message
   * @param context Additional context information
   */
  public static logSystemError(message: string, error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`System Error: ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    });
  }

  /**
   * Log an unknown error
   * @param message Error message
   * @param error Error object or message
   * @param context Additional context information
   */
  public static logUnknownError(message: string, error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Unknown Error: ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    });
  }
}

// Export a singleton instance
export const errorLogger = new ErrorLogger();

// Export default
export default ErrorLogger;
