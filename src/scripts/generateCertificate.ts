#!/usr/bin/env node

/**
 * Generate Certificate Script
 * This script generates a self-signed certificate for HTTPS development
 * 
 * Usage:
 *   npm run generate-cert [output-dir]
 * 
 * Arguments:
 *   output-dir: The directory to output the certificate and key (default: ./certs)
 * 
 * The script will generate a self-signed certificate and key in the specified directory
 */

import { HttpsUtil } from '../utils/https.js';

// Get the output directory from the command line arguments
const outputDir = process.argv[2] || './certs';

// Generate a self-signed certificate
console.log(`Generating self-signed certificate in ${outputDir}...`);

HttpsUtil.generateSelfSignedCertificate(outputDir)
  .then(({ cert, key }) => {
    console.log('Self-signed certificate generated successfully:');
    console.log(`Certificate: ${cert}`);
    console.log(`Key: ${key}`);
    console.log();
    console.log('Add these paths to your .env file:');
    console.log('HTTPS_ENABLED=true');
    console.log(`HTTPS_CERT=${cert}`);
    console.log(`HTTPS_KEY=${key}`);
    console.log();
    console.log('Note: This is a self-signed certificate for development only.');
    console.log('For production, use a certificate from a trusted certificate authority.');
  })
  .catch((error) => {
    console.error('Failed to generate self-signed certificate:', error);
    process.exit(1);
  });
