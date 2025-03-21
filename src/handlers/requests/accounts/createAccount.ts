import { BaseRequestHandler } from '../base.js';
import { CreateAccountArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Account } from '../../../models/frontapp.js';

/**
 * Handler for the create_account tool
 * Creates a new account in Frontapp
 */
export class CreateAccountHandler extends BaseRequestHandler<CreateAccountArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: CreateAccountArguments): void {
    // Validate name
    if (!args.name) {
      throw new Error('name is required');
    }

    if (typeof args.name !== 'string') {
      throw new Error('name must be a string');
    }

    // Validate domains
    if (!args.domains || !Array.isArray(args.domains) || args.domains.length === 0) {
      throw new Error('domains is required and must be a non-empty array');
    }

    for (const domain of args.domains) {
      if (typeof domain !== 'string') {
        throw new Error('Each domain must be a string');
      }
    }

    // Validate description if provided
    if (args.description !== undefined && typeof args.description !== 'string') {
      throw new Error('description must be a string');
    }

    // Validate external_id if provided
    if (args.external_id !== undefined && typeof args.external_id !== 'string') {
      throw new Error('external_id must be a string');
    }

    // Validate custom_fields if provided
    if (args.custom_fields !== undefined && typeof args.custom_fields !== 'object') {
      throw new Error('custom_fields must be an object');
    }
  }

  /**
   * Execute the request to create an account
   * @param args The validated arguments
   * @returns A response containing the created account
   */
  protected async execute(args: CreateAccountArguments): Promise<ToolResponse> {
    try {
      // Prepare the account data
      const accountData = {
        name: args.name,
        domains: args.domains,
      } as any;

      // Add optional fields if provided
      if (args.description) {
        accountData.description = args.description;
      }

      if (args.external_id) {
        accountData.external_id = args.external_id;
      }

      if (args.custom_fields) {
        accountData.custom_fields = args.custom_fields;
      }

      // Call the Frontapp API to create the account
      const response = await frontappClient.createAccount(accountData);
      const account = response.data as Account;

      // Format the response for the LLM
      const formattedAccount = {
        id: account.id,
        name: account.name,
        description: account.description || '',
        domains: account.domains,
        external_id: account.external_id,
        custom_fields: account.custom_fields,
        created_at: new Date(account.created_at * 1000).toISOString(),
      };

      // Create a success response with the formatted account
      return this.createSuccessResponse({
        account: formattedAccount,
        message: 'Account created successfully',
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to create account: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const createAccountHandler = new CreateAccountHandler();
