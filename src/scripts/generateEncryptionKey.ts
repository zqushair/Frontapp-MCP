#!/usr/bin/env node

/**
 * Generate Encryption Key Script
 * This script generates a secure encryption key for use with the credential manager
 * 
 * Usage:
 *   npm run generate-key
 * 
 * The script will output a secure encryption key that can be used for the ENCRYPTION_KEY environment variable
 */

import crypto from 'crypto';

// Generate a secure encryption key (32 bytes = 256 bits, suitable for AES-256)
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Generated encryption key:');
console.log(encryptionKey);
console.log();
console.log('Add this key to your .env file:');
console.log('ENCRYPTION_KEY=' + encryptionKey);
