import { Router } from 'express';
import authorization from '../middleware/auth.middleware.js';
import { byCategory, insights, monthlyTrend, summary } from '../controllers/stats.controller.js';

const statsRouter = Router();
statsRouter.use(authorization);
statsRouter.get('/summary', summary);
statsRouter.get('/by-category', byCategory);
statsRouter.get('/monthly-trend', monthlyTrend);
statsRouter.get('/insights', insights);

export default statsRouter;
