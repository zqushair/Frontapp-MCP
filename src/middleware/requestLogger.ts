import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logStream, createRequestLogger } from '../utils/logger.js';
import { metricsTracker } from '../utils/monitoring.js';

// Create a custom token for request ID
morgan.token('request-id', (req: Request) => {
  return req.id || '-';
});

// Create a custom token for user agent
morgan.token('user-agent', (req: Request) => {
  return String(req.headers['user-agent'] || '-');
});

// Create a custom format that includes the request ID
const logFormat =
  ':request-id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Middleware to assign a unique ID to each request
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.id = uuidv4();
  
  // Add the request ID to the response headers
  res.setHeader('X-Request-ID', req.id);
  
  // Create a request-specific logger
  req.logger = createRequestLogger(req.id);
  
  next();
}

// Middleware to log HTTP requests using Morgan
export const httpLogger = morgan(logFormat, {
  stream: logStream,
});

// Middleware to track request metrics
export function requestMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Record start time
  const startTime = Date.now();
  
  // Increment request count
  metricsTracker.incrementRequestCount();
  
  // Track response time on response finish
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metricsTracker.addResponseTime(responseTime);
    
    // If it's an error response, increment error count
    if (res.statusCode >= 400) {
      metricsTracker.incrementErrorCount();
    }
  });
  
  next();
}

// Middleware to log request body for debugging (only in development)
export function requestBodyLogger(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'production' && req.method !== 'GET') {
    req.logger?.debug('Request body', { body: req.body });
  }
  next();
}

// Extend the Express Request interface to include our custom properties
declare global {
  namespace Express {
    interface Request {
      id?: string;
      logger?: ReturnType<typeof createRequestLogger>;
    }
  }
}
