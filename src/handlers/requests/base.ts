import { ToolArguments, ToolResponse } from '../../models/mcp.js';

/**
 * Base interface for all request handlers
 * This provides a consistent structure for handling MCP tool requests
 */
export interface RequestHandler<T extends ToolArguments> {
  /**
   * Handle a request from the LLM
   * @param args The arguments passed to the tool
   * @returns A response to send back to the LLM
   */
  handle(args: T): Promise<ToolResponse>;
}

/**
 * Base class for all request handlers
 * Implements common functionality for request handlers
 */
export abstract class BaseRequestHandler<T extends ToolArguments> implements RequestHandler<T> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected abstract validateArgs(args: T): void;

  /**
   * Execute the request
   * @param args The validated arguments
   * @returns A response to send back to the LLM
   */
  protected abstract execute(args: T): Promise<ToolResponse>;

  /**
   * Handle a request from the LLM
   * This method validates the arguments and then executes the request
   * @param args The arguments passed to the tool
   * @returns A response to send back to the LLM
   */
  async handle(args: T): Promise<ToolResponse> {
    try {
      // Validate the arguments
      this.validateArgs(args);

      // Execute the request
      return await this.execute(args);
    } catch (error: any) {
      // Return an error response
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Create a success response
   * @param data The data to include in the response
   * @returns A success response
   */
  protected createSuccessResponse(data: any): ToolResponse {
    return {
      content: [
        {
          type: 'json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  /**
   * Create an error response
   * @param message The error message
   * @returns An error response
   */
  protected createErrorResponse(message: string): ToolResponse {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
