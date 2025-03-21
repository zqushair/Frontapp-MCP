/**
 * Configuration schema
 * This file defines the schema for the application configuration
 */

import { EnvVarDefinition, EnvVarType } from '../utils/envValidator.js';

/**
 * Environment variable definitions
 * These definitions are used to validate environment variables
 */
export const envVarDefinitions: EnvVarDefinition[] = [
  // Frontapp API configuration
  {
    name: 'FRONTAPP_API_KEY',
    type: EnvVarType.STRING,
    required: true,
    description: 'Frontapp API key for authentication',
  },
  
  // Webhook configuration
  {
    name: 'WEBHOOK_SECRET',
    type: EnvVarType.STRING,
    required: false,
    description: 'Secret key for webhook signature verification',
  },
  {
    name: 'WEBHOOK_BASE_URL',
    type: EnvVarType.URL,
    required: false,
    description: 'Base URL for webhook endpoints',
  },
  
  // Server configuration
  {
    name: 'PORT',
    type: EnvVarType.PORT,
    required: false,
    default: '3000',
    description: 'Port for the server to listen on',
  },
  
  // Logging configuration
  {
    name: 'LOG_LEVEL',
    type: EnvVarType.STRING,
    required: false,
    default: 'info',
    pattern: /^(error|warn|info|debug|trace)$/,
    description: 'Logging level (error, warn, info, debug, trace)',
  },
  {
    name: 'METRICS_INTERVAL',
    type: EnvVarType.NUMBER,
    required: false,
    default: '60000',
    min: 1000,
    description: 'Interval in milliseconds for logging metrics',
  },
  
  // API configuration
  {
    name: 'API_KEY',
    type: EnvVarType.STRING,
    required: false,
    description: 'API key for authentication',
  },
  {
    name: 'CORS_ORIGINS',
    type: EnvVarType.STRING,
    required: false,
    default: '*',
    description: 'Comma-separated list of allowed CORS origins',
  },
  {
    name: 'RATE_LIMIT_WINDOW_MS',
    type: EnvVarType.NUMBER,
    required: false,
    default: '900000',
    min: 1000,
    description: 'Rate limit window in milliseconds',
  },
  {
    name: 'RATE_LIMIT_MAX',
    type: EnvVarType.NUMBER,
    required: false,
    default: '100',
    min: 1,
    description: 'Maximum number of requests per rate limit window',
  },
  
  // Security configuration
  {
    name: 'ENCRYPTION_KEY',
    type: EnvVarType.STRING,
    required: true,
    description: 'Key for encrypting sensitive data',
  },
  {
    name: 'CREDENTIALS_DIR',
    type: EnvVarType.PATH,
    required: false,
    default: './credentials',
    description: 'Directory for storing credentials',
  },
  {
    name: 'HTTPS_ENABLED',
    type: EnvVarType.BOOLEAN,
    required: false,
    default: 'false',
    description: 'Whether to enable HTTPS',
  },
  {
    name: 'HTTPS_CERT',
    type: EnvVarType.PATH,
    required: false,
    description: 'Path to HTTPS certificate file',
  },
  {
    name: 'HTTPS_KEY',
    type: EnvVarType.PATH,
    required: false,
    description: 'Path to HTTPS key file',
  },
  
  // Rate limiting configuration
  {
    name: 'RATE_LIMITING_ENABLED',
    type: EnvVarType.BOOLEAN,
    required: false,
    default: 'true',
    description: 'Whether to enable rate limiting',
  },
  {
    name: 'API_RATE_LIMIT_WINDOW_MS',
    type: EnvVarType.NUMBER,
    required: false,
    default: '60000',
    min: 1000,
    description: 'API rate limit window in milliseconds',
  },
  {
    name: 'API_RATE_LIMIT_MAX',
    type: EnvVarType.NUMBER,
    required: false,
    default: '100',
    min: 1,
    description: 'Maximum number of API requests per rate limit window',
  },
  {
    name: 'AUTH_RATE_LIMIT_WINDOW_MS',
    type: EnvVarType.NUMBER,
    required: false,
    default: '900000',
    min: 1000,
    description: 'Authentication rate limit window in milliseconds',
  },
  {
    name: 'AUTH_RATE_LIMIT_MAX',
    type: EnvVarType.NUMBER,
    required: false,
    default: '5',
    min: 1,
    description: 'Maximum number of authentication requests per rate limit window',
  },
  {
    name: 'WEBHOOK_RATE_LIMIT_WINDOW_MS',
    type: EnvVarType.NUMBER,
    required: false,
    default: '60000',
    min: 1000,
    description: 'Webhook rate limit window in milliseconds',
  },
  {
    name: 'WEBHOOK_RATE_LIMIT_MAX',
    type: EnvVarType.NUMBER,
    required: false,
    default: '200',
    min: 1,
    description: 'Maximum number of webhook requests per rate limit window',
  },
];
