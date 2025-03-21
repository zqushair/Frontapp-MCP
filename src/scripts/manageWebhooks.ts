#!/usr/bin/env node

/**
 * Webhook subscription management script
 * This script provides a command-line interface for managing webhook subscriptions in Frontapp
 * 
 * Usage:
 *   npm run webhooks -- [command] [options]
 * 
 * Commands:
 *   list     List all webhook subscriptions
 *   subscribe   Subscribe to webhook events
 *   unsubscribe Unsubscribe from webhook events
 *   all      Subscribe to all webhook events
 *   none     Unsubscribe from all webhook events
 * 
 * Options:
 *   --events  Comma-separated list of event types (for subscribe/unsubscribe)
 * 
 * Examples:
 *   npm run webhooks -- list
 *   npm run webhooks -- subscribe --events conversation.created,message.received
 *   npm run webhooks -- unsubscribe --events conversation.created
 *   npm run webhooks -- all
 *   npm run webhooks -- none
 */

import dotenv from 'dotenv';
import { WebhookEventType } from '../models/frontapp.js';
import { webhookSubscriptionManager } from '../utils/webhookSubscription.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Parse command-line arguments
const args = process.argv.slice(2);
const command = args[0];

// Define available commands
const commands = ['list', 'subscribe', 'unsubscribe', 'all', 'none'];

// Check if command is valid
if (!command || !commands.includes(command)) {
  console.error(`Invalid command: ${command}`);
  console.error(`Available commands: ${commands.join(', ')}`);
  process.exit(1);
}

// Parse options
const options: Record<string, string> = {};
for (let i = 1; i < args.length; i += 2) {
  if (args[i].startsWith('--')) {
    options[args[i].slice(2)] = args[i + 1];
  }
}

// Main function
async function main() {
  try {
    // Initialize the webhook subscription manager
    await webhookSubscriptionManager.initialize();

    // Execute the command
    switch (command) {
      case 'list':
        await listWebhooks();
        break;
      case 'subscribe':
        await subscribeWebhooks();
        break;
      case 'unsubscribe':
        await unsubscribeWebhooks();
        break;
      case 'all':
        await subscribeAllWebhooks();
        break;
      case 'none':
        await unsubscribeAllWebhooks();
        break;
    }
  } catch (error: any) {
    logger.error('Error executing command', {
      command,
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// List all webhook subscriptions
async function listWebhooks() {
  const events = webhookSubscriptionManager.getSubscribedEvents();
  
  console.log('Subscribed webhook events:');
  if (events.length === 0) {
    console.log('  No webhook subscriptions found');
  } else {
    events.forEach((event) => {
      console.log(`  - ${event}`);
    });
  }
}

// Subscribe to webhook events
async function subscribeWebhooks() {
  if (!options.events) {
    console.error('Missing required option: --events');
    process.exit(1);
  }
  
  const events = options.events.split(',') as WebhookEventType[];
  
  console.log(`Subscribing to webhook events: ${events.join(', ')}`);
  await webhookSubscriptionManager.subscribe(events);
  console.log('Subscription successful');
}

// Unsubscribe from webhook events
async function unsubscribeWebhooks() {
  if (!options.events) {
    console.error('Missing required option: --events');
    process.exit(1);
  }
  
  const events = options.events.split(',') as WebhookEventType[];
  
  console.log(`Unsubscribing from webhook events: ${events.join(', ')}`);
  await webhookSubscriptionManager.unsubscribe(events);
  console.log('Unsubscription successful');
}

// Subscribe to all webhook events
async function subscribeAllWebhooks() {
  console.log('Subscribing to all webhook events');
  await webhookSubscriptionManager.subscribeAll();
  console.log('Subscription successful');
}

// Unsubscribe from all webhook events
async function unsubscribeAllWebhooks() {
  console.log('Unsubscribing from all webhook events');
  await webhookSubscriptionManager.unsubscribeAll();
  console.log('Unsubscription successful');
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
