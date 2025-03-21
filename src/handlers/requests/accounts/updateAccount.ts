import { BaseRequestHandler } from '../base.js';
import { UpdateAccountArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Account } from '../../../models/frontapp.js';

/**
 * Handler for the update_account tool
 * Updates an existing account in Frontapp
 */
export class UpdateAccountHandler extends BaseRequestHandler<UpdateAccountArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: UpdateAccountArguments): void {
    // Validate account_id
    if (!args.account_id) {
      throw new Error('account_id is required');
    }

    if (typeof args.account_id !== 'string') {
      throw new Error('account_id must be a string');
    }

    // Validate that at least one field to update is provided
    if (
      !args.name &&
      !args.description &&
      !args.domains &&
      !args.external_id &&
      !args.custom_fields
    ) {
      throw new Error('At least one field to update must be provided');
    }

    // Validate name if provided
    if (args.name !== undefined && typeof args.name !== 'string') {
      throw new Error('name must be a string');
    }

    // Validate description if provided
    if (args.description !== undefined && typeof args.description !== 'string') {
      throw new Error('description must be a string');
    }

    // Validate domains if provided
    if (args.domains !== undefined) {
      if (!Array.isArray(args.domains) || args.domains.length === 0) {
        throw new Error('domains must be a non-empty array');
      }

      for (const domain of args.domains) {
        if (typeof domain !== 'string') {
          throw new Error('Each domain must be a string');
        }
      }
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
   * Execute the request to update an account
   * @param args The validated arguments
   * @returns A response containing the updated account
   */
  protected async execute(args: UpdateAccountArguments): Promise<ToolResponse> {
    try {
      // Prepare the account data
      const accountData: Record<string, any> = {};

      // Add fields to update if provided
      if (args.name !== undefined) {
        accountData.name = args.name;
      }

      if (args.description !== undefined) {
        accountData.description = args.description;
      }

      if (args.domains !== undefined) {
        accountData.domains = args.domains;
      }

      if (args.external_id !== undefined) {
        accountData.external_id = args.external_id;
      }

      if (args.custom_fields !== undefined) {
        accountData.custom_fields = args.custom_fields;
      }

      // Call the Frontapp API to update the account
      const response = await frontappClient.updateAccount(args.account_id, accountData);
      const account = response.data as Account;

      // Format the response for the LLM
      const formattedAccount = {
        id: account.id,
        name: account.name,
        description: account.description || '',
        domains: account.domains,
        external_id: account.external_id,
        custom_fields: account.custom_fields,
        updated_at: new Date(account.updated_at * 1000).toISOString(),
      };

      // Create a success response with the formatted account
      return this.createSuccessResponse({
        account: formattedAccount,
        message: 'Account updated successfully',
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to update account: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const updateAccountHandler = new UpdateAccountHandler();
