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
const PORT = process.env.PORT || 3001;

async function main() {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://metodo-automatizado.vercel.app',
    'https://metodo-automatizado-t38r-kazv7j5bv-adrien1138gmailcoms-projects.vercel.app',
    'https://metodo-automatizado-xwf9.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

  // Proxy - ESM-only module, must be dynamically imported
  const { createProxyMiddleware } = await import('http-proxy-middleware');
  app.use('/automation', createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/automation': '' },
  }) as RequestHandler);

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║        🔥 MILLONESGANG API SERVER 🔥        ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Port:     ${PORT}                              ║`);
    console.log(`║  Mode:     ${process.env.NODE_ENV || 'development'}                     ║`);
    console.log('║  Status:   ONLINE                            ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });
}

main().catch(console.error);

export default app;
