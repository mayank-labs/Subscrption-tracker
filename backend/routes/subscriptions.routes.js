import { Router } from 'express';
import authorization from '../middleware/auth.middleware.js';
import {
  cancelSubscription,
  createSubscription,
  deleteSubscription,
  getSubscription,
  getSubscriptions,
  getUpcomingSubscriptions,
  updateSubscription,
} from '../controllers/subscription.controller.js';

const subscriptionRouter = Router();

subscriptionRouter.use(authorization);
subscriptionRouter.get('/', getSubscriptions);
subscriptionRouter.post('/', createSubscription);
subscriptionRouter.get('/upcoming-renewals', getUpcomingSubscriptions);
subscriptionRouter.get('/:id', getSubscription);
subscriptionRouter.put('/:id', updateSubscription);
subscriptionRouter.delete('/:id', deleteSubscription);
subscriptionRouter.put('/:id/cancel', cancelSubscription);

export default subscriptionRouter;
