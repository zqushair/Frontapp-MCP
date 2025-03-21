import { BaseRequestHandler } from '../base.js';
import { GetAccountArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Account } from '../../../models/frontapp.js';

/**
 * Handler for the get_account tool
 * Retrieves details of a specific account from Frontapp
 */
export class GetAccountHandler extends BaseRequestHandler<GetAccountArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: GetAccountArguments): void {
    // Validate account_id
    if (!args.account_id) {
      throw new Error('account_id is required');
    }

    if (typeof args.account_id !== 'string') {
      throw new Error('account_id must be a string');
    }
  }

  /**
   * Execute the request to get an account
   * @param args The validated arguments
   * @returns A response containing the account details
   */
  protected async execute(args: GetAccountArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to get the account
      const response = await frontappClient.getAccount(args.account_id);
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
        updated_at: new Date(account.updated_at * 1000).toISOString(),
        contacts_url: account._links.related.contacts,
        conversations_url: account._links.related.conversations,
      };

      // Create a success response with the formatted account
      return this.createSuccessResponse(formattedAccount);
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to get account: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const getAccountHandler = new GetAccountHandler();
