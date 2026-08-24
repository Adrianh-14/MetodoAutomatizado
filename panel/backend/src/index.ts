import express from 'express';
import cors from 'cors';
import type { RequestHandler } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import cookiesRoutes from './routes/cookies.routes';
import { errorHandler } from './middleware/errorHandler';
import formsRoutes from './routes/forms.routes';
import facebookRoutes from './routes/facebook.routes';
import usersRoutes from './routes/users.routes';
import automationRoutes from './routes/automation.routes';
import { adminOnly, authMiddleware } from './middleware/auth';

const app: express.Application = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://metodo-automatizado.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'millonesgang-api',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cookies', cookiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/facebook', facebookRoutes);

if (process.env.VERCEL) {
  app.use('/automation', automationRoutes);
} else {
  const automationApiKey = process.env.AUTOMATION_API_KEY;
  if (!automationApiKey) {
    throw new Error('AUTOMATION_API_KEY is required');
  }

  app.use(
    '/automation',
    authMiddleware,
    adminOnly,
    createProxyMiddleware({
      target: process.env.AUTOMATION_URL || 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: { '^/automation': '' },
      headers: { 'x-api-key': automationApiKey },
    }) as RequestHandler
  );

  const PORT = Number.parseInt(process.env.PORT || '3001', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

app.use(errorHandler);

export default app;
