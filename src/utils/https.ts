import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import express from 'express';
import { config } from '../config/index.js';
import logger from './logger.js';

/**
 * HTTPS Utility
 * This utility provides methods for setting up HTTPS for the server
 */
export class HttpsUtil {
  /**
   * Create an HTTP or HTTPS server based on configuration
   * @param app The Express application
   * @returns An HTTP or HTTPS server
   */
  public static createServer(app: express.Application): http.Server | https.Server {
    // Check if HTTPS is enabled
    if (config.security.https.enabled) {
      // Check if the certificate and key are provided
      if (!config.security.https.cert || !config.security.https.key) {
        logger.error('HTTPS is enabled but certificate or key is not provided');
        throw new Error('HTTPS is enabled but certificate or key is not provided');
      }

      try {
        // Read the certificate and key
        const cert = fs.readFileSync(config.security.https.cert);
        const key = fs.readFileSync(config.security.https.key);

        // Create an HTTPS server
        logger.info('Creating HTTPS server');
        return https.createServer({ cert, key }, app);
      } catch (error: any) {
        logger.error('Failed to create HTTPS server', {
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }
    } else {
      // Create an HTTP server
      logger.info('Creating HTTP server');
      return http.createServer(app);
    }
  }

  /**
   * Generate a self-signed certificate for development
   * @param outputDir The directory to output the certificate and key
   * @returns The paths to the certificate and key
   */
  public static async generateSelfSignedCertificate(
    outputDir: string = './certs'
  ): Promise<{ cert: string; key: string }> {
    try {
      // Create the output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Set the paths for the certificate and key
      const certPath = path.join(outputDir, 'cert.pem');
      const keyPath = path.join(outputDir, 'key.pem');

      // Check if the certificate and key already exist
      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        logger.info('Self-signed certificate already exists');
        return { cert: certPath, key: keyPath };
      }

      // Generate a self-signed certificate using OpenSSL
      logger.info('Generating self-signed certificate');
      const { execSync } = require('child_process');

      // Generate a private key
      execSync(
        `openssl genrsa -out "${keyPath}" 2048`,
        { stdio: 'inherit' }
      );

      // Generate a certificate signing request
      execSync(
        `openssl req -new -key "${keyPath}" -out "${path.join(outputDir, 'cert.csr')}" -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`,
        { stdio: 'inherit' }
      );

      // Generate a self-signed certificate
      execSync(
        `openssl x509 -req -days 365 -in "${path.join(outputDir, 'cert.csr')}" -signkey "${keyPath}" -out "${certPath}"`,
        { stdio: 'inherit' }
      );

      // Remove the certificate signing request
      fs.unlinkSync(path.join(outputDir, 'cert.csr'));

      logger.info('Self-signed certificate generated successfully');
      return { cert: certPath, key: keyPath };
    } catch (error: any) {
      logger.error('Failed to generate self-signed certificate', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Redirect HTTP to HTTPS
   * @param app The Express application
   * @param httpsPort The HTTPS port
   * @returns An HTTP server that redirects to HTTPS
   */
  public static createHttpToHttpsRedirectServer(
    app: express.Application,
    httpsPort: number
  ): http.Server {
    // Create a new Express application for HTTP
    const httpApp = express();

    // Redirect all HTTP requests to HTTPS
    httpApp.use((req, res, next) => {
      // Get the host from the request
      const host = req.headers.host?.split(':')[0] || 'localhost';

      // Redirect to HTTPS
      res.redirect(`https://${host}:${httpsPort}${req.url}`);
    });

    // Create an HTTP server
    logger.info('Creating HTTP to HTTPS redirect server');
    return http.createServer(httpApp);
  }
}
