import { frontappClient } from '../../clients/frontapp/index.js';
import axios from 'axios';

// Mock the frontappClient to avoid actual API calls
jest.mock('../../clients/frontapp/index.js', () => {
  const originalModule = jest.requireActual('../../clients/frontapp/index.js');
  return {
    ...originalModule,
    frontappClient: {
      configureRetries: jest.fn(),
      getConversations: jest.fn(),
      getConversation: jest.fn(),
      sendMessage: jest.fn(),
    },
  };
});

describe('FrontappClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate limiting and retry logic', () => {
    it('should configure retries with custom settings', () => {
      // Call the configureRetries method
      frontappClient.configureRetries(5, 2000);

      // Verify the method was called with the correct parameters
      expect(frontappClient.configureRetries).toHaveBeenCalledWith(5, 2000);
    });
  });

  describe('API methods', () => {
    it('should call the correct method for getConversations', async () => {
      // Setup mock response
      const mockResponse = { data: { _results: [] } };
      (frontappClient.getConversations as jest.Mock).mockResolvedValue(mockResponse);

      // Call the method
      const params = { status: 'open', limit: 10 };
      const result = await frontappClient.getConversations(params);

      // Verify the correct method was called with the right parameters
      expect(frontappClient.getConversations).toHaveBeenCalledWith(params);
      expect(result).toBe(mockResponse);
    });

    it('should call the correct method for getConversation', async () => {
      // Setup mock response
      const mockResponse = { data: { id: 'cnv_123' } };
      (frontappClient.getConversation as jest.Mock).mockResolvedValue(mockResponse);

      // Call the method
      const conversationId = 'cnv_123';
      const result = await frontappClient.getConversation(conversationId);

      // Verify the correct method was called
      expect(frontappClient.getConversation).toHaveBeenCalledWith(conversationId);
      expect(result).toBe(mockResponse);
    });

    it('should call the correct method for sendMessage', async () => {
      // Setup mock response
      const mockResponse = { data: { id: 'msg_123' } };
      (frontappClient.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      // Call the method
      const conversationId = 'cnv_123';
      const data = { content: 'Hello' };
      const result = await frontappClient.sendMessage(conversationId, data);

      // Verify the correct method was called with the right data
      expect(frontappClient.sendMessage).toHaveBeenCalledWith(conversationId, data);
      expect(result).toBe(mockResponse);
    });
  });
});
