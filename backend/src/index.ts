import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { stockRoutes } from './routes/stockRoutes';
import { screenerRoutes } from './routes/screenerRoutes';
import { csvRoutes } from './routes/csvRoutes';
import { indexRoutes } from './routes/indexRoutes';
import { loggerRoutes } from './routes/loggerRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import eodRoutes from './routes/eodRoutes';
import { marketDataService } from './services/marketDataService';
import { indexService } from './services/indexService';
import { loggerService } from './services/loggerService';
import { autoScanService } from './services/autoScanService';
import { liveMonitoringService } from './services/liveMonitoringService';
import { loggingMiddleware, errorLoggingMiddleware } from './middleware/loggingMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware (should be early in the chain)
app.use(loggingMiddleware);

// Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/screener', screenerRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/indexes', indexRoutes);
app.use('/api/logs', loggerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/eod', eodRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error logging middleware (should be last)
app.use(errorLoggingMiddleware);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Market Screener Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize services
  loggerService.success(`Server started on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  indexService.initialize();
  loggerService.info('Index Service initialized');

  marketDataService.initialize();
  loggerService.info('Market Data Service initialized');

  // Initialize Auto-Scan Service (runs in background)
  try {
    await autoScanService.initialize();
    loggerService.success('Auto-Scan Service initialized successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    loggerService.error('Failed to initialize Auto-Scan Service', {
      error: errorMessage,
      stack: errorStack
    });
    console.error('❌ Auto-Scan Service Error Details:', error);
  }

  // Initialize Live Monitoring Service (monitors watchlist during market hours)
  try {
    await liveMonitoringService.initialize();
    loggerService.success('Live Monitoring Service initialized successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    loggerService.error('Failed to initialize Live Monitoring Service', {
      error: errorMessage,
      stack: errorStack
    });
    console.error('❌ Live Monitoring Service Error Details:', error);
  }

  loggerService.success('All services initialized successfully');
});

export default app;
