import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { RateLimitingMiddleware } from '../../src/middleware/rateLimiting.js';
import { config } from '../../src/config/index.js';
import logger from '../../src/utils/logger.js';

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((options: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      // Call the handler if provided
      if (options.handler) {
        options.handler(req, res, next, options);
      } else {
        next();
      }
    };
  });
});

// Mock config
jest.mock('../../src/config/index.js', () => ({
  config: {
    security: {
      rateLimiting: {
        enabled: true,
        windowMs: 60000,
        max: 100,
        api: {
          windowMs: 60000,
          max: 100,
        },
        auth: {
          windowMs: 900000,
          max: 5,
        },
        webhook: {
          windowMs: 60000,
          max: 200,
        },
      },
    },
  },
}));

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Rate Limiting Middleware', () => {
  // Create mock request, response, and next function
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock request, response, and next function
    mockRequest = {
      ip: '127.0.0.1',
      path: '/test',
      method: 'GET',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      send: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter middleware with default options', () => {
      // Create a rate limiter middleware
      const rateLimiter = RateLimitingMiddleware.createRateLimiter();

      // Call the middleware
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });

    it('should create a rate limiter middleware with custom options', () => {
      // Create a rate limiter middleware with custom options
      const rateLimiter = RateLimitingMiddleware.createRateLimiter({
        windowMs: 30000,
        max: 50,
        message: 'Custom rate limit message',
        statusCode: 429,
      });

      // Call the middleware
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log rate limit exceeded and send an error response', () => {
      // Create a rate limiter middleware
      const rateLimiter = RateLimitingMiddleware.createRateLimiter();

      // Get the handler function
      const rateLimit = require('express-rate-limit');
      const handler = rateLimit.mock.calls[0][0].handler;

      // Call the handler
      handler(mockRequest as Request, mockResponse as Response, mockNext as NextFunction, {
        statusCode: 429,
        message: 'Too many requests',
      });

      // Check that logger.warn was called with the correct arguments
      expect(logger.warn).toHaveBeenCalledWith('Rate limit exceeded', {
        ip: '127.0.0.1',
        path: '/test',
        method: 'GET',
        windowMs: 60000,
        max: 100,
      });

      // Check that status and send were called with the correct arguments
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.send).toHaveBeenCalledWith('Too many requests');
    });
  });

  describe('createApiRateLimiter', () => {
    it('should create a rate limiter middleware for API endpoints', () => {
      // Create a rate limiter middleware for API endpoints
      const rateLimiter = RateLimitingMiddleware.createApiRateLimiter();

      // Call the middleware
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createAuthRateLimiter', () => {
    it('should create a rate limiter middleware for authentication endpoints', () => {
      // Create a rate limiter middleware for authentication endpoints
      const rateLimiter = RateLimitingMiddleware.createAuthRateLimiter();

      // Call the middleware
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createWebhookRateLimiter', () => {
    it('should create a rate limiter middleware for webhook endpoints', () => {
      // Create a rate limiter middleware for webhook endpoints
      const rateLimiter = RateLimitingMiddleware.createWebhookRateLimiter();

      // Call the middleware
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createIpRateLimiter', () => {
    it('should create a rate limiter middleware for a specific IP address', () => {
      // Create a rate limiter middleware for a specific IP address
      const rateLimiter = RateLimitingMiddleware.createIpRateLimiter('127.0.0.1');

      // Call the middleware
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip rate limiting for other IP addresses', () => {
      // Create a rate limiter middleware for a specific IP address
      const rateLimiter = RateLimitingMiddleware.createIpRateLimiter('192.168.1.1');

      // Call the middleware
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });

    it('should create a rate limiter middleware for a specific IP address with custom options', () => {
      // Create a rate limiter middleware for a specific IP address with custom options
      const rateLimiter = RateLimitingMiddleware.createIpRateLimiter('127.0.0.1', {
        windowMs: 30000,
        max: 50,
        message: 'Custom rate limit message',
        statusCode: 429,
      });

      // Call the middleware
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
