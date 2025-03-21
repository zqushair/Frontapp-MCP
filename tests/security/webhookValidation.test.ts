import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { WebhookValidationMiddleware } from '../../src/middleware/webhookValidation.js';
import { validationUtil } from '../../src/utils/validation.js';
import logger from '../../src/utils/logger.js';

// Mock the validation utility
jest.mock('../../src/utils/validation.js', () => ({
  validationUtil: {
    validateWithResult: jest.fn(),
    validateObject: jest.fn(),
    validateString: jest.fn(),
    validateNumber: jest.fn(),
    validateBoolean: jest.fn(),
    validateArray: jest.fn(),
    validateCustom: jest.fn(),
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

describe('Webhook Validation Middleware', () => {
  // Create mock request, response, and next function
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock request, response, and next function
    mockRequest = {
      body: {
        type: 'conversation.created',
        payload: {
          id: 'cnv_123',
          subject: 'Test Conversation',
          status: 'assigned',
          assignee: {
            id: 'tea_123',
            email: 'test@example.com',
            username: 'testuser',
          },
          recipient: {
            handle: 'test@example.com',
            role: 'from',
          },
          tags: [
            {
              id: 'tag_123',
              name: 'Test Tag',
            },
          ],
        },
      },
      path: '/webhooks',
      method: 'POST',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
  });

  describe('validateWebhook', () => {
    it('should validate webhook payload against a schema', () => {
      // Mock validation result
      const mockValidationResult = {
        valid: true,
        data: mockRequest.body,
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create event type to schema map
      const eventTypeToSchemaMap = {
        'conversation.created': {
          type: 'object',
          options: {
            properties: {
              type: {
                required: true,
                validator: (value: unknown) => validationUtil.validateString(value, {
                  required: true,
                  pattern: /^conversation\.created$/,
                }),
              },
              payload: {
                required: true,
                validator: (value: unknown) => validationUtil.validateObject(value, {
                  required: true,
                  properties: {
                    id: {
                      required: true,
                      validator: (value: unknown) => validationUtil.validateString(value, {
                        required: true,
                        pattern: /^cnv_[a-zA-Z0-9]+$/,
                      }),
                    },
                  },
                }),
              },
            },
          },
        },
      };

      // Create middleware
      const middleware = WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith(mockRequest.body, expect.any(Function));

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();

      // Check that the request body was updated
      expect(mockRequest.body).toBe(mockValidationResult.data);
    });

    it('should return an error response when validation fails', () => {
      // Mock validation result
      const mockValidationResult = {
        valid: false,
        data: null,
        errors: ['Value is required'],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create event type to schema map
      const eventTypeToSchemaMap = {
        'conversation.created': {
          type: 'object',
          options: {
            properties: {
              type: {
                required: true,
                validator: (value: unknown) => validationUtil.validateString(value, {
                  required: true,
                  pattern: /^conversation\.created$/,
                }),
              },
              payload: {
                required: true,
                validator: (value: unknown) => validationUtil.validateObject(value, {
                  required: true,
                  properties: {
                    id: {
                      required: true,
                      validator: (value: unknown) => validationUtil.validateString(value, {
                        required: true,
                        pattern: /^cnv_[a-zA-Z0-9]+$/,
                      }),
                    },
                  },
                }),
              },
            },
          },
        },
      };

      // Create middleware
      const middleware = WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith(mockRequest.body, expect.any(Function));

      // Check that next was not called
      expect(mockNext).not.toHaveBeenCalled();

      // Check that status and json were called with the correct arguments
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Webhook validation failed',
        details: ['Value is required'],
      });

      // Check that logger.warn was called with the correct arguments
      expect(logger.warn).toHaveBeenCalledWith('Webhook validation failed', {
        errors: ['Value is required'],
        body: mockRequest.body,
        path: '/webhooks',
        method: 'POST',
        eventType: 'conversation.created',
      });
    });

    it('should skip validation if no schema is found for the event type', () => {
      // Create event type to schema map
      const eventTypeToSchemaMap = {
        'conversation.assigned': {
          type: 'object',
          options: {
            properties: {
              type: {
                required: true,
                validator: (value: unknown) => validationUtil.validateString(value, {
                  required: true,
                  pattern: /^conversation\.assigned$/,
                }),
              },
              payload: {
                required: true,
                validator: (value: unknown) => validationUtil.validateObject(value, {
                  required: true,
                  properties: {
                    id: {
                      required: true,
                      validator: (value: unknown) => validationUtil.validateString(value, {
                        required: true,
                        pattern: /^cnv_[a-zA-Z0-9]+$/,
                      }),
                    },
                  },
                }),
              },
            },
          },
        },
      };

      // Create middleware
      const middleware = WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was not called
      expect(validationUtil.validateWithResult).not.toHaveBeenCalled();

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();

      // Check that logger.warn was called with the correct arguments
      expect(logger.warn).toHaveBeenCalledWith('No schema found for event type: conversation.created');
    });

    it('should handle errors during validation', () => {
      // Mock validateWithResult to throw an error
      (validationUtil.validateWithResult as jest.Mock).mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Create event type to schema map
      const eventTypeToSchemaMap = {
        'conversation.created': {
          type: 'object',
          options: {
            properties: {
              type: {
                required: true,
                validator: (value: unknown) => validationUtil.validateString(value, {
                  required: true,
                  pattern: /^conversation\.created$/,
                }),
              },
              payload: {
                required: true,
                validator: (value: unknown) => validationUtil.validateObject(value, {
                  required: true,
                  properties: {
                    id: {
                      required: true,
                      validator: (value: unknown) => validationUtil.validateString(value, {
                        required: true,
                        pattern: /^cnv_[a-zA-Z0-9]+$/,
                      }),
                    },
                  },
                }),
              },
            },
          },
        },
      };

      // Create middleware
      const middleware = WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith(mockRequest.body, expect.any(Function));

      // Check that next was not called
      expect(mockNext).not.toHaveBeenCalled();

      // Check that status and json were called with the correct arguments
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });

      // Check that logger.error was called with the correct arguments
      expect(logger.error).toHaveBeenCalledWith('Webhook validation middleware error', {
        error: 'Validation error',
        stack: expect.any(String),
        path: '/webhooks',
        method: 'POST',
        body: mockRequest.body,
      });
    });
  });

  describe('validateConversationWebhook', () => {
    it('should create a middleware function that validates conversation webhook payloads', () => {
      // Mock validation result
      const mockValidationResult = {
        valid: true,
        data: mockRequest.body,
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create middleware
      const middleware = WebhookValidationMiddleware.validateConversationWebhook();

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called
      expect(validationUtil.validateWithResult).toHaveBeenCalled();

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateMessageWebhook', () => {
    it('should create a middleware function that validates message webhook payloads', () => {
      // Set up request body
      mockRequest.body = {
        type: 'message.created',
        payload: {
          id: 'msg_123',
          conversation_id: 'cnv_123',
          type: 'email',
          is_inbound: true,
          author: {
            id: 'tea_123',
            email: 'test@example.com',
            username: 'testuser',
          },
          body: 'Test message',
          text: 'Test message',
          attachments: [
            {
              id: 'att_123',
              filename: 'test.txt',
              url: 'https://example.com/test.txt',
              content_type: 'text/plain',
              size: 1024,
            },
          ],
        },
      };

      // Mock validation result
      const mockValidationResult = {
        valid: true,
        data: mockRequest.body,
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create middleware
      const middleware = WebhookValidationMiddleware.validateMessageWebhook();

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called
      expect(validationUtil.validateWithResult).toHaveBeenCalled();

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateContactWebhook', () => {
    it('should create a middleware function that validates contact webhook payloads', () => {
      // Set up request body
      mockRequest.body = {
        type: 'contact.created',
        payload: {
          id: 'con_123',
          name: 'Test Contact',
          description: 'Test description',
          handles: [
            {
              handle: 'test@example.com',
              source: 'email',
            },
          ],
        },
      };

      // Mock validation result
      const mockValidationResult = {
        valid: true,
        data: mockRequest.body,
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create middleware
      const middleware = WebhookValidationMiddleware.validateContactWebhook();

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called
      expect(validationUtil.validateWithResult).toHaveBeenCalled();

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
