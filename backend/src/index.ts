import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { stockRoutes } from './routes/stockRoutes';
import { screenerRoutes } from './routes/screenerRoutes';
import { csvRoutes } from './routes/csvRoutes';
import { indexRoutes } from './routes/indexRoutes';
import { marketDataService } from './services/marketDataService';
import { indexService } from './services/indexService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/screener', screenerRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/indexes', indexRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Market Screener Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize services
  indexService.initialize();
  marketDataService.initialize();
});

export default app;
