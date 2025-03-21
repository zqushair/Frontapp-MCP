/**
 * Integration test for conversation workflow
 * This test verifies the end-to-end workflow for handling conversations
 */

import { createTestClient, mockFrontappApi, cleanup } from './setup.js';
import { expect } from 'chai';

describe('Conversation Workflow Integration Tests', () => {
  let testClient: any;
  let mockApi: any;
  
  beforeEach(() => {
    // Create a test client
    testClient = createTestClient();
    
    // Mock the Frontapp API
    const mock = mockFrontappApi();
    mockApi = mock.frontappApi;
  });
  
  afterEach(() => {
    // Close the test client
    if (testClient) {
      testClient.close();
    }
    
    // Clean up mocks
    cleanup();
  });
  
  it('should handle the complete conversation workflow', async () => {
    // Mock API responses for the conversation workflow
    
    // 1. Get conversations
    mockApi
      .get('/conversations')
      .query(true)
      .reply(200, {
        _pagination: {
          next: null,
        },
        _links: {
          self: 'https://api2.frontapp.com/conversations',
        },
        _results: [
          {
            id: 'cnv_123',
            subject: 'Test Conversation',
            status: 'open',
            assignee: null,
            recipient: {
              handle: 'customer@example.com',
              role: 'to',
            },
            tags: [],
            last_message: {
              id: 'msg_123',
              type: 'email',
              is_inbound: true,
              created_at: Date.now() / 1000,
              blurb: 'Test message',
              body: '<p>Test message</p>',
              text: 'Test message',
              author: {
                email: 'customer@example.com',
                is_teammate: false,
              },
            },
            created_at: Date.now() / 1000,
            is_private: false,
          },
        ],
      });
    
    // 2. Get conversation details
    mockApi
      .get('/conversations/cnv_123')
      .reply(200, {
        id: 'cnv_123',
        subject: 'Test Conversation',
        status: 'open',
        assignee: null,
        recipient: {
          handle: 'customer@example.com',
          role: 'to',
        },
        tags: [],
        messages: [
          {
            id: 'msg_123',
            type: 'email',
            is_inbound: true,
            created_at: Date.now() / 1000,
            blurb: 'Test message',
            body: '<p>Test message</p>',
            text: 'Test message',
            author: {
              email: 'customer@example.com',
              is_teammate: false,
            },
          },
        ],
        comments: [],
        created_at: Date.now() / 1000,
        is_private: false,
      });
    
    // 3. Get teammates
    mockApi
      .get('/teammates')
      .query(true)
      .reply(200, {
        _pagination: {
          next: null,
        },
        _links: {
          self: 'https://api2.frontapp.com/teammates',
        },
        _results: [
          {
            id: 'tea_123',
            email: 'agent@example.com',
            username: 'agent',
            first_name: 'Support',
            last_name: 'Agent',
            is_admin: false,
            is_available: true,
            is_blocked: false,
            custom_fields: {},
          },
        ],
      });
    
    // 4. Assign conversation
    mockApi
      .patch('/conversations/cnv_123/assign')
      .reply(204);
    
    // 5. Get tags
    mockApi
      .get('/tags')
      .query(true)
      .reply(200, {
        _pagination: {
          next: null,
        },
        _links: {
          self: 'https://api2.frontapp.com/tags',
        },
        _results: [
          {
            id: 'tag_123',
            name: 'support',
            highlight: '#FF0000',
            is_private: false,
            created_at: Date.now() / 1000,
            updated_at: Date.now() / 1000,
          },
        ],
      });
    
    // 6. Apply tag
    mockApi
      .post('/conversations/cnv_123/tags')
      .reply(204);
    
    // 7. Add comment
    mockApi
      .post('/conversations/cnv_123/comments')
      .reply(201, {
        id: 'com_123',
        author: {
          id: 'tea_123',
          email: 'agent@example.com',
          username: 'agent',
          first_name: 'Support',
          last_name: 'Agent',
          is_teammate: true,
        },
        body: 'Internal note: Customer needs follow-up',
        posted_at: Date.now() / 1000,
      });
    
    // 8. Send message
    mockApi
      .post('/conversations/cnv_123/messages')
      .reply(201, {
        id: 'msg_124',
        type: 'email',
        is_inbound: false,
        created_at: Date.now() / 1000,
        blurb: 'Hello, how can I help you today?',
        body: '<p>Hello, how can I help you today?</p>',
        text: 'Hello, how can I help you today?',
        author: {
          id: 'tea_123',
          email: 'agent@example.com',
          username: 'agent',
          first_name: 'Support',
          last_name: 'Agent',
          is_teammate: true,
        },
      });
    
    // 9. Archive conversation
    mockApi
      .patch('/conversations/cnv_123/archive')
      .reply(204);
    
    // Execute the workflow
    
    // 1. Get conversations
    const getConversationsResponse = await testClient.request
      .post('/tools/get_conversations')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          status: 'open',
          limit: 10,
        },
      });
    
    expect(getConversationsResponse.status).to.equal(200);
    expect(getConversationsResponse.body.content[0].text._results).to.be.an('array');
    expect(getConversationsResponse.body.content[0].text._results[0].id).to.equal('cnv_123');
    
    // 2. Get conversation details
    const getConversationResponse = await testClient.request
      .post('/tools/get_conversation')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          conversation_id: 'cnv_123',
        },
      });
    
    expect(getConversationResponse.status).to.equal(200);
    expect(getConversationResponse.body.content[0].text.id).to.equal('cnv_123');
    
    // 3. Get teammates
    const getTeammatesResponse = await testClient.request
      .post('/tools/get_teammates')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          limit: 10,
        },
      });
    
    expect(getTeammatesResponse.status).to.equal(200);
    expect(getTeammatesResponse.body.content[0].text._results).to.be.an('array');
    expect(getTeammatesResponse.body.content[0].text._results[0].id).to.equal('tea_123');
    
    // 4. Assign conversation
    const assignConversationResponse = await testClient.request
      .post('/tools/assign_conversation')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          conversation_id: 'cnv_123',
          assignee_id: 'tea_123',
        },
      });
    
    expect(assignConversationResponse.status).to.equal(200);
    
    // 5. Get tags
    const getTagsResponse = await testClient.request
      .post('/tools/get_tags')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          limit: 10,
        },
      });
    
    expect(getTagsResponse.status).to.equal(200);
    expect(getTagsResponse.body.content[0].text._results).to.be.an('array');
    expect(getTagsResponse.body.content[0].text._results[0].id).to.equal('tag_123');
    
    // 6. Apply tag
    const applyTagResponse = await testClient.request
      .post('/tools/apply_tag')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          conversation_id: 'cnv_123',
          tag_id: 'tag_123',
        },
      });
    
    expect(applyTagResponse.status).to.equal(200);
    
    // 7. Add comment
    const addCommentResponse = await testClient.request
      .post('/tools/add_comment')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          conversation_id: 'cnv_123',
          body: 'Internal note: Customer needs follow-up',
          author_id: 'tea_123',
        },
      });
    
    expect(addCommentResponse.status).to.equal(200);
    expect(addCommentResponse.body.content[0].text.body).to.equal('Internal note: Customer needs follow-up');
    
    // 8. Send message
    const sendMessageResponse = await testClient.request
      .post('/tools/send_message')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          conversation_id: 'cnv_123',
          content: 'Hello, how can I help you today?',
          author_id: 'tea_123',
        },
      });
    
    expect(sendMessageResponse.status).to.equal(200);
    expect(sendMessageResponse.body.content[0].text.text).to.equal('Hello, how can I help you today?');
    
    // 9. Archive conversation
    const archiveConversationResponse = await testClient.request
      .post('/tools/archive_conversation')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          conversation_id: 'cnv_123',
        },
      });
    
    expect(archiveConversationResponse.status).to.equal(200);
    
    // Verify all mocks were called
    expect(mockApi.isDone()).to.be.true;
  });
  
  it('should handle errors in the conversation workflow', async () => {
    // Mock API error responses
    
    // 1. Get conversation details - Not found
    mockApi
      .get('/conversations/cnv_999')
      .reply(404, {
        _error: {
          status: 404,
          title: 'Not Found',
          message: 'Conversation not found',
        },
      });
    
    // 2. Assign conversation - Server error
    mockApi
      .patch('/conversations/cnv_123/assign')
      .reply(500, {
        _error: {
          status: 500,
          title: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
      });
    
    // Execute the error workflow
    
    // 1. Get conversation details - Not found
    const getConversationResponse = await testClient.request
      .post('/tools/get_conversation')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          conversation_id: 'cnv_999',
        },
      });
    
    expect(getConversationResponse.status).to.equal(200);
    expect(getConversationResponse.body.isError).to.be.true;
    expect(getConversationResponse.body.content[0].text).to.include('Conversation not found');
    
    // 2. Assign conversation - Server error
    const assignConversationResponse = await testClient.request
      .post('/tools/assign_conversation')
      .set('X-API-Key', 'test-api-key')
      .send({
        arguments: {
          conversation_id: 'cnv_123',
          assignee_id: 'tea_123',
        },
      });
    
    expect(assignConversationResponse.status).to.equal(200);
    expect(assignConversationResponse.body.isError).to.be.true;
    expect(assignConversationResponse.body.content[0].text).to.include('Internal Server Error');
    
    // Verify all mocks were called
    expect(mockApi.isDone()).to.be.true;
  });
});
