# Webhook Subscription Guide

This guide provides information on how to manage webhook subscriptions in the Frontapp MCP integration.

## Overview

Webhooks allow the Frontapp MCP integration to receive real-time notifications about events in Frontapp. The integration includes a webhook subscription management system that makes it easy to subscribe to and unsubscribe from webhook events.

## Automatic Subscription

By default, the integration automatically subscribes to all available webhook events when it starts up. This ensures that the integration receives notifications about all relevant events in Frontapp.

The automatic subscription is handled by the `initializeWebhookSubscriptions` function in the `src/handlers/webhooks/index.ts` file. This function is called when the webhook server starts up.

## Manual Subscription Management

The integration also provides a command-line tool for managing webhook subscriptions. This tool can be used to:

- List all current webhook subscriptions
- Subscribe to specific webhook events
- Unsubscribe from specific webhook events
- Subscribe to all available webhook events
- Unsubscribe from all webhook events

### Using the Command-Line Tool

The command-line tool is available as an npm script:

```bash
npm run webhooks -- [command] [options]
```

#### Commands

- `list`: List all current webhook subscriptions
- `subscribe`: Subscribe to specific webhook events
- `unsubscribe`: Unsubscribe from specific webhook events
- `all`: Subscribe to all available webhook events
- `none`: Unsubscribe from all webhook events

#### Options

- `--events`: Comma-separated list of event types (for `subscribe` and `unsubscribe` commands)

#### Examples

List all current webhook subscriptions:

```bash
npm run webhooks -- list
```

Subscribe to specific webhook events:

```bash
npm run webhooks -- subscribe --events conversation.created,message.received
```

Unsubscribe from specific webhook events:

```bash
npm run webhooks -- unsubscribe --events conversation.created
```

Subscribe to all available webhook events:

```bash
npm run webhooks -- all
```

Unsubscribe from all webhook events:

```bash
npm run webhooks -- none
```

## Available Webhook Events

The following webhook events are available in Frontapp:

### Conversation Events

- `conversation.assigned`: A conversation is assigned to a teammate
- `conversation.created`: A new conversation is created
- `conversation.deleted`: A conversation is deleted
- `conversation.restored`: A deleted conversation is restored
- `conversation.tagged`: A tag is applied to a conversation
- `conversation.trashed`: A conversation is moved to trash
- `conversation.unassigned`: A conversation is unassigned from a teammate
- `conversation.untagged`: A tag is removed from a conversation

### Message Events

- `inbound.message`: An inbound message is received
- `outbound.message`: An outbound message is sent
- `outbound.reply`: An outbound reply is sent
- `message.sent`: A message is sent
- `message.received`: A message is received

### Comment Events

- `comment.created`: A comment is created
- `comment.mention`: A teammate is mentioned in a comment

### Contact Events

- `contact.created`: A new contact is created
- `contact.updated`: A contact is updated

## Webhook Subscription Manager

The webhook subscription management system is implemented in the `src/utils/webhookSubscription.ts` file. This file provides a `WebhookSubscriptionManager` class with methods for managing webhook subscriptions.

### Methods

- `initialize()`: Initialize the webhook subscription manager by fetching existing webhooks
- `subscribe(events)`: Subscribe to the specified webhook events
- `unsubscribe(events)`: Unsubscribe from the specified webhook events
- `subscribeAll()`: Subscribe to all available webhook events
- `unsubscribeAll()`: Unsubscribe from all webhook events
- `getSubscribedEvents()`: Get a list of all subscribed webhook events

### Usage in Code

```typescript
import { webhookSubscriptionManager } from '../utils/webhookSubscription.js';
import { WebhookEventType } from '../models/frontapp.js';

// Initialize the webhook subscription manager
await webhookSubscriptionManager.initialize();

// Subscribe to specific webhook events
await webhookSubscriptionManager.subscribe([
  WebhookEventType.CONVERSATION_CREATED,
  WebhookEventType.MESSAGE_RECEIVED,
]);

// Unsubscribe from specific webhook events
await webhookSubscriptionManager.unsubscribe([
  WebhookEventType.CONVERSATION_CREATED,
]);

// Subscribe to all available webhook events
await webhookSubscriptionManager.subscribeAll();

// Unsubscribe from all webhook events
await webhookSubscriptionManager.unsubscribeAll();

// Get a list of all subscribed webhook events
const events = webhookSubscriptionManager.getSubscribedEvents();
```

## Webhook Handling

When a webhook event is received, it is processed by the appropriate webhook handler. The webhook handlers are implemented in the `src/handlers/webhooks` directory.

Each webhook handler is responsible for:

1. Validating the webhook payload
2. Processing the webhook payload
3. Updating the MCP server with the relevant information

For more information on webhook handling, see the [Webhook Handling Guide](webhook-handling-guide.md).

## Troubleshooting

### Common Issues

#### Webhook Subscription Failures

If you encounter errors when subscribing to webhook events, check the following:

1. Ensure that the Frontapp API key has the necessary permissions to manage webhooks
2. Verify that the webhook URL is publicly accessible
3. Check that the webhook secret is correctly configured

#### Missing Webhook Events

If you're not receiving webhook events for certain actions in Frontapp, check the following:

1. Verify that you're subscribed to the relevant webhook events using the `list` command
2. Check the Frontapp webhook settings to ensure that the webhook is active
3. Look for any errors in the webhook server logs

#### Webhook Verification Failures

If Frontapp is sending webhooks but they're being rejected by the webhook server, check the following:

1. Ensure that the webhook secret in the `.env` file matches the secret configured in Frontapp
2. Verify that the webhook signature verification middleware is correctly configured

## Best Practices

1. **Subscribe to Relevant Events**: Only subscribe to the webhook events that your integration needs to process
2. **Handle Webhook Failures Gracefully**: Implement retry logic for webhook processing failures
3. **Monitor Webhook Activity**: Regularly check the webhook server logs for any issues
4. **Secure Webhook Endpoints**: Use HTTPS and webhook signature verification to secure webhook endpoints
5. **Test Webhook Handling**: Use the webhook testing tools to verify that webhook handling is working correctly
