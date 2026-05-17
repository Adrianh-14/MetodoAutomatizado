import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import cookiesRoutes from './routes/cookies.routes';
import { errorHandler } from './middleware/errorHandler';
import formsRoutes from './routes/forms.routes';
import facebookRoutes from './routes/facebook.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow any origin dynamically (handles localhost vs 127.0.0.1)
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'millonesgang-api',
    timestamp: new Date().toISOString() 
  });
});

import usersRoutes from './routes/users.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cookies', cookiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/facebook', facebookRoutes);

// Error handler
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

export default app;
