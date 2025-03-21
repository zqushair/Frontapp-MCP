import express, { Request, Response } from 'express';
import { healthCheck, getAllMetrics } from '../utils/monitoring.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /health
 * @desc Basic health check endpoint
 * @access Public
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const health = healthCheck();
    return res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    return res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

/**
 * @route GET /health/metrics
 * @desc Get system and application metrics
 * @access Private (should be protected in production)
 */
router.get('/metrics', (_req: Request, res: Response) => {
  try {
    const metrics = getAllMetrics();
    return res.status(200).json(metrics);
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    return res.status(500).json({ status: 'error', message: 'Failed to get metrics' });
  }
});

/**
 * @route GET /health/logs
 * @desc Get recent logs (for development only)
 * @access Private (should be disabled in production)
 */
router.get('/logs', (_req: Request, res: Response) => {
  // This endpoint should be disabled in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ status: 'error', message: 'Endpoint disabled in production' });
  }

  try {
    // In a real implementation, you might fetch recent logs from a file or database
    // For now, we'll just return a placeholder
    return res.status(200).json({
      status: 'ok',
      message: 'Logs endpoint is a placeholder. Implement log retrieval based on your storage mechanism.',
    });
  } catch (error) {
    logger.error('Failed to get logs', { error });
    return res.status(500).json({ status: 'error', message: 'Failed to get logs' });
  }
});

export default router;
