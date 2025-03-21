import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  frontapp: {
    apiKey: process.env.FRONTAPP_API_KEY || '',
    baseUrl: 'https://api2.frontapp.com',
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET || '',
    baseUrl: process.env.WEBHOOK_BASE_URL || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000', 10),
  },
  api: {
    apiKey: process.env.API_KEY || '',
    corsOrigins: process.env.CORS_ORIGINS || '*',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    credentialsDir: process.env.CREDENTIALS_DIR || './credentials',
    https: {
      enabled: process.env.HTTPS_ENABLED === 'true',
      cert: process.env.HTTPS_CERT || '',
      key: process.env.HTTPS_KEY || '',
    },
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
      api: {
        windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
        max: parseInt(process.env.API_RATE_LIMIT_MAX || '100', 10), // 100 requests per minute
      },
      auth: {
        windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10), // 5 requests per 15 minutes
      },
      webhook: {
        windowMs: parseInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
        max: parseInt(process.env.WEBHOOK_RATE_LIMIT_MAX || '200', 10), // 200 requests per minute
      },
    },
  },
};

// Validate required configuration
export function validateConfig(): void {
  const requiredVars = [{ key: 'FRONTAPP_API_KEY', value: config.frontapp.apiKey }];

  // Optional for testing, but required for production
  const optionalVars = [
    { key: 'WEBHOOK_SECRET', value: config.webhook.secret },
    { key: 'WEBHOOK_BASE_URL', value: config.webhook.baseUrl },
  ];

  // Security configuration
  const securityVars = [
    { key: 'ENCRYPTION_KEY', value: config.security.encryptionKey, required: true },
    { key: 'CREDENTIALS_DIR', value: config.security.credentialsDir, required: false },
  ];

  // HTTPS configuration (only required if HTTPS is enabled)
  if (config.security.https.enabled) {
    securityVars.push(
      { key: 'HTTPS_CERT', value: config.security.https.cert, required: true },
      { key: 'HTTPS_KEY', value: config.security.https.key, required: true }
    );
  }

  // Combine all required variables
  const allRequiredVars = [
    ...requiredVars,
    ...securityVars.filter(v => v.required),
  ];

  const missingVars = allRequiredVars.filter(({ value }) => !value);

  if (missingVars.length > 0) {
    const missingKeys = missingVars.map(({ key }) => key).join(', ');
    throw new Error(`Missing required environment variables: ${missingKeys}`);
  }

  // Check optional variables
  const allOptionalVars = [
    ...optionalVars,
    ...securityVars.filter(v => !v.required),
  ];

  const missingOptionalVars = allOptionalVars.filter(({ value }) => !value);
  if (missingOptionalVars.length > 0) {
    const missingKeys = missingOptionalVars.map(({ key }) => key).join(', ');
    console.warn(`Missing optional environment variables: ${missingKeys}`);
    
    // Check if webhook variables are missing
    const missingWebhookVars = optionalVars.filter(({ value }) => !value);
    if (missingWebhookVars.length > 0) {
      console.warn('Webhook functionality will be disabled.');
    }
  }

  // Generate encryption key if not provided
  if (!config.security.encryptionKey) {
    console.warn('ENCRYPTION_KEY not provided. Generating a random key for this session.');
    console.warn('This key will change on restart, which will make existing credentials inaccessible.');
    console.warn('Set ENCRYPTION_KEY in your environment for persistent credentials.');
    
    // Generate a random encryption key (32 bytes = 256 bits, suitable for AES-256)
    const crypto = require('crypto');
    (config.security as any).encryptionKey = crypto.randomBytes(32).toString('hex');
  }
}
