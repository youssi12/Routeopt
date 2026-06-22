import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { connectDB } from './database';
import { redis } from './services/redis';
import { logger } from './utils/logger';

// Routes
import authRoutes         from './modules/auth/routes';
import warehouseRoutes    from './modules/warehouses/routes';
import vehicleRoutes      from './modules/vehicles/routes';
import orderRoutes        from './modules/orders/routes';
import routePlanRoutes    from './modules/routes/routes';
import optimizationRoutes from './modules/routes/optimization';
import analyticsRoutes    from './modules/analytics/routes';

const app = express();

// ─── Security & Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/warehouses',    warehouseRoutes);
app.use('/api/vehicles',      vehicleRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/routes',        routePlanRoutes);
app.use('/api/optimization',  optimizationRoutes);
app.use('/api/analytics',     analyticsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── Error handler ───────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Boot ────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();
  await redis.connect();
  app.listen(config.port, () => {
    logger.info(`🚀 RouteOpt API running on port ${config.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});

export default app;
