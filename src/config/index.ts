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
};

// Validate required configuration
export function validateConfig(): void {
  const requiredVars = [{ key: 'FRONTAPP_API_KEY', value: config.frontapp.apiKey }];

  // Optional for testing, but required for production
  const optionalVars = [
    { key: 'WEBHOOK_SECRET', value: config.webhook.secret },
    { key: 'WEBHOOK_BASE_URL', value: config.webhook.baseUrl },
  ];

  const missingVars = requiredVars.filter(({ value }) => !value);

  if (missingVars.length > 0) {
    const missingKeys = missingVars.map(({ key }) => key).join(', ');
    throw new Error(`Missing required environment variables: ${missingKeys}`);
  }

  const missingOptionalVars = optionalVars.filter(({ value }) => !value);
  if (missingOptionalVars.length > 0) {
    const missingKeys = missingOptionalVars.map(({ key }) => key).join(', ');
    console.warn(`Missing optional environment variables: ${missingKeys}`);
    console.warn('Webhook functionality will be disabled.');
  }
}
