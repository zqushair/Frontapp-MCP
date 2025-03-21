# Secure Credential Storage Guide

This guide provides information on how to use the secure credential storage system in the Frontapp MCP integration.

## Overview

The Frontapp MCP integration includes a secure credential storage system that allows you to store sensitive information, such as API keys, passwords, and other credentials, in an encrypted format. This system helps protect sensitive information from unauthorized access.

## How It Works

The credential storage system uses AES-256 encryption to securely store credentials in a file on disk. The encryption key is provided through an environment variable, ensuring that the credentials can only be accessed by authorized users who have the key.

### Key Features

- **Encryption**: All credentials are encrypted using AES-256, a strong encryption algorithm.
- **Secure Key Management**: The encryption key is stored as an environment variable, not in the codebase.
- **File-Based Storage**: Credentials are stored in an encrypted file, making them persistent across application restarts.
- **Simple API**: The credential manager provides a simple API for storing, retrieving, and managing credentials.

## Configuration

To use the secure credential storage system, you need to configure the following environment variables:

- `ENCRYPTION_KEY`: A secure encryption key used to encrypt and decrypt credentials. This should be a 64-character hexadecimal string (32 bytes).
- `CREDENTIALS_DIR`: (Optional) The directory where the encrypted credentials file will be stored. Defaults to `./credentials`.

### Generating an Encryption Key

You can generate a secure encryption key using the provided script:

```bash
npm run generate-key
```

This will output a secure encryption key that you can add to your `.env` file:

```
ENCRYPTION_KEY=your_generated_key_here
```

## Using the Credential Manager

The credential manager provides methods for storing, retrieving, and managing credentials.

### Initializing the Credential Manager

The credential manager is automatically initialized when you first use it, but you can also initialize it explicitly:

```typescript
import { credentialManager } from '../utils/credentialManager.js';

// Initialize the credential manager
await credentialManager.initialize();
```

### Storing Credentials

To store a credential:

```typescript
import { credentialManager } from '../utils/credentialManager.js';

// Store a credential
await credentialManager.setCredential('api_key', 'your_api_key_here');
```

### Retrieving Credentials

To retrieve a credential:

```typescript
import { credentialManager } from '../utils/credentialManager.js';

// Retrieve a credential
const apiKey = await credentialManager.getCredential('api_key');

if (apiKey) {
  // Use the API key
  console.log(`API Key: ${apiKey}`);
} else {
  console.log('API Key not found');
}
```

### Checking if a Credential Exists

To check if a credential exists:

```typescript
import { credentialManager } from '../utils/credentialManager.js';

// Check if a credential exists
const hasApiKey = await credentialManager.hasCredential('api_key');

if (hasApiKey) {
  console.log('API Key exists');
} else {
  console.log('API Key does not exist');
}
```

### Deleting Credentials

To delete a credential:

```typescript
import { credentialManager } from '../utils/credentialManager.js';

// Delete a credential
await credentialManager.deleteCredential('api_key');
```

### Listing Credential Keys

To list all credential keys:

```typescript
import { credentialManager } from '../utils/credentialManager.js';

// List all credential keys
const keys = await credentialManager.listCredentialKeys();

console.log('Credential Keys:');
keys.forEach((key) => {
  console.log(`- ${key}`);
});
```

## Integration with Frontapp API Client

The credential manager can be used to securely store the Frontapp API key and other sensitive information used by the Frontapp API client.

### Example: Storing the Frontapp API Key

```typescript
import { credentialManager } from '../utils/credentialManager.js';
import { config } from '../config/index.js';

// Store the Frontapp API key
await credentialManager.setCredential('frontapp_api_key', config.frontapp.apiKey);
```

### Example: Retrieving the Frontapp API Key

```typescript
import { credentialManager } from '../utils/credentialManager.js';

// Retrieve the Frontapp API key
const apiKey = await credentialManager.getCredential('frontapp_api_key');

if (apiKey) {
  // Use the API key
  const frontappClient = new FrontappClient(apiKey);
} else {
  throw new Error('Frontapp API key not found');
}
```

## Security Considerations

### Encryption Key Management

The encryption key is the most critical component of the credential storage system. If the encryption key is compromised, all stored credentials are at risk. Follow these best practices for managing the encryption key:

1. **Use a Strong Key**: Generate a strong encryption key using the provided script.
2. **Protect the Key**: Store the encryption key securely, such as in a password manager or a secure environment variable management system.
3. **Rotate the Key**: Periodically rotate the encryption key to reduce the risk of compromise.

### Credential File Security

The encrypted credentials file contains sensitive information, even though it is encrypted. Follow these best practices for securing the credentials file:

1. **Restrict Access**: Ensure that only authorized users have access to the credentials file.
2. **Backup Securely**: If you back up the credentials file, ensure that the backups are also secured.
3. **Delete When Not Needed**: Delete the credentials file when it is no longer needed.

### Environment Variable Security

The encryption key is stored as an environment variable, which means it is accessible to anyone who has access to the environment. Follow these best practices for securing environment variables:

1. **Restrict Access**: Ensure that only authorized users have access to the environment variables.
2. **Use a Secure Environment Variable Management System**: Consider using a secure environment variable management system, such as AWS Parameter Store or HashiCorp Vault.
3. **Don't Log Environment Variables**: Ensure that environment variables are not logged or exposed in error messages.

## Troubleshooting

### Encryption Key Issues

If you encounter issues with the encryption key, check the following:

1. **Key Format**: Ensure that the encryption key is a 64-character hexadecimal string (32 bytes).
2. **Environment Variable**: Ensure that the `ENCRYPTION_KEY` environment variable is set correctly.
3. **Key Rotation**: If you have rotated the encryption key, ensure that you have re-encrypted all credentials with the new key.

### Credential File Issues

If you encounter issues with the credentials file, check the following:

1. **File Permissions**: Ensure that the application has permission to read and write the credentials file.
2. **Directory Permissions**: Ensure that the application has permission to create the credentials directory if it doesn't exist.
3. **Disk Space**: Ensure that there is sufficient disk space for the credentials file.

### Other Issues

If you encounter other issues with the credential manager, check the application logs for error messages. The credential manager logs detailed error messages that can help diagnose issues.

## Best Practices

1. **Use Strong Encryption Keys**: Generate strong encryption keys using the provided script.
2. **Protect Sensitive Information**: Use the credential manager to store all sensitive information, such as API keys and passwords.
3. **Limit Access**: Restrict access to the encryption key and credentials file to authorized users only.
4. **Rotate Keys**: Periodically rotate the encryption key to reduce the risk of compromise.
5. **Monitor Access**: Monitor access to the credentials file and encryption key to detect unauthorized access.
6. **Backup Securely**: If you back up the credentials file, ensure that the backups are also secured.
7. **Delete When Not Needed**: Delete credentials when they are no longer needed.
