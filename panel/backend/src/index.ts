import express from 'express';
import cors from 'cors';
import type { RequestHandler } from 'express';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import cookiesRoutes from './routes/cookies.routes';
import { errorHandler } from './middleware/errorHandler';
import formsRoutes from './routes/forms.routes';
import facebookRoutes from './routes/facebook.routes';
import usersRoutes from './routes/users.routes';

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
  app.use(errorHandler);
} else {
  import('http-proxy-middleware').then(({ createProxyMiddleware }) => {
    app.use('/automation', createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: { '^/automation': '' },
    }) as RequestHandler);
    app.use(errorHandler);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

export default app;
