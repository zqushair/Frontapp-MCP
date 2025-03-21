import { frontappClient } from '../clients/frontapp/index.js';
import { config } from '../config/index.js';
import { Webhook, WebhookEventType } from '../models/frontapp.js';
import logger from './logger.js';

/**
 * Webhook subscription manager
 * This utility provides methods for managing webhook subscriptions in Frontapp
 */
export class WebhookSubscriptionManager {
  private webhookUrl: string;
  private webhooks: Webhook[] = [];
  private isInitialized: boolean = false;

  constructor() {
    // Construct the webhook URL from the base URL
    this.webhookUrl = `${config.webhook.baseUrl}/webhooks`;
  }

  /**
   * Initialize the webhook subscription manager
   * This method fetches existing webhooks and stores them for later use
   */
  public async initialize(): Promise<void> {
    try {
      // Check if webhook configuration is provided
      if (!config.webhook.baseUrl || !config.webhook.secret) {
        logger.warn('Webhook configuration is missing. Webhook functionality will be disabled.');
        return;
      }

      // Fetch existing webhooks
      const response = await frontappClient.listWebhooks();
      this.webhooks = response.data._results;
      this.isInitialized = true;

      logger.info('Webhook subscription manager initialized', {
        webhookUrl: this.webhookUrl,
        existingWebhooks: this.webhooks.length,
      });
    } catch (error: any) {
      logger.error('Failed to initialize webhook subscription manager', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Subscribe to webhook events
   * This method subscribes to the specified webhook events in Frontapp
   * @param events The webhook events to subscribe to
   */
  public async subscribe(events: WebhookEventType[]): Promise<void> {
    try {
      // Check if the manager is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if webhook configuration is provided
      if (!config.webhook.baseUrl || !config.webhook.secret) {
        logger.warn('Webhook configuration is missing. Cannot subscribe to webhook events.');
        return;
      }

      // Filter out events that are already subscribed
      const existingEvents = this.webhooks.flatMap((webhook) => webhook.events);
      const newEvents = events.filter((event) => !existingEvents.includes(event));

      if (newEvents.length === 0) {
        logger.info('All webhook events are already subscribed');
        return;
      }

      // Subscribe to new events
      const response = await frontappClient.subscribeWebhook(newEvents, this.webhookUrl);
      this.webhooks.push(response.data);

      logger.info('Subscribed to webhook events', {
        events: newEvents,
        webhookUrl: this.webhookUrl,
      });
    } catch (error: any) {
      logger.error('Failed to subscribe to webhook events', {
        error: error.message,
        stack: error.stack,
        events,
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from webhook events
   * This method unsubscribes from the specified webhook events in Frontapp
   * @param events The webhook events to unsubscribe from
   */
  public async unsubscribe(events: WebhookEventType[]): Promise<void> {
    try {
      // Check if the manager is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if webhook configuration is provided
      if (!config.webhook.baseUrl || !config.webhook.secret) {
        logger.warn('Webhook configuration is missing. Cannot unsubscribe from webhook events.');
        return;
      }

      // Find webhooks that contain the specified events
      for (const webhook of this.webhooks) {
        const matchingEvents = webhook.events.filter((event) => 
          events.includes(event as WebhookEventType)
        );
        
        if (matchingEvents.length > 0) {
          // Unsubscribe from the webhook
          await frontappClient.unsubscribeWebhook(webhook.id);
          
          // Remove the webhook from the list
          this.webhooks = this.webhooks.filter((w) => w.id !== webhook.id);
          
          logger.info('Unsubscribed from webhook events', {
            events: matchingEvents,
            webhookId: webhook.id,
          });
        }
      }
    } catch (error: any) {
      logger.error('Failed to unsubscribe from webhook events', {
        error: error.message,
        stack: error.stack,
        events,
      });
      throw error;
    }
  }

  /**
   * Subscribe to all webhook events
   * This method subscribes to all available webhook events in Frontapp
   */
  public async subscribeAll(): Promise<void> {
    try {
      // Get all webhook event types
      const events = Object.values(WebhookEventType);
      
      // Subscribe to all events
      await this.subscribe(events);
      
      logger.info('Subscribed to all webhook events', {
        eventCount: events.length,
        webhookUrl: this.webhookUrl,
      });
    } catch (error: any) {
      logger.error('Failed to subscribe to all webhook events', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from all webhook events
   * This method unsubscribes from all webhook events in Frontapp
   */
  public async unsubscribeAll(): Promise<void> {
    try {
      // Check if the manager is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if webhook configuration is provided
      if (!config.webhook.baseUrl || !config.webhook.secret) {
        logger.warn('Webhook configuration is missing. Cannot unsubscribe from webhook events.');
        return;
      }

      // Unsubscribe from all webhooks
      for (const webhook of this.webhooks) {
        await frontappClient.unsubscribeWebhook(webhook.id);
        
        logger.info('Unsubscribed from webhook', {
          webhookId: webhook.id,
          events: webhook.events,
        });
      }
      
      // Clear the webhooks list
      this.webhooks = [];
      
      logger.info('Unsubscribed from all webhook events');
    } catch (error: any) {
      logger.error('Failed to unsubscribe from all webhook events', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all subscribed webhook events
   * @returns A list of all subscribed webhook events
   */
  public getSubscribedEvents(): WebhookEventType[] {
    return this.webhooks.flatMap((webhook) => 
      webhook.events.map(event => event as WebhookEventType)
    );
  }
}

// Export a singleton instance
export const webhookSubscriptionManager = new WebhookSubscriptionManager();
