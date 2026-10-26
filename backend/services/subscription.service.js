import prisma from '../database/prisma.js';
import { frequencyToCycle, nextRenewalDate, serializeSubscription } from '../utils/subscription.js';

export const subscriptionData = (body, userId, existing = {}) => {
  const billingCycle = body.billingCycle || frequencyToCycle[body.frequency] || existing.billingCycle;
  const startDate = body.startDate ? new Date(body.startDate) : existing.startDate;
  return {
    name: body.name ?? existing.name,
    price: body.price ?? existing.price,
    currency: body.currency ?? existing.currency ?? 'INR',
    billingCycle,
    category: body.category ?? body.categor ?? existing.category ?? 'Other',
    paymentMethod: body.paymentMethod ?? existing.paymentMethod,
    startDate,
    renewalDate: body.renewalDate
      ? new Date(body.renewalDate)
      : existing.renewalDate || nextRenewalDate(startDate, billingCycle),
    userId,
  };
};

export const listSubscriptions = (userId, where = {}) =>
  prisma.subscription.findMany({
    where: { userId, ...where },
    orderBy: { renewalDate: 'asc' },
  });

export const findOwnedSubscription = (id, userId) =>
  prisma.subscription.findFirst({ where: { id, userId } });

export const serializeSubscriptions = (subscriptions) =>
  subscriptions.map(serializeSubscription);
