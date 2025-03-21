/**
 * Integration test for webhook workflow
 * This test verifies the end-to-end workflow for handling webhooks
 */

import { createTestClient, mockFrontappApi, cleanup } from './setup.js';
import { expect } from 'chai';
import crypto from 'crypto';
import { config } from '../../src/config/index.js';

describe('Webhook Workflow Integration Tests', () => {
  let testClient: any;
  let mockApi: any;
  
  beforeEach(() => {
    // Create a test client
    testClient = createTestClient();
    
    // Mock the Frontapp API
    const mock = mockFrontappApi();
    mockApi = mock.frontappApi;
    
    // Set webhook secret for testing
    config.webhook.secret = 'test-webhook-secret';
  });
  
  afterEach(() => {
    // Close the test client
    if (testClient) {
      testClient.close();
    }
    
    // Clean up mocks
    cleanup();
  });
  
  /**
   * Generate a webhook signature
   * @param payload The webhook payload
   * @returns The webhook signature
   */
  function generateSignature(payload: any): string {
    const hmac = crypto.createHmac('sha256', config.webhook.secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
  
  it('should handle conversation created webhook', async () => {
    // Mock API responses for the webhook workflow
    
    // 1. Get conversation details
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
    
    // 2. Get tags
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
            name: 'new',
            highlight: '#FF0000',
            is_private: false,
            created_at: Date.now() / 1000,
            updated_at: Date.now() / 1000,
          },
        ],
      });
    
    // 3. Apply tag
    mockApi
      .post('/conversations/cnv_123/tags')
      .reply(204);
    
    // Create webhook payload
    const timestamp = Math.floor(Date.now() / 1000);
    const webhookPayload = {
      type: 'conversation.created',
      payload: {
        id: 'webhook_123',
        conversation_id: 'cnv_123',
        created_at: timestamp,
      },
      _links: {
        self: 'https://api2.frontapp.com/events/webhook_123',
      },
    };
    
    // Generate signature
    const signature = generateSignature(webhookPayload);
    
    // Send webhook
    const webhookResponse = await testClient.request
      .post('/webhooks')
      .set('X-Front-Signature', signature)
      .send(webhookPayload);
    
    // Verify webhook was processed successfully
    expect(webhookResponse.status).to.equal(200);
    expect(webhookResponse.text).to.equal('OK');
    
    // Verify all mocks were called
    expect(mockApi.isDone()).to.be.true;
  });
  
  it('should handle message received webhook', async () => {
    // Mock API responses for the webhook workflow
    
    // 1. Get conversation details
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
          {
            id: 'msg_124',
            type: 'email',
            is_inbound: true,
            created_at: Date.now() / 1000,
            blurb: 'New message',
            body: '<p>New message</p>',
            text: 'New message',
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
    
    // 2. Get teammates
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
    
    // 3. Assign conversation
    mockApi
      .patch('/conversations/cnv_123/assign')
      .reply(204);
    
    // Create webhook payload
    const timestamp = Math.floor(Date.now() / 1000);
    const webhookPayload = {
      type: 'message.received',
      payload: {
        id: 'webhook_124',
        conversation_id: 'cnv_123',
        message_id: 'msg_124',
        created_at: timestamp,
      },
      _links: {
        self: 'https://api2.frontapp.com/events/webhook_124',
      },
    };
    
    // Generate signature
    const signature = generateSignature(webhookPayload);
    
    // Send webhook
    const webhookResponse = await testClient.request
      .post('/webhooks')
      .set('X-Front-Signature', signature)
      .send(webhookPayload);
    
    // Verify webhook was processed successfully
    expect(webhookResponse.status).to.equal(200);
    expect(webhookResponse.text).to.equal('OK');
    
    // Verify all mocks were called
    expect(mockApi.isDone()).to.be.true;
  });
  
  it('should reject webhook with invalid signature', async () => {
    // Create webhook payload
    const timestamp = Math.floor(Date.now() / 1000);
    const webhookPayload = {
      type: 'conversation.created',
      payload: {
        id: 'webhook_123',
        conversation_id: 'cnv_123',
        created_at: timestamp,
      },
      _links: {
        self: 'https://api2.frontapp.com/events/webhook_123',
      },
    };
    
    // Generate invalid signature
    const invalidSignature = 'invalid-signature';
    
    // Send webhook with invalid signature
    const webhookResponse = await testClient.request
      .post('/webhooks')
      .set('X-Front-Signature', invalidSignature)
      .send(webhookPayload);
    
    // Verify webhook was rejected
    expect(webhookResponse.status).to.equal(401);
    expect(webhookResponse.body.error).to.equal('Invalid signature');
  });
  
  it('should reject webhook with missing signature', async () => {
    // Create webhook payload
    const timestamp = Math.floor(Date.now() / 1000);
    const webhookPayload = {
      type: 'conversation.created',
      payload: {
        id: 'webhook_123',
        conversation_id: 'cnv_123',
        created_at: timestamp,
      },
      _links: {
        self: 'https://api2.frontapp.com/events/webhook_123',
      },
    };
    
    // Send webhook without signature
    const webhookResponse = await testClient.request
      .post('/webhooks')
      .send(webhookPayload);
    
    // Verify webhook was rejected
    expect(webhookResponse.status).to.equal(401);
    expect(webhookResponse.body.error).to.equal('Missing signature header');
  });
  
  it('should reject webhook with expired timestamp', async () => {
    // Create webhook payload with expired timestamp (6 minutes ago)
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 6 * 60;
    const webhookPayload = {
      type: 'conversation.created',
      payload: {
        id: 'webhook_123',
        conversation_id: 'cnv_123',
        created_at: expiredTimestamp,
      },
      _links: {
        self: 'https://api2.frontapp.com/events/webhook_123',
      },
    };
    
    // Generate signature
    const signature = generateSignature(webhookPayload);
    
    // Send webhook
    const webhookResponse = await testClient.request
      .post('/webhooks')
      .set('X-Front-Signature', signature)
      .send(webhookPayload);
    
    // Verify webhook was rejected
    expect(webhookResponse.status).to.equal(400);
    expect(webhookResponse.body.error).to.equal('Webhook is too old');
  });
  
  it('should reject duplicate webhook', async () => {
    // Create webhook payload
    const timestamp = Math.floor(Date.now() / 1000);
    const webhookPayload = {
      type: 'conversation.created',
      payload: {
        id: 'webhook_123',
        conversation_id: 'cnv_123',
        created_at: timestamp,
      },
      _links: {
        self: 'https://api2.frontapp.com/events/webhook_123',
      },
    };
    
    // Generate signature
    const signature = generateSignature(webhookPayload);
    
    // Send webhook first time
    const firstResponse = await testClient.request
      .post('/webhooks')
      .set('X-Front-Signature', signature)
      .send(webhookPayload);
    
    // Verify first webhook was processed successfully
    expect(firstResponse.status).to.equal(200);
    
    // Mock API responses for the second webhook
    mockApi
      .get('/conversations/cnv_123')
      .reply(200, {
        id: 'cnv_123',
        subject: 'Test Conversation',
        status: 'open',
      });
    
    // Send the same webhook again
    const secondResponse = await testClient.request
      .post('/webhooks')
      .set('X-Front-Signature', signature)
      .send(webhookPayload);
    
    // Verify second webhook was rejected as duplicate
    expect(secondResponse.status).to.equal(409);
    expect(secondResponse.body.error).to.equal('Duplicate webhook');
  });
});
