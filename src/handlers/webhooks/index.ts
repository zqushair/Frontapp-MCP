import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import express, { Request, Response } from 'express';
import { WebhookEventType } from '../../models/frontapp.js';
import { config } from '../../config/index.js';
import { captureRawBody, verifyWebhookSignature } from '../../middleware/webhookAuth.js';
import { webhookSubscriptionManager } from '../../utils/webhookSubscription.js';
import logger from '../../utils/logger.js';

// Import conversation webhook handlers
import { conversationCreatedHandler } from './conversations/conversationCreated.js';
import { conversationUpdatedHandler } from './conversations/conversationUpdated.js';
import { conversationTaggedHandler } from './conversations/conversationTagged.js';
import { conversationUntaggedHandler } from './conversations/conversationUntagged.js';
import { conversationAssignedHandler } from './conversations/conversationAssigned.js';
import { conversationUnassignedHandler } from './conversations/conversationUnassigned.js';

// Import message webhook handlers
import { messageReceivedHandler } from './messages/messageReceived.js';
import { messageCreatedHandler } from './messages/messageCreated.js';

// Import contact webhook handlers
import { contactCreatedHandler } from './contacts/contactCreated.js';
import { contactUpdatedHandler } from './contacts/contactUpdated.js';

/**
 * Set up webhook handlers for the MCP server
 * This function sets up an Express server to handle webhooks from Frontapp
 * @param server The MCP server instance
 */
export function setupWebhookHandlers(server: Server): void {
  // Check if webhook configuration is provided
  if (!config.webhook.baseUrl || !config.webhook.secret) {
    console.warn('Webhook configuration is missing. Webhook functionality will be disabled.');
    return;
  }

  // Create an Express app
  const app = express();

  // Capture raw body for webhook signature verification
  app.use(captureRawBody);

  // Parse JSON bodies
  app.use(express.json());

  // Verify webhook signatures
  app.use('/webhooks', verifyWebhookSignature);

  // Webhook route
  app.post('/webhooks', async (req: Request, res: Response) => {
    try {
      const { type, payload } = req.body;

      console.log(`[Webhook] Received ${type} event`);

      // Route to appropriate webhook handler based on event type
      switch (type) {
        // Conversation webhook handlers
        case WebhookEventType.CONVERSATION_CREATED:
          await conversationCreatedHandler.handle(req.body, server);
          break;
        case 'conversation.updated': // Using string as it might not be in the enum
          await conversationUpdatedHandler.handle(req.body, server);
          break;
        case WebhookEventType.CONVERSATION_TAGGED:
          await conversationTaggedHandler.handle(req.body, server);
          break;
        case WebhookEventType.CONVERSATION_UNTAGGED:
          await conversationUntaggedHandler.handle(req.body, server);
          break;
        case WebhookEventType.CONVERSATION_ASSIGNED:
          await conversationAssignedHandler.handle(req.body, server);
          break;
        case WebhookEventType.CONVERSATION_UNASSIGNED:
          await conversationUnassignedHandler.handle(req.body, server);
          break;

        // Message webhook handlers
        case WebhookEventType.MESSAGE_RECEIVED:
          await messageReceivedHandler.handle(req.body, server);
          break;
        case 'message.created': // Using string as it might not be in the enum
          await messageCreatedHandler.handle(req.body, server);
          break;

        // Contact webhook handlers
        case WebhookEventType.CONTACT_CREATED:
          await contactCreatedHandler.handle(req.body, server);
          break;
        case WebhookEventType.CONTACT_UPDATED:
          await contactUpdatedHandler.handle(req.body, server);
          break;

        default:
          console.log(`[Webhook] Unhandled event type: ${type}`);
      }

      // Acknowledge receipt of webhook
      res.status(200).send('OK');
    } catch (error: any) {
      console.error('[Webhook Error]', error.message);
      res.status(500).send('Internal Server Error');
    }
  });

  // Health check route
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // Start the server
  const port = config.server.port;
  app.listen(port, () => {
    console.log(`Webhook server listening on port ${port}`);
    console.log(`Webhook URL: ${config.webhook.baseUrl}/webhooks`);
  });

  // Initialize webhook subscriptions
  initializeWebhookSubscriptions().catch((error) => {
    logger.error('Failed to initialize webhook subscriptions', {
      error: error.message,
      stack: error.stack,
    });
  });

  logger.info('Webhook handlers set up successfully');
}

/**
 * Initialize webhook subscriptions
 * This function subscribes to all webhook events in Frontapp
 */
async function initializeWebhookSubscriptions(): Promise<void> {
  try {
    // Initialize the webhook subscription manager
    await webhookSubscriptionManager.initialize();
    
    // Subscribe to all webhook events
    await webhookSubscriptionManager.subscribeAll();
    
    logger.info('Webhook subscriptions initialized');
  } catch (error: any) {
    logger.error('Failed to initialize webhook subscriptions', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
