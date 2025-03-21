import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { credentialManager } from '../../src/utils/credentialManager.js';

// Mock the config to use a test directory
jest.mock('../../src/config/index.js', () => ({
  config: {
    security: {
      encryptionKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      credentialsDir: './tests/security/test-credentials',
    },
  },
}));

describe('Credential Manager', () => {
  const testCredentialsDir = './tests/security/test-credentials';
  const testCredentialsFile = path.join(testCredentialsDir, 'credentials.enc');

  // Clean up before and after tests
  beforeEach(async () => {
    // Create test credentials directory if it doesn't exist
    if (!fs.existsSync(testCredentialsDir)) {
      fs.mkdirSync(testCredentialsDir, { recursive: true });
    }

    // Delete test credentials file if it exists
    if (fs.existsSync(testCredentialsFile)) {
      fs.unlinkSync(testCredentialsFile);
    }

    // Initialize the credential manager
    await credentialManager.initialize();
  });

  afterEach(async () => {
    // Delete test credentials file if it exists
    if (fs.existsSync(testCredentialsFile)) {
      fs.unlinkSync(testCredentialsFile);
    }

    // Delete test credentials directory if it exists
    if (fs.existsSync(testCredentialsDir)) {
      fs.rmdirSync(testCredentialsDir);
    }
  });

  it('should store and retrieve a credential', async () => {
    // Store a credential
    await credentialManager.setCredential('test_key', 'test_value');

    // Retrieve the credential
    const value = await credentialManager.getCredential('test_key');

    // Check that the credential was retrieved correctly
    expect(value).toBe('test_value');
  });

  it('should return null for a non-existent credential', async () => {
    // Retrieve a non-existent credential
    const value = await credentialManager.getCredential('non_existent_key');

    // Check that the credential is null
    expect(value).toBeNull();
  });

  it('should check if a credential exists', async () => {
    // Store a credential
    await credentialManager.setCredential('test_key', 'test_value');

    // Check if the credential exists
    const exists = await credentialManager.hasCredential('test_key');
    const nonExistentExists = await credentialManager.hasCredential('non_existent_key');

    // Check that the credential exists
    expect(exists).toBe(true);
    expect(nonExistentExists).toBe(false);
  });

  it('should delete a credential', async () => {
    // Store a credential
    await credentialManager.setCredential('test_key', 'test_value');

    // Delete the credential
    await credentialManager.deleteCredential('test_key');

    // Check that the credential was deleted
    const value = await credentialManager.getCredential('test_key');
    expect(value).toBeNull();
  });

  it('should list credential keys', async () => {
    // Store multiple credentials
    await credentialManager.setCredential('test_key1', 'test_value1');
    await credentialManager.setCredential('test_key2', 'test_value2');
    await credentialManager.setCredential('test_key3', 'test_value3');

    // List the credential keys
    const keys = await credentialManager.listCredentialKeys();

    // Check that the keys were listed correctly
    expect(keys).toContain('test_key1');
    expect(keys).toContain('test_key2');
    expect(keys).toContain('test_key3');
    expect(keys.length).toBe(3);
  });

  it('should encrypt and decrypt credentials correctly', async () => {
    // Store a credential
    await credentialManager.setCredential('test_key', 'test_value');

    // Check that the credentials file exists
    expect(fs.existsSync(testCredentialsFile)).toBe(true);

    // Read the credentials file
    const encryptedData = fs.readFileSync(testCredentialsFile, 'utf8');

    // Check that the credentials are encrypted (not plaintext)
    expect(encryptedData).not.toContain('test_key');
    expect(encryptedData).not.toContain('test_value');

    // Retrieve the credential
    const value = await credentialManager.getCredential('test_key');

    // Check that the credential was decrypted correctly
    expect(value).toBe('test_value');
  });

  it('should handle special characters in credentials', async () => {
    // Store a credential with special characters
    const specialValue = 'test_value!@#$%^&*()_+-=[]{}|;:\'",.<>/?`~';
    await credentialManager.setCredential('test_key', specialValue);

    // Retrieve the credential
    const value = await credentialManager.getCredential('test_key');

    // Check that the credential was retrieved correctly
    expect(value).toBe(specialValue);
  });

  it('should handle empty values', async () => {
    // Store a credential with an empty value
    await credentialManager.setCredential('test_key', '');

    // Retrieve the credential
    const value = await credentialManager.getCredential('test_key');

    // Check that the credential was retrieved correctly
    expect(value).toBe('');
  });

  it('should handle null values', async () => {
    // Store a credential with a null value
    await credentialManager.setCredential('test_key', null as any);

    // Retrieve the credential
    const value = await credentialManager.getCredential('test_key');

    // Check that the credential was retrieved correctly
    expect(value).toBeNull();
  });

  it('should handle undefined values', async () => {
    // Store a credential with an undefined value
    await credentialManager.setCredential('test_key', undefined as any);

    // Retrieve the credential
    const value = await credentialManager.getCredential('test_key');

    // Check that the credential was retrieved correctly
    expect(value).toBeNull();
  });

  it('should handle overwriting existing credentials', async () => {
    // Store a credential
    await credentialManager.setCredential('test_key', 'test_value');

    // Overwrite the credential
    await credentialManager.setCredential('test_key', 'new_value');

    // Retrieve the credential
    const value = await credentialManager.getCredential('test_key');

    // Check that the credential was overwritten correctly
    expect(value).toBe('new_value');
  });
});
