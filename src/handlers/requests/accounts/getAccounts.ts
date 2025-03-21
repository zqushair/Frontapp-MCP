import { BaseRequestHandler } from '../base.js';
import { GetAccountsArguments, ToolResponse } from '../../../models/mcp.js';
import { frontappClient } from '../../../clients/frontapp/index.js';
import { Account, FrontappPaginatedResponse } from '../../../models/frontapp.js';

/**
 * Handler for the get_accounts tool
 * Retrieves a list of accounts from Frontapp
 */
export class GetAccountsHandler extends BaseRequestHandler<GetAccountsArguments> {
  /**
   * Validate the arguments passed to the tool
   * @param args The arguments to validate
   * @throws Error if the arguments are invalid
   */
  protected validateArgs(args: GetAccountsArguments): void {
    // Validate limit if provided
    if (args.limit !== undefined && (typeof args.limit !== 'number' || args.limit <= 0)) {
      throw new Error('Limit must be a positive number');
    }

    // Validate page_token if provided
    if (args.page_token !== undefined && typeof args.page_token !== 'string') {
      throw new Error('page_token must be a string');
    }

    // Validate search query if provided
    if (args.q !== undefined && typeof args.q !== 'string') {
      throw new Error('q must be a string');
    }
  }

  /**
   * Execute the request to get accounts
   * @param args The validated arguments
   * @returns A response containing the accounts
   */
  protected async execute(args: GetAccountsArguments): Promise<ToolResponse> {
    try {
      // Call the Frontapp API to get accounts
      const response = await frontappClient.getAccounts(args);

      // Extract the accounts from the response
      const data = response.data as FrontappPaginatedResponse<Account>;

      // Format the response for the LLM
      const formattedAccounts = data._results.map((account) => ({
        id: account.id,
        name: account.name,
        description: account.description || '',
        domains: account.domains,
        external_id: account.external_id,
        custom_fields: account.custom_fields,
        created_at: new Date(account.created_at * 1000).toISOString(),
        updated_at: new Date(account.updated_at * 1000).toISOString(),
      }));

      // Create a success response with the formatted accounts
      return this.createSuccessResponse({
        accounts: formattedAccounts,
        pagination: {
          next_page_token: data._pagination.next,
        },
      });
    } catch (error: any) {
      // Create an error response
      return this.createErrorResponse(`Failed to get accounts: ${error.message}`);
    }
  }
}

// Export a singleton instance of the handler
export const getAccountsHandler = new GetAccountsHandler();
