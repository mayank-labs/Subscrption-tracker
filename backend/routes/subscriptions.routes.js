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
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  createSubscriptionSchema,
  upcomingQuerySchema,
  updateSubscriptionSchema,
} from '../validation/subscription.validation.js';
import { exportSubscriptions } from '../controllers/subscription.controller.js';
const subscriptionRouter = Router();

subscriptionRouter.use(authorization);
subscriptionRouter.get('/', getSubscriptions);
subscriptionRouter.post('/',validateBody(createSubscriptionSchema), createSubscription);
subscriptionRouter.get('/upcoming-renewals', validateQuery(upcomingQuerySchema), getUpcomingSubscriptions);
subscriptionRouter.get('/export.csv', exportSubscriptions);
subscriptionRouter.get('/:id', getSubscription);
subscriptionRouter.put('/:id', validateBody(updateSubscriptionSchema), updateSubscription);
subscriptionRouter.delete('/:id', deleteSubscription);
subscriptionRouter.put('/:id/cancel', cancelSubscription);

export default subscriptionRouter;
