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

/**
 * Rolling window statistics for efficient response time tracking
 * This class maintains running statistics without storing individual data points
 */
class RollingStats {
  private count: number = 0;
  private sum: number = 0;
  private sumOfSquares: number = 0;
  private min: number = Number.MAX_VALUE;
  private max: number = Number.MIN_VALUE;
  private readonly windowSize: number;
  private readonly decayFactor: number;
  
  /**
   * Create a new rolling statistics tracker
   * @param windowSize The approximate number of data points to consider
   */
  constructor(windowSize: number = 1000) {
    this.windowSize = windowSize;
    // Calculate decay factor based on window size
    // This ensures older values have less weight as new values are added
    this.decayFactor = 1 - (1 / windowSize);
  }
  
  /**
   * Add a new value to the statistics
   * @param value The value to add
   */
  public add(value: number): void {
    // Apply decay factor to existing statistics
    this.sum *= this.decayFactor;
    this.sumOfSquares *= this.decayFactor;
    this.count = Math.min(this.count + 1, this.windowSize);
    
    // Update statistics with new value
    this.sum += value;
    this.sumOfSquares += value * value;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
  }
  
  /**
   * Get the mean (average) of the values
   * @returns The mean value
   */
  public mean(): number {
    return this.count > 0 ? this.sum / this.count : 0;
  }
  
  /**
   * Get the variance of the values
   * @returns The variance
   */
  public variance(): number {
    if (this.count <= 1) return 0;
    const mean = this.mean();
    return Math.max(0, this.sumOfSquares / this.count - mean * mean);
  }
  
  /**
   * Get the standard deviation of the values
   * @returns The standard deviation
   */
  public stdDev(): number {
    return Math.sqrt(this.variance());
  }
  
  /**
   * Get the minimum value
   * @returns The minimum value
   */
  public getMin(): number {
    return this.count > 0 ? this.min : 0;
  }
  
  /**
   * Get the maximum value
   * @returns The maximum value
   */
  public getMax(): number {
    return this.count > 0 ? this.max : 0;
  }
  
  /**
   * Get the number of values
   * @returns The count
   */
  public getCount(): number {
    return this.count;
  }
  
  /**
   * Reset the statistics
   */
  public reset(): void {
    this.count = 0;
    this.sum = 0;
    this.sumOfSquares = 0;
    this.min = Number.MAX_VALUE;
    this.max = Number.MIN_VALUE;
  }
}

/**
 * Extended application metrics interface with additional statistics
 */
interface ExtendedApplicationMetrics extends ApplicationMetrics {
  responseTimeStats: {
    min: number;
    max: number;
    stdDev: number;
    count: number;
  };
}

/**
 * Class to track application metrics
 * Uses efficient statistical tracking for response times
 */
class MetricsTracker {
  private requestCount = 0;
  private errorCount = 0;
  private webhookCount = 0;
  private responseTimeStats: RollingStats;
  
  constructor() {
    this.responseTimeStats = new RollingStats(1000); // Track ~1000 most recent requests
  }

  /**
   * Increment request count
   */
  public incrementRequestCount(): void {
    this.requestCount++;
  }

  /**
   * Increment error count
   */
  public incrementErrorCount(): void {
    this.errorCount++;
  }

  /**
   * Increment webhook count
   */
  public incrementWebhookCount(): void {
    this.webhookCount++;
  }

  /**
   * Add response time
   * @param time Response time in milliseconds
   */
  public addResponseTime(time: number): void {
    this.responseTimeStats.add(time);
  }

  /**
   * Get average response time
   * @returns The average response time
   */
  public getAverageResponseTime(): number {
    return this.responseTimeStats.mean();
  }

  /**
   * Get application metrics
   * @returns Application metrics
   */
  public getMetrics(): ExtendedApplicationMetrics {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      webhookCount: this.webhookCount,
      averageResponseTime: this.getAverageResponseTime(),
      responseTimeStats: {
        min: this.responseTimeStats.getMin(),
        max: this.responseTimeStats.getMax(),
        stdDev: this.responseTimeStats.stdDev(),
        count: this.responseTimeStats.getCount()
      }
    };
  }

  /**
   * Reset metrics (for testing or periodic resets)
   */
  public reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.webhookCount = 0;
    this.responseTimeStats.reset();
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
