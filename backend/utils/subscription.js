export const frequencyToCycle = {
  Daily: 'DAILY',
  Weekly: 'WEEKLY',
  Monthly: 'MONTHLY',
  Yearly: 'YEARLY',
};

export const cycleToFrequency = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

export const nextRenewalDate = (startDate, cycle) => {
  const date = new Date(startDate);
  if (cycle === 'MONTHLY') date.setMonth(date.getMonth() + 1);
  else if (cycle === 'YEARLY') date.setFullYear(date.getFullYear() + 1);
  else date.setDate(date.getDate() + (cycle === 'WEEKLY' ? 7 : 1));
  return date;
};

export const serializeSubscription = (subscription) => ({
  ...subscription,
  price: subscription.price.toString(),
  frequency: cycleToFrequency[subscription.billingCycle],
});
