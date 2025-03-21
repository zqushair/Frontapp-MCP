# HTTPS Setup Guide

This guide provides information on how to set up HTTPS for the Frontapp MCP integration.

## Overview

The Frontapp MCP integration supports HTTPS for secure communication between clients and the server. HTTPS encrypts the data transmitted between the client and server, protecting it from eavesdropping and tampering.

## Configuration

To enable HTTPS, you need to configure the following environment variables:

- `HTTPS_ENABLED`: Set to `true` to enable HTTPS.
- `HTTPS_CERT`: The path to the SSL certificate file.
- `HTTPS_KEY`: The path to the SSL private key file.

Example configuration in `.env` file:

```
HTTPS_ENABLED=true
HTTPS_CERT=./certs/cert.pem
HTTPS_KEY=./certs/key.pem
```

## Generating a Self-Signed Certificate for Development

For development purposes, you can generate a self-signed certificate using the provided script:

```bash
npm run generate-cert [output-dir]
```

This will generate a self-signed certificate and key in the specified directory (default: `./certs`). The script will output the paths to the certificate and key, which you can add to your `.env` file.

Example output:

```
Generating self-signed certificate in ./certs...
Self-signed certificate generated successfully:
Certificate: ./certs/cert.pem
Key: ./certs/key.pem

Add these paths to your .env file:
HTTPS_ENABLED=true
HTTPS_CERT=./certs/cert.pem
HTTPS_KEY=./certs/key.pem

Note: This is a self-signed certificate for development only.
For production, use a certificate from a trusted certificate authority.
```

### Browser Security Warnings

When using a self-signed certificate, browsers will display a security warning because the certificate is not issued by a trusted certificate authority. This is normal and expected for development environments.

To bypass the warning in Chrome:

1. Click on "Advanced" or "Details"
2. Click on "Proceed to [site] (unsafe)"

To bypass the warning in Firefox:

1. Click on "Advanced"
2. Click on "Accept the Risk and Continue"

## Using a Certificate from a Trusted Certificate Authority

For production environments, you should use a certificate from a trusted certificate authority (CA). There are several CAs that offer free or paid certificates, such as:

