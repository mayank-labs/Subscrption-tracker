import prisma from '../database/prisma.js';

const frequencyToCycle = {
  Daily: 'DAILY',
  Weekly: 'WEEKLY',
  Monthly: 'MONTHLY',
  Yearly: 'YEARLY',
};

const cycleToFrequency = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

const getRenewalDate = (startDate, cycle) => {
  const renewalDate = new Date(startDate);
  if (cycle === 'MONTHLY') renewalDate.setMonth(renewalDate.getMonth() + 1);
  else if (cycle === 'YEARLY') renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  else renewalDate.setDate(renewalDate.getDate() + (cycle === 'WEEKLY' ? 7 : 1));
  return renewalDate;
};

const toSubscriptionData = (body, userId, existing = {}) => {
  const cycle = body.billingCycle || frequencyToCycle[body.frequency] || existing.billingCycle;
  const startDate = body.startDate ? new Date(body.startDate) : existing.startDate;
  const renewalDate = body.renewalDate
    ? new Date(body.renewalDate)
    : existing.renewalDate || getRenewalDate(startDate, cycle);

  return {
    name: body.name ?? existing.name,
    price: body.price ?? existing.price,
    currency: body.currency ?? existing.currency ?? 'INR',
    billingCycle: cycle,
    category: body.category ?? body.categor ?? existing.category ?? 'Other',
    paymentMethod: body.paymentMethod ?? existing.paymentMethod,
    startDate,
    renewalDate,
    userId,
  };
};

const serializeSubscription = (subscription) => ({
  ...subscription,
  price: subscription.price.toString(),
  frequency: cycleToFrequency[subscription.billingCycle],
});

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.create({
      data: toSubscriptionData(req.body, req.user.id),
    });
    res.status(201).json({ success: true, data: serializeSubscription(subscription) });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      orderBy: { renewalDate: 'asc' },
    });
    res.json({ success: true, data: subscriptions.map(serializeSubscription) });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    res.json({ success: true, data: serializeSubscription(subscription) });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    const subscription = await prisma.subscription.update({
      where: { id: existing.id },
      data: toSubscriptionData(req.body, req.user.id, existing),
    });
    res.json({ success: true, data: serializeSubscription(subscription) });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const result = await prisma.subscription.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const result = await prisma.subscription.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    const subscription = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: serializeSubscription(subscription) });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingSubscriptions = async (req, res, next) => {
  try {
    const days = Math.max(1, Number(req.query.days) || 30);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: req.user.id,
        status: 'ACTIVE',
        renewalDate: { gte: today, lte: endDate },
      },
      orderBy: { renewalDate: 'asc' },
    });
    res.json({ success: true, data: subscriptions.map(serializeSubscription) });
  } catch (error) {
    next(error);
  }
};
