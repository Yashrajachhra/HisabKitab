import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { env } from './config/env';
import { connectMongo } from './db/connect';
import { authRouter } from './routes/auth';
import { groupsRouter } from './routes/groups';
import { healthRouter } from './routes/health';

const app = express();
if (process.env.VERCEL) {
  app.set('trust proxy', 1);
  let mongoPromise: Promise<void> | null = null;
  app.use((req, _res, next) => {
    if (req.path === '/' || req.path === '/health') {
      next();
      return;
    }
    if (!mongoPromise) {
      mongoPromise = connectMongo().catch((err) => {
        mongoPromise = null;
        throw err;
      });
    }
    mongoPromise.then(() => next()).catch(() => next());
  });
}

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/groups', groupsRouter);

app.get('/', (_req, res) => {
  res.json({
    name: 'HisabKitab API',
    scope: 'group-ledgers-only',
    phase: 5,
    message: 'Personal expenses are never stored on this server.',
  });
});

async function boot(): Promise<void> {
  if (env.nodeEnv === 'test' || process.env.VERCEL) return;
  try {
    await connectMongo();
    console.info('MongoDB connected');
  } catch {
    console.warn('MongoDB unavailable — auth/group routes will fail until MONGODB_URI is set.');
  }

  app.listen(env.port, () => {
    console.info(`HisabKitab API listening on :${env.port}`);
  });
}

void boot();

export default app;
export { app };
