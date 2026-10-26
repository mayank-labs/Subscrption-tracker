import express from 'express';
import userRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import subscriptionRouter from './routes/subscriptions.routes.js';
import errorMiddleware from './middleware/error.middleware.js';
import cookieParser from 'cookie-parser';
import arcjetMiddleware from './middleware/arcjet.middleware.js';
import healthRouter from './routes/health.routes.js';
import statsRouter from './routes/stats.routes.js';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CLIENT_URL } from './config/env.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(pinoHttp());
app.use(arcjetMiddleware);

app.use(healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/stats', statsRouter);
app.get('/api/docs', async (req, res, next) => {
  try {
    const docsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'docs/openapi.yaml');
    res.type('text/yaml').send(await readFile(docsPath, 'utf8'));
  } catch (error) {
    next(error);
  }
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to SubDub' });
});

app.use(errorMiddleware);

export default app;