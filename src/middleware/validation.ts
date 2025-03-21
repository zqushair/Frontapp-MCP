import { Request, Response, NextFunction } from 'express';
import { validationUtil } from '../utils/validation.js';
import logger from '../utils/logger.js';

/**
 * Input validation middleware
 * This middleware validates request data against a schema
 */
export class ValidationMiddleware {
  /**
   * Create a middleware function that validates request data against a schema
   * @param schema The schema to validate against
   * @param dataSource The source of the data to validate (body, query, params)
   * @returns A middleware function that validates request data
   */
  public static validate(
    schema: any,
    dataSource: 'body' | 'query' | 'params' = 'body'
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get the data to validate
        const data = req[dataSource];

        // Validate the data
        const result = validationUtil.validateWithResult(data, (value) => {
          // Use the appropriate validation method based on the schema type
          if (schema.type === 'object') {
            return validationUtil.validateObject(value, schema.options);
          } else if (schema.type === 'array') {
            return validationUtil.validateArray(value, schema.options);
          } else if (schema.type === 'string') {
            return validationUtil.validateString(value, schema.options);
          } else if (schema.type === 'number') {
            return validationUtil.validateNumber(value, schema.options);
          } else if (schema.type === 'boolean') {
            return validationUtil.validateBoolean(value, schema.options);
          } else if (schema.validator) {
            return validationUtil.validateCustom(value, schema.validator);
          } else {
            throw new Error(`Unsupported schema type: ${schema.type}`);
          }
        });

        // If the data is invalid, return an error response
        if (!result.valid) {
          logger.warn('Validation failed', {
            errors: result.errors,
            data,
            path: req.path,
            method: req.method,
          });

          return res.status(400).json({
            error: 'Validation failed',
            details: result.errors,
          });
        }

        // Replace the request data with the validated data
        req[dataSource] = result.data;

        // Continue to the next middleware
        next();
      } catch (error: any) {
        logger.error('Validation middleware error', {
          error: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
        });

        // Return an error response
        return res.status(500).json({
          error: 'Internal server error',
        });
      }
    };
  }

  /**
   * Create a middleware function that validates request body against a schema
   * @param schema The schema to validate against
   * @returns A middleware function that validates request body
   */
  public static validateBody(schema: any) {
    return ValidationMiddleware.validate(schema, 'body');
  }

  /**
   * Create a middleware function that validates request query against a schema
   * @param schema The schema to validate against
   * @returns A middleware function that validates request query
   */
  public static validateQuery(schema: any) {
    return ValidationMiddleware.validate(schema, 'query');
  }

  /**
   * Create a middleware function that validates request params against a schema
   * @param schema The schema to validate against
   * @returns A middleware function that validates request params
   */
  public static validateParams(schema: any) {
    return ValidationMiddleware.validate(schema, 'params');
  }

  /**
   * Create a middleware function that validates request data against multiple schemas
   * @param schemas The schemas to validate against
   * @returns A middleware function that validates request data
   */
  public static validateAll(schemas: {
    body?: any;
    query?: any;
    params?: any;
  }) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate each data source
        if (schemas.body) {
          const result = validationUtil.validateWithResult(req.body, (value) => {
            // Use the appropriate validation method based on the schema type
            if (schemas.body.type === 'object') {
              return validationUtil.validateObject(value, schemas.body.options);
            } else if (schemas.body.type === 'array') {
              return validationUtil.validateArray(value, schemas.body.options);
            } else if (schemas.body.type === 'string') {
              return validationUtil.validateString(value, schemas.body.options);
            } else if (schemas.body.type === 'number') {
              return validationUtil.validateNumber(value, schemas.body.options);
            } else if (schemas.body.type === 'boolean') {
              return validationUtil.validateBoolean(value, schemas.body.options);
            } else if (schemas.body.validator) {
              return validationUtil.validateCustom(value, schemas.body.validator);
            } else {
              throw new Error(`Unsupported schema type: ${schemas.body.type}`);
            }
          });

          if (!result.valid) {
            logger.warn('Body validation failed', {
              errors: result.errors,
              body: req.body,
              path: req.path,
              method: req.method,
            });

            return res.status(400).json({
              error: 'Body validation failed',
              details: result.errors,
            });
          }

          req.body = result.data;
        }

        if (schemas.query) {
          const result = validationUtil.validateWithResult(req.query, (value) => {
            // Use the appropriate validation method based on the schema type
            if (schemas.query.type === 'object') {
              return validationUtil.validateObject(value, schemas.query.options);
            } else if (schemas.query.type === 'array') {
              return validationUtil.validateArray(value, schemas.query.options);
            } else if (schemas.query.type === 'string') {
              return validationUtil.validateString(value, schemas.query.options);
            } else if (schemas.query.type === 'number') {
              return validationUtil.validateNumber(value, schemas.query.options);
            } else if (schemas.query.type === 'boolean') {
              return validationUtil.validateBoolean(value, schemas.query.options);
            } else if (schemas.query.validator) {
              return validationUtil.validateCustom(value, schemas.query.validator);
            } else {
              throw new Error(`Unsupported schema type: ${schemas.query.type}`);
            }
          });

          if (!result.valid) {
            logger.warn('Query validation failed', {
              errors: result.errors,
              query: req.query,
              path: req.path,
              method: req.method,
            });

            return res.status(400).json({
              error: 'Query validation failed',
              details: result.errors,
            });
          }

          req.query = result.data as any;
        }

        if (schemas.params) {
          const result = validationUtil.validateWithResult(req.params, (value) => {
            // Use the appropriate validation method based on the schema type
            if (schemas.params.type === 'object') {
              return validationUtil.validateObject(value, schemas.params.options);
            } else if (schemas.params.type === 'array') {
              return validationUtil.validateArray(value, schemas.params.options);
            } else if (schemas.params.type === 'string') {
              return validationUtil.validateString(value, schemas.params.options);
            } else if (schemas.params.type === 'number') {
              return validationUtil.validateNumber(value, schemas.params.options);
            } else if (schemas.params.type === 'boolean') {
              return validationUtil.validateBoolean(value, schemas.params.options);
            } else if (schemas.params.validator) {
              return validationUtil.validateCustom(value, schemas.params.validator);
            } else {
              throw new Error(`Unsupported schema type: ${schemas.params.type}`);
            }
          });

          if (!result.valid) {
            logger.warn('Params validation failed', {
              errors: result.errors,
              params: req.params,
              path: req.path,
              method: req.method,
            });

            return res.status(400).json({
              error: 'Params validation failed',
              details: result.errors,
            });
          }

          req.params = result.data as any;
        }

        // Continue to the next middleware
        next();
      } catch (error: any) {
        logger.error('Validation middleware error', {
          error: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
        });

        // Return an error response
        return res.status(500).json({
          error: 'Internal server error',
        });
      }
    };
  }
}

// Export the middleware
export default ValidationMiddleware;
