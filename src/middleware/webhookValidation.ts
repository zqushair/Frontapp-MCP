import { Request, Response, NextFunction } from 'express';
import { validationUtil } from '../utils/validation.js';
import logger from '../utils/logger.js';

/**
 * Webhook Validation Middleware
 * This middleware validates webhook payloads against schemas
 */
export class WebhookValidationMiddleware {
  /**
   * Create a middleware function that validates webhook payloads against a schema
   * @param eventTypeToSchemaMap A map of event types to schemas
   * @returns A middleware function that validates webhook payloads
   */
  public static validateWebhook(eventTypeToSchemaMap: Record<string, any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get the event type from the request body
        const eventType = req.body.type;

        // If the event type is not in the map, skip validation
        if (!eventTypeToSchemaMap[eventType]) {
          logger.warn(`No schema found for event type: ${eventType}`);
          return next();
        }

        // Get the schema for the event type
        const schema = eventTypeToSchemaMap[eventType];

        // Validate the webhook payload
        const result = validationUtil.validateWithResult(req.body, (value) => {
          // Use the appropriate validation method based on the schema type
          if (schema.type === 'object') {
            return validationUtil.validateObject(value, schema.options);
          } else if (schema.validator) {
            return validationUtil.validateCustom(value, schema.validator);
          } else {
            throw new Error(`Unsupported schema type: ${schema.type}`);
          }
        });

        // If the webhook payload is invalid, return an error response
        if (!result.valid) {
          logger.warn('Webhook validation failed', {
            errors: result.errors,
            body: req.body,
            path: req.path,
            method: req.method,
            eventType,
          });

          return res.status(400).json({
            error: 'Webhook validation failed',
            details: result.errors,
          });
        }

        // Replace the request body with the validated data
        req.body = result.data;

        // Continue to the next middleware
        next();
      } catch (error: any) {
        logger.error('Webhook validation middleware error', {
          error: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
          body: req.body,
        });

        // Return an error response
        return res.status(500).json({
          error: 'Internal server error',
        });
      }
    };
  }

  /**
   * Create a middleware function that validates conversation webhook payloads
   * @returns A middleware function that validates conversation webhook payloads
   */
  public static validateConversationWebhook() {
    // Define schemas for conversation webhook events
    const eventTypeToSchemaMap: Record<string, any> = {
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
                  subject: {
                    required: false,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: false,
                    }),
                  },
                  status: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: true,
                      pattern: /^(assigned|unassigned|archived)$/,
                    }),
                  },
                  assignee: {
                    required: false,
                    validator: (value: unknown) => {
                      if (value === null) return null;
                      return validationUtil.validateObject(value, {
                        required: false,
                        properties: {
                          id: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                              pattern: /^tea_[a-zA-Z0-9]+$/,
                            }),
                          },
                          email: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                              pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                            }),
                          },
                          username: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                            }),
                          },
                        },
                      });
                    },
                  },
                  recipient: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateObject(value, {
                      required: true,
                      properties: {
                        handle: {
                          required: true,
                          validator: (value: unknown) => validationUtil.validateString(value, {
                            required: true,
                          }),
                        },
                        role: {
                          required: true,
                          validator: (value: unknown) => validationUtil.validateString(value, {
                            required: true,
                            pattern: /^(from|to|cc|bcc)$/,
                          }),
                        },
                      },
                    }),
                  },
                  tags: {
                    required: false,
                    validator: (value: unknown) => validationUtil.validateArray(value, {
                      required: false,
                      itemValidator: (item: unknown) => validationUtil.validateObject(item, {
                        required: true,
                        properties: {
                          id: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                              pattern: /^tag_[a-zA-Z0-9]+$/,
                            }),
                          },
                          name: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                            }),
                          },
                        },
                      }),
                    }),
                  },
                },
              }),
            },
          },
        },
      },
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
                  assignee: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateObject(value, {
                      required: true,
                      properties: {
                        id: {
                          required: true,
                          validator: (value: unknown) => validationUtil.validateString(value, {
                            required: true,
                            pattern: /^tea_[a-zA-Z0-9]+$/,
                          }),
                        },
                        email: {
                          required: true,
                          validator: (value: unknown) => validationUtil.validateString(value, {
                            required: true,
                            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          }),
                        },
                        username: {
                          required: true,
                          validator: (value: unknown) => validationUtil.validateString(value, {
                            required: true,
                          }),
                        },
                      },
                    }),
                  },
                },
              }),
            },
          },
        },
      },
      // Add more schemas for other conversation webhook events
    };

    return WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);
  }

  /**
   * Create a middleware function that validates message webhook payloads
   * @returns A middleware function that validates message webhook payloads
   */
  public static validateMessageWebhook() {
    // Define schemas for message webhook events
    const eventTypeToSchemaMap: Record<string, any> = {
      'message.created': {
        type: 'object',
        options: {
          properties: {
            type: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
                pattern: /^message\.created$/,
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
                      pattern: /^msg_[a-zA-Z0-9]+$/,
                    }),
                  },
                  conversation_id: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: true,
                      pattern: /^cnv_[a-zA-Z0-9]+$/,
                    }),
                  },
                  type: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: true,
                      pattern: /^(email|comment|draft)$/,
                    }),
                  },
                  is_inbound: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateBoolean(value, {
                      required: true,
                    }),
                  },
                  author: {
                    required: false,
                    validator: (value: unknown) => {
                      if (value === null) return null;
                      return validationUtil.validateObject(value, {
                        required: false,
                        properties: {
                          id: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                              pattern: /^(tea|con)_[a-zA-Z0-9]+$/,
                            }),
                          },
                          email: {
                            required: false,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: false,
                              pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                            }),
                          },
                          username: {
                            required: false,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: false,
                            }),
                          },
                        },
                      });
                    },
                  },
                  body: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: true,
                    }),
                  },
                  text: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: true,
                    }),
                  },
                  attachments: {
                    required: false,
                    validator: (value: unknown) => validationUtil.validateArray(value, {
                      required: false,
                      itemValidator: (item: unknown) => validationUtil.validateObject(item, {
                        required: true,
                        properties: {
                          id: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                              pattern: /^att_[a-zA-Z0-9]+$/,
                            }),
                          },
                          filename: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                            }),
                          },
                          url: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                              pattern: /^https?:\/\/.+$/,
                            }),
                          },
                          content_type: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                            }),
                          },
                          size: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateNumber(value, {
                              required: true,
                              min: 0,
                            }),
                          },
                        },
                      }),
                    }),
                  },
                },
              }),
            },
          },
        },
      },
      // Add more schemas for other message webhook events
    };

    return WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);
  }

  /**
   * Create a middleware function that validates contact webhook payloads
   * @returns A middleware function that validates contact webhook payloads
   */
  public static validateContactWebhook() {
    // Define schemas for contact webhook events
    const eventTypeToSchemaMap: Record<string, any> = {
      'contact.created': {
        type: 'object',
        options: {
          properties: {
            type: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
                pattern: /^contact\.created$/,
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
                      pattern: /^con_[a-zA-Z0-9]+$/,
                    }),
                  },
                  name: {
                    required: false,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: false,
                    }),
                  },
                  description: {
                    required: false,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: false,
                    }),
                  },
                  handles: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateArray(value, {
                      required: true,
                      itemValidator: (item: unknown) => validationUtil.validateObject(item, {
                        required: true,
                        properties: {
                          handle: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                            }),
                          },
                          source: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                              pattern: /^(email|phone|twitter|facebook|intercom|custom)$/,
                            }),
                          },
                        },
                      }),
                    }),
                  },
                },
              }),
            },
          },
        },
      },
      'contact.updated': {
        type: 'object',
        options: {
          properties: {
            type: {
              required: true,
              validator: (value: unknown) => validationUtil.validateString(value, {
                required: true,
                pattern: /^contact\.updated$/,
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
                      pattern: /^con_[a-zA-Z0-9]+$/,
                    }),
                  },
                  name: {
                    required: false,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: false,
                    }),
                  },
                  description: {
                    required: false,
                    validator: (value: unknown) => validationUtil.validateString(value, {
                      required: false,
                    }),
                  },
                  handles: {
                    required: true,
                    validator: (value: unknown) => validationUtil.validateArray(value, {
                      required: true,
                      itemValidator: (item: unknown) => validationUtil.validateObject(item, {
                        required: true,
                        properties: {
                          handle: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                            }),
                          },
                          source: {
                            required: true,
                            validator: (value: unknown) => validationUtil.validateString(value, {
                              required: true,
                              pattern: /^(email|phone|twitter|facebook|intercom|custom)$/,
                            }),
                          },
                        },
                      }),
                    }),
                  },
                },
              }),
            },
          },
        },
      },
      // Add more schemas for other contact webhook events
    };

    return WebhookValidationMiddleware.validateWebhook(eventTypeToSchemaMap);
  }
}

// Export the middleware
export default WebhookValidationMiddleware;
