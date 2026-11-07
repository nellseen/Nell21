import express from 'express';
import cors from 'cors';
import { readConfig } from './config/env.js';
import tmdbRoutes from './routes/tmdb.routes.js';
import { apiRateLimit } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp(config) {
  const app = express(); app.disable('x-powered-by'); app.locals.config = config;
  app.use(cors({ origin(origin, callback) { if (!origin || config.clientOrigins.includes(origin)) return callback(null, true); const error = new Error('Origin tidak diizinkan.'); error.status = 403; return callback(error, false); }, methods: ['GET'], allowedHeaders: ['Accept', 'Content-Type'], maxAge: 600 }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', apiRateLimit, tmdbRoutes);
  app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));
  app.use(errorHandler);
  return app;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  try { const config = readConfig(); createApp(config).listen(config.port, () => console.log(`NETFLIX-NELL API berjalan di http://localhost:${config.port}`)); }
  catch (error) { console.error(`Konfigurasi server tidak valid: ${error.message}`); process.exitCode = 1; }
}
