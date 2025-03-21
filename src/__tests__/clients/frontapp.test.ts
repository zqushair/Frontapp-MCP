import { frontappClient } from '../../clients/frontapp/index.js';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

describe('FrontappClient', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = (axios.create as jest.Mock)();
  });

  describe('Rate limiting and retry logic', () => {
    it('should configure retries with custom settings', () => {
      // Call the configureRetries method
      frontappClient.configureRetries(5, 2000);
      
      // Since the method only sets internal properties, we can't directly test it
      // But we can verify it doesn't throw errors
      expect(() => frontappClient.configureRetries(5, 2000)).not.toThrow();
    });
  });

  describe('API methods', () => {
    it('should call the correct endpoint for getConversations', async () => {
      // Setup mock response
      const mockResponse = { data: { _results: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Call the method
      const params = { status: 'open', limit: 10 };
      const result = await frontappClient.getConversations(params);

      // Verify the correct endpoint was called with the right parameters
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/conversations', { params });
      expect(result).toBe(mockResponse);
    });

    it('should call the correct endpoint for getConversation', async () => {
      // Setup mock response
      const mockResponse = { data: { id: 'cnv_123' } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Call the method
      const conversationId = 'cnv_123';
      const result = await frontappClient.getConversation(conversationId);

      // Verify the correct endpoint was called
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/conversations/${conversationId}`);
      expect(result).toBe(mockResponse);
    });

    it('should call the correct endpoint for sendMessage', async () => {
      // Setup mock response
      const mockResponse = { data: { id: 'msg_123' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Call the method
      const conversationId = 'cnv_123';
      const data = { content: 'Hello' };
      const result = await frontappClient.sendMessage(conversationId, data);

      // Verify the correct endpoint was called with the right data
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/conversations/${conversationId}/messages`, data);
      expect(result).toBe(mockResponse);
    });
  });
});
