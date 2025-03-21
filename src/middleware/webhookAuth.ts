import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import ErrorLogger from '../utils/errorLogger.js';

// Maximum age of a webhook in milliseconds (5 minutes)
const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000;

// Store of processed webhook IDs to prevent replay attacks
// In a production environment, this should be stored in a distributed cache or database
const processedWebhookIds = new Set<string>();

// Cleanup old webhook IDs periodically (every hour)
setInterval(() => {
  const now = Date.now();
  // In a real implementation, we would remove entries older than a certain time
  // For this simple in-memory implementation, we just clear the set if it gets too large
  if (processedWebhookIds.size > 10000) {
    logger.info(`Clearing webhook ID cache (size: ${processedWebhookIds.size})`);
    processedWebhookIds.clear();
  }
}, 60 * 60 * 1000);

/**
 * Middleware to verify Frontapp webhook signatures and prevent replay attacks
 *
 * Frontapp signs webhooks with a shared secret using HMAC-SHA256
 * The signature is sent in the X-Front-Signature header
 *
 * This middleware also validates the timestamp in the webhook payload to prevent replay attacks
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function verifyWebhookSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const signature = req.headers['x-front-signature'] as string;

  if (!signature) {
    ErrorLogger.logSecurityError('Missing X-Front-Signature header in webhook request', 'Authentication failed', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(401).json({ error: 'Missing signature header' });
  }

  // Get the raw request body as a string
  const rawBody = JSON.stringify(req.body);

  // Create an HMAC-SHA256 hash using the webhook secret
  const hmac = crypto.createHmac('sha256', config.webhook.secret);
  hmac.update(rawBody);
  const calculatedSignature = hmac.digest('hex');

  // Compare the calculated signature with the one from the header
  if (signature !== calculatedSignature) {
    ErrorLogger.logSecurityError('Invalid webhook signature', 'Signature verification failed', {
      expected: calculatedSignature,
      received: signature,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Extract webhook ID and timestamp from the payload
  const { payload, type } = req.body;
  
  if (!payload) {
    ErrorLogger.logWebhookError('Missing payload in webhook request', 'Validation failed', {
      path: req.path,
      method: req.method,
      body: req.body
    });
    return res.status(400).json({ error: 'Missing payload' });
  }
  
  const webhookId = payload.id;
  
  if (!webhookId) {
    ErrorLogger.logWebhookError('Missing ID in webhook payload', 'Validation failed', {
      path: req.path,
      method: req.method,
      type,
      payload
    });
    return res.status(400).json({ error: 'Missing webhook ID' });
  }
  
  // Check if this webhook has already been processed (prevent replay)
  if (processedWebhookIds.has(webhookId)) {
    ErrorLogger.logSecurityError('Duplicate webhook received', 'Potential replay attack', {
      webhookId,
      type,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(409).json({ error: 'Duplicate webhook' });
  }
  
  // Extract timestamp from the payload (different fields depending on event type)
  let timestamp: number | undefined;
  
  if (payload.created_at) {
    timestamp = payload.created_at * 1000; // Convert to milliseconds
  } else if (payload.updated_at) {
    timestamp = payload.updated_at * 1000; // Convert to milliseconds
  } else if (payload.timestamp) {
    timestamp = payload.timestamp * 1000; // Convert to milliseconds
  }
  
  // Validate timestamp if available
  if (timestamp) {
    const now = Date.now();
    const age = now - timestamp;
    
    // Check if the webhook is too old
    if (age > MAX_WEBHOOK_AGE_MS) {
      ErrorLogger.logSecurityError('Webhook is too old', 'Potential replay attack', {
        webhookId,
        type,
        timestamp: new Date(timestamp).toISOString(),
        age: `${age / 1000} seconds`,
        maxAge: MAX_WEBHOOK_AGE_MS / 1000,
        path: req.path,
        method: req.method
      });
      return res.status(400).json({ error: 'Webhook is too old' });
    }
    
    // Check if the webhook is from the future (clock skew or malicious)
    if (timestamp > now + 60000) { // Allow 1 minute of clock skew
      ErrorLogger.logSecurityError('Webhook timestamp is in the future', 'Potential clock skew or malicious request', {
        webhookId,
        type,
        timestamp: new Date(timestamp).toISOString(),
        now: new Date(now).toISOString(),
        difference: (timestamp - now) / 1000,
        path: req.path,
        method: req.method
      });
      return res.status(400).json({ error: 'Webhook timestamp is in the future' });
    }
  } else {
    logger.warn('No timestamp found in webhook payload', {
      webhookId,
      type,
      path: req.path,
      method: req.method
    });
    // Continue processing even without a timestamp, as some webhook types might not include it
  }
  
  // Mark this webhook as processed
  processedWebhookIds.add(webhookId);
  
  // If all checks pass, proceed to the next middleware
  next();
}

/**
 * Express middleware to capture the raw request body for signature verification
 * This middleware should be applied before the JSON body parser
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function captureRawBody(req: Request, res: Response, next: NextFunction): void {
  let data = '';

  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    (req as any).rawBody = data;
    logger.debug('Captured raw request body for webhook signature verification', {
      path: req.path,
      method: req.method,
      contentLength: data.length
    });
    next();
  });

  req.on('error', (err) => {
    ErrorLogger.logWebhookError('Error capturing raw request body', err, {
      path: req.path,
      method: req.method,
      contentType: req.headers['content-type']
    });
    next(err);
  });
}
