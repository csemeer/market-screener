import { Router, Request, Response } from 'express';
import { loggerService } from '../services/loggerService';

const router = Router();

/**
 * GET /api/logs
 * Get all logs with optional filtering
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { level, type, search, limit } = req.query;

    const logs = loggerService.getLogs({
      level: level as any,
      type: type as any,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      logs,
      count: logs.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /api/logs/stats
 * Get logging statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = loggerService.getStatistics();

    res.json({
      stats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching log statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * DELETE /api/logs
 * Clear all logs
 */
router.delete('/', (req: Request, res: Response) => {
  try {
    loggerService.clear();

    res.json({
      message: 'Logs cleared successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

/**
 * GET /api/logs/stream
 * Server-Sent Events endpoint for real-time log streaming
 */
router.get('/stream', (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Log stream connected"}\n\n');

  // Subscribe to log updates
  const unsubscribe = loggerService.subscribe((log) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // Clean up on client disconnect
  req.on('close', () => {
    unsubscribe();
  });
});

/**
 * POST /api/logs/test
 * Generate test logs for demonstration
 */
router.post('/test', (req: Request, res: Response) => {
  try {
    loggerService.info('Test info log message');
    loggerService.success('Test success log message');
    loggerService.warn('Test warning log message');
    loggerService.error('Test error log message', new Error('Sample error'));
    loggerService.debug('Test debug log message');

    loggerService.logService('TestService', 'Sample service log', {
      data: { key: 'value' }
    });

    res.json({
      message: 'Test logs generated successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error generating test logs:', error);
    res.status(500).json({ error: 'Failed to generate test logs' });
  }
});

export { router as loggerRoutes };
