import { describe, it, expect, jest } from '@jest/globals';
import fs from 'fs';
import https from 'https';
import http from 'http';
import express from 'express';
import { HttpsUtil } from '../../src/utils/https.js';

// Mock the config to use test certificates
jest.mock('../../src/config/index.js', () => ({
  config: {
    security: {
      https: {
        enabled: true,
        cert: './tests/security/test-certs/cert.pem',
        key: './tests/security/test-certs/key.pem',
      },
    },
  },
}));

// Mock fs
jest.mock('fs', () => {
  return {
    readFileSync: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    unlinkSync: jest.fn(),
    // Add other methods as needed
    constants: {
      F_OK: 0,
      R_OK: 4,
      W_OK: 2,
      X_OK: 1,
    },
    promises: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    },
  };
});

// Mock https
jest.mock('https', () => {
  return {
    createServer: jest.fn(),
  };
});

// Mock http
jest.mock('http', () => {
  return {
    createServer: jest.fn(),
  };
});

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('HTTPS Utility', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createServer', () => {
    it('should create an HTTPS server when HTTPS is enabled', () => {
      // Mock fs.readFileSync to return test certificates
      (fs.readFileSync as jest.Mock).mockReturnValueOnce('test-cert').mockReturnValueOnce('test-key');

      // Mock https.createServer to return a test server
      const mockHttpsServer = { test: 'https-server' };
      (https.createServer as jest.Mock).mockReturnValueOnce(mockHttpsServer);

      // Create an Express app
      const app = express();

      // Create a server
      const server = HttpsUtil.createServer(app);

      // Check that fs.readFileSync was called with the correct arguments
      expect(fs.readFileSync).toHaveBeenCalledWith('./tests/security/test-certs/cert.pem');
      expect(fs.readFileSync).toHaveBeenCalledWith('./tests/security/test-certs/key.pem');

      // Check that https.createServer was called with the correct arguments
      expect(https.createServer).toHaveBeenCalledWith({ cert: 'test-cert', key: 'test-key' }, app);

      // Check that the server was returned
      expect(server).toBe(mockHttpsServer);
    });

    it('should throw an error when HTTPS is enabled but certificates are not provided', () => {
      // Mock config to have HTTPS enabled but no certificates
      jest.resetModules();
      jest.mock('../../src/config/index.js', () => ({
        config: {
          security: {
            https: {
              enabled: true,
              cert: '',
              key: '',
            },
          },
        },
      }));

      // Create an Express app
      const app = express();

      // Check that createServer throws an error
      expect(() => HttpsUtil.createServer(app)).toThrow('HTTPS is enabled but certificate or key is not provided');
    });

    it('should create an HTTP server when HTTPS is disabled', () => {
      // Mock config to have HTTPS disabled
      jest.resetModules();
      jest.mock('../../src/config/index.js', () => ({
        config: {
          security: {
            https: {
              enabled: false,
              cert: '',
              key: '',
            },
          },
        },
      }));

      // Mock http.createServer to return a test server
      const mockHttpServer = { test: 'http-server' };
      (http.createServer as jest.Mock).mockReturnValueOnce(mockHttpServer);

      // Create an Express app
      const app = express();

      // Create a server
      const server = HttpsUtil.createServer(app);

      // Check that http.createServer was called with the correct arguments
      expect(http.createServer).toHaveBeenCalledWith(app);

      // Check that the server was returned
      expect(server).toBe(mockHttpServer);
    });
  });

  describe('generateSelfSignedCertificate', () => {
    it('should generate a self-signed certificate', async () => {
      // Mock fs.existsSync to return false (certificates don't exist)
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Mock child_process.execSync to do nothing
      const { execSync } = require('child_process');
      execSync.mockImplementation(() => {});

      // Generate a self-signed certificate
      const result = await HttpsUtil.generateSelfSignedCertificate('./tests/security/test-certs');

      // Check that fs.mkdirSync was called with the correct arguments
      expect(fs.mkdirSync).toHaveBeenCalledWith('./tests/security/test-certs', { recursive: true });

      // Check that execSync was called with the correct arguments
      expect(execSync).toHaveBeenCalledTimes(3);
      expect(execSync).toHaveBeenCalledWith(
        'openssl genrsa -out "./tests/security/test-certs/key.pem" 2048',
        { stdio: 'inherit' }
      );
      expect(execSync).toHaveBeenCalledWith(
        'openssl req -new -key "./tests/security/test-certs/key.pem" -out "./tests/security/test-certs/cert.csr" -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"',
        { stdio: 'inherit' }
      );
      expect(execSync).toHaveBeenCalledWith(
        'openssl x509 -req -days 365 -in "./tests/security/test-certs/cert.csr" -signkey "./tests/security/test-certs/key.pem" -out "./tests/security/test-certs/cert.pem"',
        { stdio: 'inherit' }
      );

      // Check that fs.unlinkSync was called with the correct arguments
      expect(fs.unlinkSync).toHaveBeenCalledWith('./tests/security/test-certs/cert.csr');

      // Check that the result is correct
      expect(result).toEqual({
        cert: './tests/security/test-certs/cert.pem',
        key: './tests/security/test-certs/key.pem',
      });
    });

    it('should return existing certificates if they exist', async () => {
      // Mock fs.existsSync to return true (certificates exist)
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Generate a self-signed certificate
      const result = await HttpsUtil.generateSelfSignedCertificate('./tests/security/test-certs');

      // Check that fs.mkdirSync was called with the correct arguments
      expect(fs.mkdirSync).toHaveBeenCalledWith('./tests/security/test-certs', { recursive: true });

      // Check that execSync was not called
      const { execSync } = require('child_process');
      expect(execSync).not.toHaveBeenCalled();

      // Check that the result is correct
      expect(result).toEqual({
        cert: './tests/security/test-certs/cert.pem',
        key: './tests/security/test-certs/key.pem',
      });
    });
  });

  describe('createHttpToHttpsRedirectServer', () => {
    it('should create an HTTP server that redirects to HTTPS', () => {
      // Mock http.createServer to return a test server
      const mockHttpServer = { test: 'http-server' };
      (http.createServer as jest.Mock).mockReturnValueOnce(mockHttpServer);

      // Create an Express app
      const app = express();

      // Create a redirect server
      const server = HttpsUtil.createHttpToHttpsRedirectServer(app, 443);

      // Check that http.createServer was called
      expect(http.createServer).toHaveBeenCalled();

      // Check that the server was returned
      expect(server).toBe(mockHttpServer);
    });
  });
});