- [Let's Encrypt](https://letsencrypt.org/) (free)
- [Certbot](https://certbot.eff.org/) (free, uses Let's Encrypt)
- [DigiCert](https://www.digicert.com/) (paid)
- [Comodo](https://ssl.comodo.com/) (paid)

### Let's Encrypt Example

Let's Encrypt is a popular choice for free SSL certificates. You can use Certbot to obtain and install a Let's Encrypt certificate:

1. Install Certbot: Follow the instructions on the [Certbot website](https://certbot.eff.org/) for your operating system.

2. Obtain a certificate:

```bash
certbot certonly --standalone -d your-domain.com
```

3. Configure the Frontapp MCP integration to use the certificate:

```
HTTPS_ENABLED=true
HTTPS_CERT=/etc/letsencrypt/live/your-domain.com/fullchain.pem
HTTPS_KEY=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

### Certificate Renewal

Let's Encrypt certificates are valid for 90 days. You should set up automatic renewal to ensure your certificate doesn't expire. Certbot can be configured to automatically renew certificates:

```bash
certbot renew --dry-run
```

If the dry run is successful, you can set up a cron job to run `certbot renew` periodically:

```
0 0,12 * * * certbot renew --quiet
```

This will run the renewal process twice a day (at midnight and noon).

## HTTP to HTTPS Redirection

The Frontapp MCP integration can automatically redirect HTTP requests to HTTPS. This is enabled by default when HTTPS is enabled.

When a client makes a request to the HTTP port (default: 80), the server will redirect the request to the HTTPS port (default: 443).

## Implementation Details

The HTTPS implementation in the Frontapp MCP integration uses Node.js's built-in `https` module to create an HTTPS server. The server is configured with the provided certificate and key.

### Server Creation

The server is created using the `HttpsUtil.createServer` method:

```typescript
import { HttpsUtil } from './utils/https.js';
import express from 'express';

// Create an Express application
const app = express();

// Create an HTTP or HTTPS server based on configuration
const server = HttpsUtil.createServer(app);

// Start the server
const port = config.server.port;
server.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
```

### HTTP to HTTPS Redirection

If HTTPS is enabled, the server will also create an HTTP server that redirects all requests to HTTPS:

```typescript
import { HttpsUtil } from './utils/https.js';
import express from 'express';

// Create an Express application
const app = express();

// Create an HTTPS server
const httpsServer = HttpsUtil.createServer(app);

// Create an HTTP server that redirects to HTTPS
const httpServer = HttpsUtil.createHttpToHttpsRedirectServer(app, config.server.port);

// Start the servers
const httpsPort = config.server.port;
const httpPort = 80;

httpsServer.listen(httpsPort, () => {
  logger.info(`HTTPS server listening on port ${httpsPort}`);
});

httpServer.listen(httpPort, () => {
  logger.info(`HTTP to HTTPS redirect server listening on port ${httpPort}`);
});
```

## Security Considerations

### Certificate Security

The security of your HTTPS implementation depends on the security of your certificate and private key. Follow these best practices:

1. **Protect Your Private Key**: Keep your private key secure and restrict access to it.
2. **Use Strong Encryption**: Use a strong encryption algorithm for your certificate (e.g., RSA with at least 2048 bits or ECC with at least 256 bits).
3. **Renew Certificates Before Expiry**: Set up automatic renewal for your certificates to avoid expiry.
4. **Use a Trusted CA**: For production environments, use a certificate from a trusted certificate authority.

### HTTPS Configuration

The HTTPS server should be configured with secure settings:

1. **Use TLS 1.2 or Higher**: Disable older, insecure protocols like SSL 3.0, TLS 1.0, and TLS 1.1.
2. **Use Strong Cipher Suites**: Configure the server to use strong cipher suites and disable weak ones.
3. **Enable HSTS**: Use HTTP Strict Transport Security (HSTS) to instruct browsers to only use HTTPS.
4. **Use Secure Cookies**: Set the `secure` flag on cookies to ensure they are only sent over HTTPS.

## Troubleshooting

### Certificate Issues

If you encounter issues with your certificate, check the following:

1. **Certificate Path**: Ensure that the path to the certificate file is correct.
2. **Key Path**: Ensure that the path to the private key file is correct.
3. **File Permissions**: Ensure that the application has permission to read the certificate and key files.
4. **Certificate Validity**: Check if the certificate is valid and not expired.
5. **Certificate Chain**: Ensure that the certificate chain is complete and valid.

### Server Issues

If you encounter issues with the HTTPS server, check the following:

1. **Port Availability**: Ensure that the HTTPS port is available and not in use by another application.
2. **Firewall Rules**: Ensure that the firewall allows incoming connections on the HTTPS port.
3. **Server Logs**: Check the server logs for error messages related to HTTPS.

## Best Practices

1. **Use HTTPS in Production**: Always use HTTPS in production environments to protect sensitive data.
2. **Use a Trusted CA**: For production environments, use a certificate from a trusted certificate authority.
3. **Renew Certificates Before Expiry**: Set up automatic renewal for your certificates to avoid expiry.
4. **Redirect HTTP to HTTPS**: Configure the server to redirect HTTP requests to HTTPS to ensure all traffic is encrypted.
5. **Use Secure Cookies**: Set the `secure` flag on cookies to ensure they are only sent over HTTPS.
6. **Enable HSTS**: Use HTTP Strict Transport Security (HSTS) to instruct browsers to only use HTTPS.
7. **Keep Your Private Key Secure**: Protect your private key and restrict access to it.
8. **Use Strong Encryption**: Use a strong encryption algorithm for your certificate and configure the server to use strong cipher suites.
