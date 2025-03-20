#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebhookEventType } from '../src/models/frontapp.ts';
import { conversationCreatedHandler } from '../src/handlers/webhooks/conversations/conversationCreated.ts';
import { conversationUpdatedHandler } from '../src/handlers/webhooks/conversations/conversationUpdated.ts';
import { messageReceivedHandler } from '../src/handlers/webhooks/messages/messageReceived.ts';

/**
 * Test the webhook handlers directly
 */
async function testWebhookHandlers() {
  console.log('Testing Webhook Handlers');
  console.log('=======================');
  
  // Create a mock server
  const server = new Server(
    {
      name: 'test-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  
  // Test ConversationCreatedHandler
  console.log('\nTesting ConversationCreatedHandler...');
  try {
    // Create a mock webhook payload
    const payload = {
      type: WebhookEventType.CONVERSATION_CREATED,
      payload: {
        id: 'cnv_test123',
      },
    };
    
    // Call the handler
    await conversationCreatedHandler.handle(payload, server);
    
    console.log('✅ ConversationCreatedHandler test passed');
  } catch (error) {
    console.error('❌ ConversationCreatedHandler test failed:', error.message);
  }
  
  // Test ConversationUpdatedHandler
  console.log('\nTesting ConversationUpdatedHandler...');
  try {
    // Create a mock webhook payload
    const payload = {
      type: WebhookEventType.CONVERSATION_ASSIGNED,
      payload: {
        id: 'cnv_test123',
      },
    };
    
    // Call the handler
    await conversationUpdatedHandler.handle(payload, server);
    
    console.log('✅ ConversationUpdatedHandler test passed');
  } catch (error) {
    console.error('❌ ConversationUpdatedHandler test failed:', error.message);
  }
  
  // Test MessageReceivedHandler
  console.log('\nTesting MessageReceivedHandler...');
  try {
    // Create a mock webhook payload
    const payload = {
      type: WebhookEventType.MESSAGE_RECEIVED,
      payload: {
        id: 'msg_test123',
        conversation_id: 'cnv_test123',
      },
    };
    
    // Call the handler
    await messageReceivedHandler.handle(payload, server);
    
    console.log('✅ MessageReceivedHandler test passed');
  } catch (error) {
    console.error('❌ MessageReceivedHandler test failed:', error.message);
  }
  
  console.log('\nAll webhook handler tests completed!');
}

testWebhookHandlers().catch(console.error);
