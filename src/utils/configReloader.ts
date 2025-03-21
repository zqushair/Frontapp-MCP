/**
 * Configuration reloader
 * This utility provides functions for reloading configuration at runtime
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { validateEnvVars } from './envValidator.js';
import { envVarDefinitions } from '../config/schema.js';
import { config } from '../config/index.js';
import logger from './logger.js';

/**
 * Configuration reload options
 */
export interface ConfigReloadOptions {
  /** Whether to watch the .env file for changes */
  watchEnvFile: boolean;
  /** The path to the .env file */
  envFilePath: string;
  /** The interval in milliseconds to check for changes */
  watchInterval: number;
  /** Callback function to run after reloading configuration */
  onReload?: (newConfig: typeof config) => void;
}

/**
 * Default configuration reload options
 */
const DEFAULT_CONFIG_RELOAD_OPTIONS: ConfigReloadOptions = {
  watchEnvFile: true,
  envFilePath: '.env',
  watchInterval: 10000, // 10 seconds
};

/**
 * Configuration reloader
 * This class provides functionality for reloading configuration at runtime
 */
export class ConfigReloader {
  public options: ConfigReloadOptions;
  private envFileLastModified: number = 0;
  private watchIntervalId: NodeJS.Timeout | null = null;
  private isWatching: boolean = false;

  /**
   * Create a new configuration reloader
   * @param options Configuration reload options
   */
  constructor(options: Partial<ConfigReloadOptions> = {}) {
    this.options = {
      ...DEFAULT_CONFIG_RELOAD_OPTIONS,
      ...options,
    };
  }

  /**
   * Start watching for configuration changes
   */
  public startWatching(): void {
    if (this.isWatching) {
      logger.warn('Configuration reloader is already watching for changes');
      return;
    }

    this.isWatching = true;

    // Check if the .env file exists
    if (this.options.watchEnvFile) {
      try {
        const stats = fs.statSync(this.options.envFilePath);
        this.envFileLastModified = stats.mtimeMs;
        logger.info(`Watching .env file for changes: ${this.options.envFilePath}`);
      } catch (error) {
        logger.warn(`Could not access .env file: ${this.options.envFilePath}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Start the watch interval
    this.watchIntervalId = setInterval(() => {
      this.checkForChanges();
    }, this.options.watchInterval);

    logger.info('Configuration reloader started', {
      watchInterval: this.options.watchInterval,
      watchEnvFile: this.options.watchEnvFile,
    });
  }

  /**
   * Stop watching for configuration changes
   */
  public stopWatching(): void {
    if (!this.isWatching) {
      logger.warn('Configuration reloader is not watching for changes');
      return;
    }

    if (this.watchIntervalId) {
      clearInterval(this.watchIntervalId);
      this.watchIntervalId = null;
    }

    this.isWatching = false;
    logger.info('Configuration reloader stopped');
  }

  /**
   * Check for configuration changes
   */
  private checkForChanges(): void {
    if (this.options.watchEnvFile) {
      try {
        const stats = fs.statSync(this.options.envFilePath);
        const lastModified = stats.mtimeMs;

        // If the file has been modified, reload the configuration
        if (lastModified > this.envFileLastModified) {
          logger.info(`Detected changes in .env file, reloading configuration`);
          this.envFileLastModified = lastModified;
          this.reloadConfig();
        }
      } catch (error) {
        logger.warn(`Could not check .env file for changes: ${this.options.envFilePath}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Reload configuration
   * @returns The new configuration
   */
  public reloadConfig(): typeof config {
    try {
      // Reload environment variables from .env file
      dotenv.config({ path: this.options.envFilePath, override: true });

      // Validate environment variables
      const validatedEnv = validateEnvVars(envVarDefinitions);

      // Update configuration
      this.updateConfig(validatedEnv);

      logger.info('Configuration reloaded successfully');

      // Call the onReload callback if provided
      if (this.options.onReload) {
        this.options.onReload(config);
      }

      return config;
    } catch (error) {
      logger.error('Failed to reload configuration', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update configuration with new values
   * @param validatedEnv Validated environment variables
   */
  private updateConfig(validatedEnv: Record<string, any>): void {
    // Update Frontapp configuration
    config.frontapp.apiKey = validatedEnv.FRONTAPP_API_KEY || config.frontapp.apiKey;

    // Update webhook configuration
    config.webhook.secret = validatedEnv.WEBHOOK_SECRET || config.webhook.secret;
    config.webhook.baseUrl = validatedEnv.WEBHOOK_BASE_URL || config.webhook.baseUrl;

    // Update server configuration
    config.server.port = validatedEnv.PORT || config.server.port;

    // Update logging configuration
    config.logging.level = validatedEnv.LOG_LEVEL || config.logging.level;
    config.logging.metricsInterval = validatedEnv.METRICS_INTERVAL || config.logging.metricsInterval;

    // Update API configuration
    config.api.apiKey = validatedEnv.API_KEY || config.api.apiKey;
    config.api.corsOrigins = validatedEnv.CORS_ORIGINS || config.api.corsOrigins;
    config.api.rateLimitWindowMs = validatedEnv.RATE_LIMIT_WINDOW_MS || config.api.rateLimitWindowMs;
    config.api.rateLimitMax = validatedEnv.RATE_LIMIT_MAX || config.api.rateLimitMax;

    // Update security configuration
    config.security.encryptionKey = validatedEnv.ENCRYPTION_KEY || config.security.encryptionKey;
    config.security.credentialsDir = validatedEnv.CREDENTIALS_DIR || config.security.credentialsDir;

    // Update HTTPS configuration
    if (validatedEnv.HTTPS_ENABLED !== undefined) {
      config.security.https.enabled = validatedEnv.HTTPS_ENABLED;
    }
    config.security.https.cert = validatedEnv.HTTPS_CERT || config.security.https.cert;
    config.security.https.key = validatedEnv.HTTPS_KEY || config.security.https.key;

    // Update rate limiting configuration
    if (validatedEnv.RATE_LIMITING_ENABLED !== undefined) {
      config.security.rateLimiting.enabled = validatedEnv.RATE_LIMITING_ENABLED;
    }
    config.security.rateLimiting.windowMs = validatedEnv.RATE_LIMIT_WINDOW_MS || config.security.rateLimiting.windowMs;
    config.security.rateLimiting.max = validatedEnv.RATE_LIMIT_MAX || config.security.rateLimiting.max;
    config.security.rateLimiting.api.windowMs = validatedEnv.API_RATE_LIMIT_WINDOW_MS || config.security.rateLimiting.api.windowMs;
    config.security.rateLimiting.api.max = validatedEnv.API_RATE_LIMIT_MAX || config.security.rateLimiting.api.max;
    config.security.rateLimiting.auth.windowMs = validatedEnv.AUTH_RATE_LIMIT_WINDOW_MS || config.security.rateLimiting.auth.windowMs;
    config.security.rateLimiting.auth.max = validatedEnv.AUTH_RATE_LIMIT_MAX || config.security.rateLimiting.auth.max;
    config.security.rateLimiting.webhook.windowMs = validatedEnv.WEBHOOK_RATE_LIMIT_WINDOW_MS || config.security.rateLimiting.webhook.windowMs;
    config.security.rateLimiting.webhook.max = validatedEnv.WEBHOOK_RATE_LIMIT_MAX || config.security.rateLimiting.webhook.max;
  }
}

// Export a singleton instance
export const configReloader = new ConfigReloader();

// Export default
export default configReloader;
