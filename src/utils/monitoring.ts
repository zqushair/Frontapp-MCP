import os from 'os';
import logger from './logger.js';

// Interface for system metrics
interface SystemMetrics {
  uptime: number;
  cpuUsage: number;
  memoryUsage: {
    total: number;
    free: number;
    used: number;
    usedPercentage: number;
  };
  processMemoryUsage: NodeJS.MemoryUsage;
}

// Interface for application metrics
interface ApplicationMetrics {
  requestCount: number;
  errorCount: number;
  webhookCount: number;
  averageResponseTime: number;
}

// Class to track application metrics
class MetricsTracker {
  private requestCount = 0;
  private errorCount = 0;
  private webhookCount = 0;
  private responseTimes: number[] = [];
  private readonly maxResponseTimes = 1000; // Keep only the last 1000 response times

  // Increment request count
  public incrementRequestCount(): void {
    this.requestCount++;
  }

  // Increment error count
  public incrementErrorCount(): void {
    this.errorCount++;
  }

  // Increment webhook count
  public incrementWebhookCount(): void {
    this.webhookCount++;
  }

  // Add response time
  public addResponseTime(time: number): void {
    this.responseTimes.push(time);
    // Keep only the last maxResponseTimes entries
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
  }

  // Get average response time
  public getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) {
      return 0;
    }
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  // Get application metrics
  public getMetrics(): ApplicationMetrics {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      webhookCount: this.webhookCount,
      averageResponseTime: this.getAverageResponseTime(),
    };
  }

  // Reset metrics (for testing or periodic resets)
  public reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.webhookCount = 0;
    this.responseTimes = [];
  }
}

// Create a singleton instance of the metrics tracker
export const metricsTracker = new MetricsTracker();

// Get system metrics
export function getSystemMetrics(): SystemMetrics {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usedPercentage = (usedMemory / totalMemory) * 100;

  return {
    uptime: process.uptime(),
    cpuUsage: os.loadavg()[0], // 1 minute load average
    memoryUsage: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usedPercentage,
    },
    processMemoryUsage: process.memoryUsage(),
  };
}

// Get all metrics (system and application)
export function getAllMetrics(): { system: SystemMetrics; application: ApplicationMetrics } {
  return {
    system: getSystemMetrics(),
    application: metricsTracker.getMetrics(),
  };
}

// Log metrics periodically
export function startMetricsLogging(intervalMs = 60000): NodeJS.Timeout {
  return setInterval(() => {
    const metrics = getAllMetrics();
    logger.info('System metrics', { metrics: metrics.system });
    logger.info('Application metrics', { metrics: metrics.application });
  }, intervalMs);
}

// Middleware to track request metrics
export function requestMetricsMiddleware(
  req: any,
  res: any,
  next: () => void
): void {
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

// Health check function
export function healthCheck(): { status: string; timestamp: string; version: string } {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  };
}
