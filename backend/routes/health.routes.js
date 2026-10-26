import { Router } from 'express';
import { health, readiness } from '../controllers/health.controller.js';

const healthRouter = Router();
healthRouter.get('/health', health);
healthRouter.get('/ready', readiness);

export default healthRouter;
