import dotenv from 'dotenv';
import crypto from 'crypto';
import { validateEnvVars } from '../utils/envValidator.js';
import { envVarDefinitions } from './schema.js';
import logger from '../utils/logger.js';

// Load environment variables from .env file
dotenv.config();

// Validate environment variables
const validatedEnv = validateEnvVars(envVarDefinitions);

/**
 * Application configuration
 * This object contains the validated configuration for the application
 */
export const config = {
  frontapp: {
    apiKey: validatedEnv.FRONTAPP_API_KEY || '',
    baseUrl: 'https://api2.frontapp.com',
  },
  webhook: {
    secret: validatedEnv.WEBHOOK_SECRET || '',
    baseUrl: validatedEnv.WEBHOOK_BASE_URL || '',
  },
  server: {
    port: validatedEnv.PORT || 3000,
  },
  logging: {
    level: validatedEnv.LOG_LEVEL || 'info',
    metricsInterval: validatedEnv.METRICS_INTERVAL || 60000,
  },
  api: {
    apiKey: validatedEnv.API_KEY || '',
    corsOrigins: validatedEnv.CORS_ORIGINS || '*',
    rateLimitWindowMs: validatedEnv.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
    rateLimitMax: validatedEnv.RATE_LIMIT_MAX || 100, // 100 requests per window
  },
  security: {
    encryptionKey: validatedEnv.ENCRYPTION_KEY || '',
    credentialsDir: validatedEnv.CREDENTIALS_DIR || './credentials',
    https: {
      enabled: validatedEnv.HTTPS_ENABLED || false,
      cert: validatedEnv.HTTPS_CERT || '',
      key: validatedEnv.HTTPS_KEY || '',
    },
    rateLimiting: {
      enabled: validatedEnv.RATE_LIMITING_ENABLED !== false,
      windowMs: validatedEnv.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
      max: validatedEnv.RATE_LIMIT_MAX || 100, // 100 requests per window
      api: {
        windowMs: validatedEnv.API_RATE_LIMIT_WINDOW_MS || 60000, // 1 minute
        max: validatedEnv.API_RATE_LIMIT_MAX || 100, // 100 requests per minute
      },
      auth: {
        windowMs: validatedEnv.AUTH_RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
        max: validatedEnv.AUTH_RATE_LIMIT_MAX || 5, // 5 requests per 15 minutes
      },
      webhook: {
        windowMs: validatedEnv.WEBHOOK_RATE_LIMIT_WINDOW_MS || 60000, // 1 minute
        max: validatedEnv.WEBHOOK_RATE_LIMIT_MAX || 200, // 200 requests per minute
      },
    },
  },
};

/**
 * Validate required configuration
 * This function checks if all required configuration is present
 */
export function validateConfig(): void {
  // Check if webhook configuration is present
  if (!config.webhook.secret || !config.webhook.baseUrl) {
    logger.warn('Webhook configuration is missing. Webhook functionality will be disabled.');
  }

  // Check if HTTPS is enabled but certificates are missing
  if (config.security.https.enabled && (!config.security.https.cert || !config.security.https.key)) {
    logger.warn('HTTPS is enabled but certificate or key is missing. HTTPS will be disabled.');
    config.security.https.enabled = false;
  }

  // Generate encryption key if not provided
  if (!config.security.encryptionKey) {
    logger.warn('ENCRYPTION_KEY not provided. Generating a random key for this session.');
    logger.warn('This key will change on restart, which will make existing credentials inaccessible.');
    logger.warn('Set ENCRYPTION_KEY in your environment for persistent credentials.');
    
    // Generate a random encryption key (32 bytes = 256 bits, suitable for AES-256)
    config.security.encryptionKey = crypto.randomBytes(32).toString('hex');
  }
}
