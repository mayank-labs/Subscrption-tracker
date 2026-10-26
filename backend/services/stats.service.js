import prisma from '../database/prisma.js';
import { monthlyCost } from '../utils/money.js';

export const getSummary = async (userId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: 'ACTIVE' },
  });
  const monthly = subscriptions.reduce(
    (total, subscription) => total + monthlyCost(subscription.price, subscription.billingCycle),
    0,
  );
  return {
    monthlySpend: Number(monthly.toFixed(2)),
    yearlySpend: Number((monthly * 12).toFixed(2)),
    activeSubscriptions: subscriptions.length,
    nextRenewal: subscriptions.sort((a, b) => a.renewalDate - b.renewalDate)[0]?.renewalDate ?? null,
  };
};

export const getCategoryStats = async (userId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: 'ACTIVE' },
  });
  const categories = {};
  for (const subscription of subscriptions) {
    categories[subscription.category] = (categories[subscription.category] || 0)
      + monthlyCost(subscription.price, subscription.billingCycle);
  }
  return Object.entries(categories).map(([category, monthlySpend]) => ({
    category,
    monthlySpend: Number(monthlySpend.toFixed(2)),
  }));
};

export const getMonthlyTrend = async (userId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: 'ACTIVE' },
  });
  const monthlySpend = subscriptions.reduce(
    (total, subscription) => total + monthlyCost(subscription.price, subscription.billingCycle),
    0,
  );
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - index));
    return {
      month: date.toISOString().slice(0, 7),
      projectedSpend: Number(monthlySpend.toFixed(2)),
    };
  });
};

export const getInsights = async (userId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: 'ACTIVE' },
  });
  const ranked = subscriptions
    .map((subscription) => ({
      ...subscription,
      monthly: monthlyCost(subscription.price, subscription.billingCycle),
    }))
    .sort((a, b) => b.monthly - a.monthly);
  const monthlyTotal = ranked.reduce((total, item) => total + item.monthly, 0);
  return {
    mostExpensive: ranked[0]
      ? { name: ranked[0].name, monthlySpend: Number(ranked[0].monthly.toFixed(2)) }
      : null,
    monthlyTotal: Number(monthlyTotal.toFixed(2)),
    projectedYearlySpend: Number((monthlyTotal * 12).toFixed(2)),
    categoryCount: new Set(ranked.map((item) => item.category)).size,
  };
};
