import prisma from '../database/prisma.js';
import { findOwnedSubscription, listSubscriptions, serializeSubscriptions, subscriptionData } from '../services/subscription.service.js';
import { serializeSubscription } from '../utils/subscription.js';

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.create({
      data: subscriptionData(req.body, req.user.id),
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
    res.json({ success: true, data: serializeSubscriptions(subscriptions) });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    const subscription = await findOwnedSubscription(req.params.id, req.user.id);
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
      data: subscriptionData(req.body, req.user.id, existing),
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
    const days = req.validatedQuery.days;
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);
    const subscriptions = await listSubscriptions(req.user.id, {
      status: 'ACTIVE',
      renewalDate: { gte: today, lte: endDate },
    });
    res.json({ success: true, data: serializeSubscriptions(subscriptions) });
  } catch (error) {
    next(error);
  }
};

export const exportSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await listSubscriptions(req.user.id);
    const rows = [
      ['name', 'price', 'currency', 'frequency', 'category', 'status', 'startDate', 'renewalDate'],
      ...subscriptions.map((subscription) => [
        subscription.name,
        subscription.price.toString(),
        subscription.currency,
        subscription.billingCycle,
        subscription.category,
        subscription.status,
        subscription.startDate.toISOString().slice(0, 10),
        subscription.renewalDate.toISOString().slice(0, 10),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    res.type('text/csv').attachment('subscriptions.csv').send(csv);
  } catch (error) {
    next(error);
  }
};
