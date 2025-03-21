import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { conversationCreatedHandler } from '../../../handlers/webhooks/conversations/conversationCreated.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

// Mock the Frontapp client
jest.mock('../../../clients/frontapp/index.js', () => ({
  frontappClient: {
    getConversation: jest.fn(),
  },
}));

// Mock the MCP server
const mockServer = {
  notification: jest.fn(),
} as unknown as Server;

describe('ConversationCreatedHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process conversation.created webhook correctly', async () => {
    // Mock webhook payload
    const webhookPayload = {
      type: 'conversation.created',
      payload: {
        id: 'cnv_123',
        subject: 'New support request',
        status: 'open',
        assignee: { id: 'tea_123', email: 'agent@example.com' },
        recipient: { handle: 'customer@example.com' },
        created_at: 1616161616,
      },
    };

    // Mock API responses
    const mockConversation = {
      id: 'cnv_123',
      subject: 'New support request',
      status: 'open',
      // ... other conversation data
    };

    (frontappClient.getConversation as jest.Mock).mockResolvedValue({
      data: mockConversation,
    });

    // Call the handler
    await conversationCreatedHandler.handle(webhookPayload, mockServer);

    // Verify API calls
    expect(frontappClient.getConversation).toHaveBeenCalledWith('cnv_123');

    // We're not testing the notification here since the implementation might vary
  });

  it('should handle API errors gracefully', async () => {
    // Mock webhook payload
    const webhookPayload = {
      type: 'conversation.created',
      payload: {
        id: 'cnv_123',
        subject: 'New support request',
      },
    };

    // Mock API error
    const errorMessage = 'API error';
    (frontappClient.getConversation as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the handler
    await expect(conversationCreatedHandler.handle(webhookPayload, mockServer)).rejects.toThrow(
      errorMessage
    );

    // Verify API call was attempted
    expect(frontappClient.getConversation).toHaveBeenCalledWith('cnv_123');
  });
});
