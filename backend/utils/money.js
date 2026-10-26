export const monthlyCost = (price, billingCycle) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) throw new Error('Invalid subscription price');
  const multipliers = {
    DAILY: 365 / 12,
    WEEKLY: 52 / 12,
    MONTHLY: 1,
    YEARLY: 1 / 12,
  };
  if (!multipliers[billingCycle]) throw new Error(`Unknown billing cycle: ${billingCycle}`);
  return amount * multipliers[billingCycle];
};
