# Webhook Integration

This guide provides detailed information about integrating with Frontapp webhooks using the Frontapp MCP integration.

## Overview

Webhooks allow your application to receive real-time notifications when events occur in Frontapp. The Frontapp MCP integration includes support for receiving and processing these webhook events.

## How Webhooks Work

1. You subscribe to specific event types in Frontapp (e.g., conversation.created, message.received).
2. When an event occurs, Frontapp sends an HTTP POST request to your webhook URL.
3. The Frontapp MCP integration receives the webhook, verifies its authenticity, and processes it.
4. The integration can then update the LLM's context or trigger automated workflows based on the event.

## Webhook Events

Frontapp supports various webhook events, including:

### Conversation Events

- `conversation.created`: A new conversation is created.
- `conversation.assigned`: A conversation is assigned to a teammate.
- `conversation.unassigned`: A conversation is unassigned from a teammate.
- `conversation.archived`: A conversation is archived.
- `conversation.unarchived`: A conversation is unarchived.
- `conversation.tagged`: A tag is applied to a conversation.
- `conversation.untagged`: A tag is removed from a conversation.

### Message Events

- `message.received`: A new message is received in a conversation.
- `message.sent`: A message is sent from Frontapp.

### Contact Events

- `contact.created`: A new contact is created.
- `contact.updated`: A contact is updated.

## Setting Up Webhook Integration

### Prerequisites

Before setting up webhook integration, ensure you have:

1. A publicly accessible URL where Frontapp can send webhook events.
2. A secret string to verify webhook signatures.

### Configuration

1. Update your `.env` file with the webhook configuration:

```
WEBHOOK_SECRET=your_webhook_secret_here
WEBHOOK_BASE_URL=https://your-webhook-url.com
```

2. Start the Frontapp MCP server:

```bash
npm start
```

3. Subscribe to webhook events using the Frontapp API or the provided test script:

```bash
npm run test:webhooks
```

### Webhook Authentication

Frontapp signs webhook payloads with a signature that you can verify to ensure the webhook is authentic. The Frontapp MCP integration includes middleware to verify these signatures automatically.

The signature is included in the `X-Front-Signature` header of the webhook request. The signature is a HMAC-SHA256 hash of the request body, using your webhook secret as the key.

## Webhook Handlers

The Frontapp MCP integration includes handlers for various webhook events:

### Conversation Handlers

- `ConversationCreatedHandler`: Handles `conversation.created` events.
- `ConversationUpdatedHandler`: Handles `conversation.assigned` and other conversation update events.

### Message Handlers

- `MessageReceivedHandler`: Handles `message.received` events.

## Implementing Custom Webhook Handlers

You can implement custom webhook handlers to process specific events:

1. Create a new handler file in the appropriate directory (e.g., `src/handlers/webhooks/conversations/conversationTagged.ts`).
2. Implement the handler class:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebhookHandler } from '../base.js';
import { frontappClient } from '../../../clients/frontapp/index.js';

export class ConversationTaggedHandler extends WebhookHandler {
  public async handle(payload: any, server: Server): Promise<void> {
    try {
      const conversationId = payload.conversation_id;
      const tagId = payload.tag_id;
      
      console.log(`[Webhook] Conversation ${conversationId} tagged with tag ${tagId}`);
      
      // Process the webhook payload
      // For example, you could fetch additional data from Frontapp
      const conversation = await frontappClient.getConversation(conversationId);
      
      // Update the LLM's context or trigger automated workflows
      // ...
      
    } catch (error: any) {
      console.error(`[Webhook Error] Failed to process conversation.tagged webhook: ${error.message}`);
    }
  }
}

export const conversationTaggedHandler = new ConversationTaggedHandler();
```

3. Register the handler in `src/handlers/webhooks/index.ts`:

```typescript
import { conversationTaggedHandler } from './conversations/conversationTagged.js';

// ...

switch (type) {
  // ...
  case 'conversation.tagged':
    await conversationTaggedHandler.handle(data, server);
    break;
  // ...
}
```

## Testing Webhook Integration

You can test webhook integration using the provided test script:

```bash
npm run test:webhooks
```

This script will:

1. List existing webhook subscriptions.
2. Create a new webhook subscription for specified events.
3. Delete a webhook subscription if needed.

You can also use tools like [ngrok](https://ngrok.com/) to expose your local webhook server to the internet for testing.

## Webhook Payload Examples

### Conversation Created

```json
{
  "type": "conversation.created",
  "payload": {
    "id": "cnv_123",
    "subject": "New conversation",
    "status": "open",
    "assignee": {
      "id": "tea_123",
      "email": "agent@example.com",
      "username": "agent",
      "first_name": "Agent",
      "last_name": "Smith"
    },
    "recipient": {
      "handle": "customer@example.com",
      "role": "from"
    },
    "tags": [
      {
        "id": "tag_123",
        "name": "Support"
      }
    ],
    "links": [
      {
        "type": "contact",
        "id": "cta_123"
      }
    ],
    "created_at": 1615477124.704
  }
}
```

### Message Received

```json
{
  "type": "message.received",
  "payload": {
    "id": "msg_123",
    "conversation_id": "cnv_123",
    "author": {
      "id": null,
      "email": "customer@example.com",
      "username": null,
      "first_name": "Customer",
      "last_name": "Name"
    },
    "body": "Hello, I need help with my order.",
    "text": "Hello, I need help with my order.",
    "created_at": 1615477124.704
  }
}
```

## Troubleshooting

### Common Issues

#### Webhook URL Not Accessible

Ensure that your webhook URL is publicly accessible. You can use tools like [ngrok](https://ngrok.com/) to expose your local server to the internet.

#### Signature Verification Failed

If webhook signature verification fails, check that:

1. The `WEBHOOK_SECRET` in your `.env` file matches the secret used to create the webhook subscription.
2. The webhook payload is not being modified in transit.

#### Webhook Events Not Being Received

If you're not receiving webhook events, check that:

1. You have subscribed to the correct event types.
2. Your webhook URL is correct and accessible.
3. The Frontapp MCP server is running.

## Best Practices

### Security

- Keep your webhook secret secure.
- Always verify webhook signatures to prevent unauthorized requests.
- Use HTTPS for your webhook URL.

### Performance

- Process webhooks asynchronously to avoid blocking the main thread.
- Implement retry logic for failed webhook processing.
- Consider using a queue for high-volume webhook processing.

### Reliability

- Implement error handling and logging for webhook processing.
- Set up monitoring and alerting for webhook failures.
- Consider implementing a dead-letter queue for failed webhook processing.

## Further Reading

For more information about Frontapp webhooks, refer to the [official Frontapp webhook documentation](https://dev.frontapp.com/reference/webhooks).
