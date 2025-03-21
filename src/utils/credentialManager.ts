import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { config } from '../config/index.js';
import logger from './logger.js';

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

/**
 * Credential Manager
 * This utility provides methods for securely storing and retrieving credentials
 */
export class CredentialManager {
  private encryptionKey: Buffer;
  private credentialsPath: string;
  private credentials: Record<string, string> = {};
  private isInitialized: boolean = false;

  constructor() {
    // Get the encryption key from the environment
    const encryptionKeyString = config.security.encryptionKey;
    
    if (!encryptionKeyString) {
      throw new Error('Encryption key is not set in the environment');
    }

    // Convert the encryption key to a Buffer
    this.encryptionKey = Buffer.from(encryptionKeyString, 'hex');

    // Set the credentials path
    this.credentialsPath = path.join(config.security.credentialsDir, 'credentials.enc');
  }

  /**
   * Initialize the credential manager
   * This method loads the credentials from the credentials file
   */
  public async initialize(): Promise<void> {
    try {
      // Create the credentials directory if it doesn't exist
      await this.ensureCredentialsDirectory();

      // Check if the credentials file exists
      try {
        await access(this.credentialsPath, fs.constants.F_OK);
      } catch (error) {
        // Create an empty credentials file if it doesn't exist
        await this.saveCredentials({});
      }

      // Load the credentials
      await this.loadCredentials();

      this.isInitialized = true;
      logger.info('Credential manager initialized');
    } catch (error: any) {
      logger.error('Failed to initialize credential manager', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Ensure the credentials directory exists
   */
  private async ensureCredentialsDirectory(): Promise<void> {
    try {
      // Check if the credentials directory exists
      try {
        await access(config.security.credentialsDir, fs.constants.F_OK);
      } catch (error) {
        // Create the credentials directory if it doesn't exist
        await mkdir(config.security.credentialsDir, { recursive: true });
      }
    } catch (error: any) {
      logger.error('Failed to ensure credentials directory', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Load the credentials from the credentials file
   */
  private async loadCredentials(): Promise<void> {
    try {
      // Read the encrypted credentials file
      const encryptedData = await readFile(this.credentialsPath);

      // Decrypt the credentials
      const decryptedData = this.decrypt(encryptedData);

      // Parse the decrypted data
      this.credentials = JSON.parse(decryptedData);
    } catch (error: any) {
      logger.error('Failed to load credentials', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Save the credentials to the credentials file
   * @param credentials The credentials to save
   */
  private async saveCredentials(credentials: Record<string, string>): Promise<void> {
    try {
      // Stringify the credentials
      const data = JSON.stringify(credentials);

      // Encrypt the credentials
      const encryptedData = this.encrypt(data);

      // Write the encrypted credentials to the file
      await writeFile(this.credentialsPath, encryptedData);
    } catch (error: any) {
      logger.error('Failed to save credentials', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Encrypt data
   * @param data The data to encrypt
   * @returns The encrypted data
   */
  private encrypt(data: string): Buffer {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Create a cipher using the encryption key and initialization vector
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

      // Encrypt the data
      const encryptedData = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final(),
      ]);

      // Return the initialization vector and encrypted data
      return Buffer.concat([iv, encryptedData]);
    } catch (error: any) {
      logger.error('Failed to encrypt data', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Decrypt data
   * @param data The data to decrypt
   * @returns The decrypted data
   */
  private decrypt(data: Buffer): string {
    try {
      // Extract the initialization vector from the data
      const iv = data.slice(0, 16);

      // Extract the encrypted data
      const encryptedData = data.slice(16);

      // Create a decipher using the encryption key and initialization vector
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

      // Decrypt the data
      const decryptedData = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      // Return the decrypted data as a string
      return decryptedData.toString('utf8');
    } catch (error: any) {
      logger.error('Failed to decrypt data', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get a credential
   * @param key The credential key
   * @returns The credential value
   */
  public async getCredential(key: string): Promise<string | null> {
    try {
      // Check if the credential manager is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Return the credential value
      return this.credentials[key] || null;
    } catch (error: any) {
      logger.error(`Failed to get credential: ${key}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Set a credential
   * @param key The credential key
   * @param value The credential value
   */
  public async setCredential(key: string, value: string): Promise<void> {
    try {
      // Check if the credential manager is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Set the credential value
      this.credentials[key] = value;

      // Save the credentials
      await this.saveCredentials(this.credentials);
    } catch (error: any) {
      logger.error(`Failed to set credential: ${key}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete a credential
   * @param key The credential key
   */
  public async deleteCredential(key: string): Promise<void> {
    try {
      // Check if the credential manager is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Delete the credential
      delete this.credentials[key];

      // Save the credentials
      await this.saveCredentials(this.credentials);
    } catch (error: any) {
      logger.error(`Failed to delete credential: ${key}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Check if a credential exists
   * @param key The credential key
   * @returns True if the credential exists, false otherwise
   */
  public async hasCredential(key: string): Promise<boolean> {
    try {
      // Check if the credential manager is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if the credential exists
      return key in this.credentials;
    } catch (error: any) {
      logger.error(`Failed to check credential: ${key}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * List all credential keys
   * @returns An array of credential keys
   */
  public async listCredentialKeys(): Promise<string[]> {
    try {
      // Check if the credential manager is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Return the credential keys
      return Object.keys(this.credentials);
    } catch (error: any) {
      logger.error('Failed to list credential keys', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// Export a singleton instance
export const credentialManager = new CredentialManager();
