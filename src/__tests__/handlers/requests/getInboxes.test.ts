import { getInboxesHandler } from '../../../handlers/requests/inboxes/getInboxes.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

// Mock the Frontapp client
jest.mock('../../../clients/frontapp/index.js', () => ({
  frontappClient: {
    getInboxes: jest.fn(),
  },
}));

describe('GetInboxesHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return inboxes data on successful API call', async () => {
    // Mock data
    const mockInboxes = {
      _results: [
        { id: 'inb_123', name: 'Support' },
        { id: 'inb_456', name: 'Sales' },
      ],
      _links: { self: 'https://api.frontapp.com/inboxes' },
      _pagination: {},
    };

    // Mock the API response
    (frontappClient.getInboxes as jest.Mock).mockResolvedValue({
      data: mockInboxes,
    });

    // Call the handler
    const result = await getInboxesHandler.handle({});

    // Verify the result
    expect(frontappClient.getInboxes).toHaveBeenCalled();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('json');
    expect(JSON.parse(result.content[0].text)).toEqual(mockInboxes);
    expect(result.isError).toBeUndefined();
  });

  it('should handle API errors gracefully', async () => {
    // Mock an API error
    const errorMessage = 'API error';
    (frontappClient.getInboxes as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the handler
    const result = await getInboxesHandler.handle({});

    // Verify the error handling
    expect(frontappClient.getInboxes).toHaveBeenCalled();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(errorMessage);
    expect(result.isError).toBe(true);
  });

  it('should pass pagination parameters to the API', async () => {
    // Mock data
    const mockInboxes = {
      _results: [{ id: 'inb_123', name: 'Support' }],
      _links: { self: 'https://api.frontapp.com/inboxes' },
      _pagination: { next: 'next_page_token' },
    };

    // Mock the API response
    (frontappClient.getInboxes as jest.Mock).mockResolvedValue({
      data: mockInboxes,
    });

    // Call the handler with pagination parameters
    const args = { limit: 10, page_token: 'page_token' };
    await getInboxesHandler.handle(args);

    // Verify the parameters were passed correctly
    expect(frontappClient.getInboxes).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        page_token: 'page_token',
      })
    );
  });
});
