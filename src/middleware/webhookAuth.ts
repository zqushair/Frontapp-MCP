import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * Middleware to verify Frontapp webhook signatures
 * 
 * Frontapp signs webhooks with a shared secret using HMAC-SHA256
 * The signature is sent in the X-Front-Signature header
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void | Response {
  const signature = req.headers['x-front-signature'] as string;
  
  if (!signature) {
    console.error('[Webhook Auth] Missing X-Front-Signature header');
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
    console.error('[Webhook Auth] Invalid signature');
    console.error(`[Webhook Auth] Expected: ${calculatedSignature}, Received: ${signature}`);
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // If the signature is valid, proceed to the next middleware
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
    next();
  });
}
