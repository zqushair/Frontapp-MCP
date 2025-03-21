import { describe, it, expect, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { ValidationMiddleware } from '../../src/middleware/validation.js';
import { validationUtil } from '../../src/utils/validation.js';

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

describe('Validation Middleware', () => {
  // Create mock request, response, and next function
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock request, response, and next function
    mockRequest = {
      body: {},
      query: {},
      params: {},
      path: '/test',
      method: 'GET',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
  });

  describe('validate', () => {
    it('should validate data against a schema', () => {
      // Mock validation result
      const mockValidationResult = {
        valid: true,
        data: { test: 'value' },
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create a schema
      const schema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            test: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };

      // Call the validate method
      const result = ValidationMiddleware.validate(schema);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({ test: 'value' }, expect.any(Function));

      // Check that the result is correct
      expect(result).toBe(mockValidationResult);
    });

    it('should throw an error when validation fails', () => {
      // Mock validation result
      const mockValidationResult = {
        valid: false,
        data: null,
        errors: ['Value is required'],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create a schema
      const schema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            test: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };

      // Call the validate method
      const result = ValidationMiddleware.validate(schema);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({}, expect.any(Function));

      // Check that the result is correct
      expect(result).toBe(mockValidationResult);
    });
  });

  describe('validateBody', () => {
    it('should validate request body against a schema', () => {
      // Set up request body
      mockRequest.body = { test: 'value' };

      // Mock validation result
      const mockValidationResult = {
        valid: true,
        data: { test: 'value' },
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create a schema
      const schema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            test: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };

      // Create middleware
      const middleware = ValidationMiddleware.validateBody(schema);

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({ test: 'value' }, expect.any(Function));

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();

      // Check that the request body was updated
      expect(mockRequest.body).toBe(mockValidationResult.data);
    });

    it('should return an error response when validation fails', () => {
      // Set up request body
      mockRequest.body = {};

      // Mock validation result
      const mockValidationResult = {
        valid: false,
        data: null,
        errors: ['Value is required'],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create a schema
      const schema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            test: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };

      // Create middleware
      const middleware = ValidationMiddleware.validateBody(schema);

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({}, expect.any(Function));

      // Check that next was not called
      expect(mockNext).not.toHaveBeenCalled();

      // Check that status and json were called with the correct arguments
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['Value is required'],
      });
    });
  });

  describe('validateQuery', () => {
    it('should validate request query against a schema', () => {
      // Set up request query
      mockRequest.query = { test: 'value' };

      // Mock validation result
      const mockValidationResult = {
        valid: true,
        data: { test: 'value' },
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create a schema
      const schema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            test: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };

      // Create middleware
      const middleware = ValidationMiddleware.validateQuery(schema);

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({ test: 'value' }, expect.any(Function));

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();

      // Check that the request query was updated
      expect(mockRequest.query).toBe(mockValidationResult.data);
    });
  });

  describe('validateParams', () => {
    it('should validate request params against a schema', () => {
      // Set up request params
      mockRequest.params = { test: 'value' };

      // Mock validation result
      const mockValidationResult = {
        valid: true,
        data: { test: 'value' },
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock).mockReturnValue(mockValidationResult);

      // Create a schema
      const schema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            test: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };

      // Create middleware
      const middleware = ValidationMiddleware.validateParams(schema);

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({ test: 'value' }, expect.any(Function));

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();

      // Check that the request params were updated
      expect(mockRequest.params).toBe(mockValidationResult.data);
    });
  });

  describe('validateAll', () => {
    it('should validate request body, query, and params against schemas', () => {
      // Set up request body, query, and params
      mockRequest.body = { body: 'value' };
      mockRequest.query = { query: 'value' };
      mockRequest.params = { params: 'value' };

      // Mock validation results
      const mockBodyValidationResult = {
        valid: true,
        data: { body: 'value' },
        errors: [],
      };
      const mockQueryValidationResult = {
        valid: true,
        data: { query: 'value' },
        errors: [],
      };
      const mockParamsValidationResult = {
        valid: true,
        data: { params: 'value' },
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock)
        .mockReturnValueOnce(mockBodyValidationResult)
        .mockReturnValueOnce(mockQueryValidationResult)
        .mockReturnValueOnce(mockParamsValidationResult);

      // Create schemas
      const bodySchema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            body: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };
      const querySchema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            query: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };
      const paramsSchema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            params: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };

      // Create middleware
      const middleware = ValidationMiddleware.validateAll({
        body: bodySchema,
        query: querySchema,
        params: paramsSchema,
      });

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({ body: 'value' }, expect.any(Function));
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({ query: 'value' }, expect.any(Function));
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({ params: 'value' }, expect.any(Function));

      // Check that next was called
      expect(mockNext).toHaveBeenCalled();

      // Check that the request body, query, and params were updated
      expect(mockRequest.body).toBe(mockBodyValidationResult.data);
      expect(mockRequest.query).toBe(mockQueryValidationResult.data);
      expect(mockRequest.params).toBe(mockParamsValidationResult.data);
    });

    it('should return an error response when validation fails', () => {
      // Set up request body, query, and params
      mockRequest.body = {};
      mockRequest.query = { query: 'value' };
      mockRequest.params = { params: 'value' };

      // Mock validation results
      const mockBodyValidationResult = {
        valid: false,
        data: null,
        errors: ['Value is required'],
      };
      const mockQueryValidationResult = {
        valid: true,
        data: { query: 'value' },
        errors: [],
      };
      const mockParamsValidationResult = {
        valid: true,
        data: { params: 'value' },
        errors: [],
      };
      (validationUtil.validateWithResult as jest.Mock)
        .mockReturnValueOnce(mockBodyValidationResult)
        .mockReturnValueOnce(mockQueryValidationResult)
        .mockReturnValueOnce(mockParamsValidationResult);

      // Create schemas
      const bodySchema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            body: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };
      const querySchema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            query: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };
      const paramsSchema = {
        type: 'object',
        options: {
          required: true,
          properties: {
            params: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
              }),
            },
          },
        },
      };

      // Create middleware
      const middleware = ValidationMiddleware.validateAll({
        body: bodySchema,
        query: querySchema,
        params: paramsSchema,
      });

      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Check that validateWithResult was called with the correct arguments
      expect(validationUtil.validateWithResult).toHaveBeenCalledWith({}, expect.any(Function));

      // Check that next was not called
      expect(mockNext).not.toHaveBeenCalled();

      // Check that status and json were called with the correct arguments
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['Value is required'],
      });
    });
  });
});
