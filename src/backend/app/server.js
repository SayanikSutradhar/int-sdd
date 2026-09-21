import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing (required for JWT cookie auth)
app.use(cookieParser());

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// TODO: Mount business module routes here after BRD ingestion and Gate 0 approval
// import apiRouter from './routes/index.js';
// app.use('/api/v1', apiRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Internal server error' },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // Server started
});

export default app;
