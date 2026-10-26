import { z } from 'zod';

const billingCycles = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const frequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

const subscriptionFields = {
  name: z.string().trim().min(1, 'Name is required').optional(),
  price: z.coerce.number().positive('Price must be greater than zero').optional(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/, 'Use a 3-letter currency code').optional(),
  billingCycle: z.enum(billingCycles).optional(),
  frequency: z.enum(frequencies).optional(),
  category: z.string().trim().min(1).optional(),
  categor: z.string().trim().min(1).optional(),
  paymentMethod: z.string().trim().min(1).optional(),
  startDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
};

const billingCycleChoice = (data) =>
  data.billingCycle !== undefined || data.frequency !== undefined;

export const createSubscriptionSchema = z
  .object({
    ...subscriptionFields,
    name: subscriptionFields.name.unwrap(),
    price: subscriptionFields.price.unwrap(),
    startDate: subscriptionFields.startDate.unwrap(),
  })
  .refine(billingCycleChoice, {
    message: 'Provide billingCycle or frequency',
    path: ['billingCycle'],
  });

export const updateSubscriptionSchema = z
  .object(subscriptionFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const upcomingQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});