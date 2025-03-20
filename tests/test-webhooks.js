#!/usr/bin/env node
import dotenv from 'dotenv';
import axios from 'axios';
import readline from 'readline';

// Load environment variables
dotenv.config();

const apiKey = process.env.FRONTAPP_API_KEY;
const webhookUrl = process.env.WEBHOOK_BASE_URL ? `${process.env.WEBHOOK_BASE_URL}/webhooks` : null;
const webhookSecret = process.env.WEBHOOK_SECRET;

if (!apiKey) {
  console.error('FRONTAPP_API_KEY environment variable is required');
  process.exit(1);
}

if (!webhookUrl) {
  console.error('WEBHOOK_BASE_URL environment variable is required');
  process.exit(1);
}

if (!webhookSecret) {
  console.error('WEBHOOK_SECRET environment variable is required');
  process.exit(1);
}

// Create an Axios instance for Frontapp API
const client = axios.create({
  baseURL: 'https://api2.frontapp.com',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * List all webhook subscriptions
 */
async function listWebhooks() {
  try {
    const response = await client.get('/webhooks');
    
    console.log('\nCurrent webhook subscriptions:');
    
    if (response.data._results.length === 0) {
      console.log('No webhooks found');
      return [];
    }
    
    response.data._results.forEach((webhook, index) => {
      console.log(`${index + 1}. ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Events: ${webhook.events.join(', ')}`);
      console.log(`   Active: ${webhook.active}`);
      console.log('');
    });
    
    return response.data._results;
  } catch (error) {
    console.error('Failed to list webhooks:');
    logError(error);
    return [];
  }
}

/**
 * Create a webhook subscription
 */
async function createWebhook(events) {
  try {
    console.log(`\nCreating webhook subscription to ${webhookUrl} for events: ${events.join(', ')}`);
    
    const response = await client.post('/webhooks', {
      url: webhookUrl,
      events,
    });
    
    console.log('✅ Webhook subscription created successfully');
    console.log(`Webhook ID: ${response.data.id}`);
    console.log(`URL: ${response.data.url}`);
    console.log(`Events: ${response.data.events.join(', ')}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create webhook subscription:');
    logError(error);
    return null;
  }
}

/**
 * Delete a webhook subscription
 */
async function deleteWebhook(webhookId) {
  try {
    console.log(`\nDeleting webhook subscription ${webhookId}`);
    
    await client.delete(`/webhooks/${webhookId}`);
    
    console.log('✅ Webhook subscription deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete webhook subscription:');
    logError(error);
    return false;
  }
}

/**
 * Log error details
 */
function logError(error) {
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
  } else if (error.request) {
    console.error('No response received from the server');
  } else {
    console.error(`Error: ${error.message}`);
  }
}

/**
 * Ask a question and get user input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Frontapp MCP Webhook Testing Utility');
    console.log('====================================');
    console.log(`Webhook URL: ${webhookUrl}`);
    console.log(`Webhook Secret: ${webhookSecret ? '********' : 'Not set'}`);
    
    // List existing webhooks
    const existingWebhooks = await listWebhooks();
    
    // Check if we already have a webhook subscription to our URL
    const existingWebhook = existingWebhooks.find(webhook => webhook.url === webhookUrl);
    
    if (existingWebhook) {
      console.log(`\nFound existing webhook subscription to ${webhookUrl}`);
      console.log(`Events: ${existingWebhook.events.join(', ')}`);
      
      const answer = await askQuestion('\nDo you want to delete this webhook subscription and create a new one? (y/n): ');
      
      if (answer.toLowerCase() === 'y') {
        await deleteWebhook(existingWebhook.id);
      } else {
        console.log('\nKeeping existing webhook subscription');
        console.log('\nTo test the webhook handlers, you can:');
        console.log('1. Create a new conversation in Frontapp');
        console.log('2. Send a message to an existing conversation');
        console.log('3. Update a conversation (assign, tag, etc.)');
        console.log('\nCheck your server logs to see the webhook events being processed');
        rl.close();
        return;
      }
    }
    
    // Define the events we want to subscribe to
    const events = [
      'conversation.created',
      'conversation.assigned',
      'message.received',
    ];
    
    // Create a new webhook subscription
    const webhook = await createWebhook(events);
    
    if (webhook) {
      console.log('\nWebhook subscription created successfully');
      console.log('\nTo test the webhook handlers, you can:');
      console.log('1. Create a new conversation in Frontapp');
      console.log('2. Send a message to an existing conversation');
      console.log('3. Update a conversation (assign, tag, etc.)');
      console.log('\nCheck your server logs to see the webhook events being processed');
      
      const answer = await askQuestion('\nDo you want to keep this webhook subscription? (y/n): ');
      
      if (answer.toLowerCase() !== 'y') {
        await deleteWebhook(webhook.id);
      } else {
        console.log('\nKeeping webhook subscription');
      }
    }
  } catch (error) {
    console.error('Tests failed with error:', error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
