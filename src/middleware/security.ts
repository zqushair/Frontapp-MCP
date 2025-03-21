import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

// Configure CORS options
const corsOptions = {
  origin: config.api.corsOrigins || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: config.api.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes by default
  max: config.api.rateLimitMax || 100, // 100 requests per windowMs by default
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  handler: (req: Request, res: Response, _next: NextFunction, options: any) => {
    req.logger?.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    res.status(options.statusCode).json({
      status: 'error',
      message: options.message,
    });
  },
});

// API key authentication middleware
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  
  // Skip authentication for health check and OPTIONS requests
  if (req.path.startsWith('/health') || req.method === 'OPTIONS') {
    next();
    return;
  }
  
  // Validate API key
  if (!apiKey || apiKey !== config.api.apiKey) {
    req.logger?.warn('Invalid API key', { ip: req.ip, path: req.path });
    
    res.status(401).json({
      status: 'error',
      message: 'Invalid API key',
    });
    return;
  }
  
  next();
}

// Export middleware
export const securityMiddleware = [
  // Apply Helmet for security headers
  helmet(),
  
  // Apply CORS
  cors(corsOptions),
  
  // Apply rate limiting
  apiLimiter,
];
