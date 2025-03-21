import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Rate Limiting Middleware
 * This middleware limits the number of requests a client can make in a given time window
 */
export class RateLimitingMiddleware {
  /**
   * Create a rate limiter middleware
   * @param options Rate limiting options
   * @returns A rate limiter middleware
   */
  public static createRateLimiter(options?: {
    windowMs?: number;
    max?: number;
    message?: string;
    statusCode?: number;
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request, res: Response) => boolean;
  }) {
    // Get rate limiting configuration from environment variables or use defaults
    const windowMs = options?.windowMs || config.security.rateLimiting.windowMs || 60 * 1000; // 1 minute
    const max = options?.max || config.security.rateLimiting.max || 100; // 100 requests per minute
    const message = options?.message || 'Too many requests, please try again later.';
    const statusCode = options?.statusCode || 429; // Too Many Requests

    // Create a rate limiter
    const limiter = rateLimit({
      windowMs,
      max,
      message,
      statusCode,
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      keyGenerator: options?.keyGenerator || ((req) => {
        // Use IP address as the default key
        return req.ip || 'unknown';
      }),
      skip: options?.skip,
      handler: (req: Request, res: Response, next: NextFunction, options: any) => {
        // Log rate limit exceeded
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          windowMs,
          max,
        });

        // Send rate limit exceeded response
        res.status(options.statusCode).send(options.message);
      },
    });

    return limiter;
  }

  /**
   * Create a rate limiter middleware for API endpoints
   * @returns A rate limiter middleware for API endpoints
   */
  public static createApiRateLimiter() {
    return RateLimitingMiddleware.createRateLimiter({
      windowMs: config.security.rateLimiting.api?.windowMs || 60 * 1000, // 1 minute
      max: config.security.rateLimiting.api?.max || 100, // 100 requests per minute
      message: 'Too many API requests, please try again later.',
    });
  }

  /**
   * Create a rate limiter middleware for authentication endpoints
   * @returns A rate limiter middleware for authentication endpoints
   */
  public static createAuthRateLimiter() {
    return RateLimitingMiddleware.createRateLimiter({
      windowMs: config.security.rateLimiting.auth?.windowMs || 15 * 60 * 1000, // 15 minutes
      max: config.security.rateLimiting.auth?.max || 5, // 5 requests per 15 minutes
      message: 'Too many authentication attempts, please try again later.',
    });
  }

  /**
   * Create a rate limiter middleware for webhook endpoints
   * @returns A rate limiter middleware for webhook endpoints
   */
  public static createWebhookRateLimiter() {
    return RateLimitingMiddleware.createRateLimiter({
      windowMs: config.security.rateLimiting.webhook?.windowMs || 60 * 1000, // 1 minute
      max: config.security.rateLimiting.webhook?.max || 200, // 200 requests per minute
      message: 'Too many webhook requests, please try again later.',
    });
  }

  /**
   * Create a rate limiter middleware for a specific IP address
   * @param ip The IP address to limit
   * @param options Rate limiting options
   * @returns A rate limiter middleware for the specified IP address
   */
  public static createIpRateLimiter(
    ip: string,
    options?: {
      windowMs?: number;
      max?: number;
      message?: string;
      statusCode?: number;
    }
  ) {
    return RateLimitingMiddleware.createRateLimiter({
      ...options,
      keyGenerator: () => ip,
      skip: (req) => req.ip !== ip,
    });
  }
}

// Export the middleware
export default RateLimitingMiddleware;
