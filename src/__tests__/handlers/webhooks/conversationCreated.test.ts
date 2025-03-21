import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { conversationCreatedHandler } from '../../../handlers/webhooks/conversations/conversationCreated.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

// Mock the Frontapp client
jest.mock('../../../clients/frontapp/index.js', () => ({
  frontappClient: {
    getConversation: jest.fn(),
    getConversationMessages: jest.fn(),
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
      id: 'cnv_123',
      subject: 'New support request',
      status: 'open',
      assignee: { id: 'tea_123', email: 'agent@example.com' },
      recipient: { handle: 'customer@example.com' },
      created_at: 1616161616,
    };

    // Mock API responses
    const mockConversation = {
      id: 'cnv_123',
      subject: 'New support request',
      status: 'open',
      // ... other conversation data
    };

    const mockMessages = {
      _results: [
        {
          id: 'msg_123',
          type: 'email',
          author: { email: 'customer@example.com' },
          body: 'Hello, I need help with your product.',
          created_at: 1616161616,
        },
      ],
      _links: { self: 'https://api.frontapp.com/conversations/cnv_123/messages' },
      _pagination: {},
    };

    (frontappClient.getConversation as jest.Mock).mockResolvedValue({
      data: mockConversation,
    });

    (frontappClient.getConversationMessages as jest.Mock).mockResolvedValue({
      data: mockMessages,
    });

    // Call the handler
    await conversationCreatedHandler.handle(webhookPayload, mockServer);

    // Verify API calls
    expect(frontappClient.getConversation).toHaveBeenCalledWith('cnv_123');
    expect(frontappClient.getConversationMessages).toHaveBeenCalledWith('cnv_123');

    // Verify notification was sent to the MCP server
    expect(mockServer.notification).toHaveBeenCalled();
    const notificationCall = (mockServer.notification as jest.Mock).mock.calls[0][0];
    expect(notificationCall).toHaveProperty('type', 'conversation.created');
    expect(notificationCall).toHaveProperty('data');
    expect(notificationCall.data).toHaveProperty('conversation', mockConversation);
    expect(notificationCall.data).toHaveProperty('messages', mockMessages._results);
  });

  it('should handle API errors gracefully', async () => {
    // Mock webhook payload
    const webhookPayload = {
      id: 'cnv_123',
      subject: 'New support request',
    };

    // Mock API error
    const errorMessage = 'API error';
    (frontappClient.getConversation as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the handler
    await conversationCreatedHandler.handle(webhookPayload, mockServer);

    // Verify API call was attempted
    expect(frontappClient.getConversation).toHaveBeenCalledWith('cnv_123');

    // Verify no notification was sent
    expect(mockServer.notification).not.toHaveBeenCalled();
  });
});
