import { PgBoss } from 'pg-boss';
import { Resend } from 'resend';
import prisma from '../database/prisma.js';
import { DATABASE_URL, REMINDER_FROM_EMAIL, RESEND_API_KEY } from '../config/env.js';

const boss = new PgBoss(DATABASE_URL);
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const sendReminder = async (job) => {
  if (!resend) throw new Error('RESEND_API_KEY is required to send reminders');
  const subscription = await prisma.subscription.findUnique({
    where: { id: job.data.subscriptionId },
    include: { user: true },
  });
  if (!subscription || subscription.status !== 'ACTIVE') return;

  const renewalDate = subscription.renewalDate.toISOString().slice(0, 10);
  const existingLog = await prisma.reminderLog.findUnique({
    where: { subscriptionId_renewalDate: { subscriptionId: subscription.id, renewalDate: subscription.renewalDate } },
  });
  if (existingLog) return;

  await resend.emails.send({
    from: REMINDER_FROM_EMAIL,
    to: subscription.user.email,
    subject: `${subscription.name} renews on ${renewalDate}`,
    text: `${subscription.name} renews on ${renewalDate} for ${subscription.currency} ${subscription.price}.`,
  });
  await prisma.reminderLog.create({
    data: { subscriptionId: subscription.id, renewalDate: subscription.renewalDate },
  });
};

const scanRenewals = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', renewalDate: { gte: today } },
  });
  for (const subscription of subscriptions) {
    const daysUntilRenewal = Math.ceil(
      (subscription.renewalDate.getTime() - today.getTime()) / 86400000,
    );
    if (daysUntilRenewal <= 3) {
      await boss.send('send-renewal-reminder', { subscriptionId: subscription.id });
    }
  }
};

export const startReminderJobs = async () => {
  if (!RESEND_API_KEY) {
    console.warn('Reminder jobs disabled because RESEND_API_KEY is not configured');
    return null;
  }
  await boss.start();
  await boss.work('send-renewal-reminder', sendReminder);
  await boss.schedule('scan-renewals', '0 9 * * *');
  await boss.work('scan-renewals', scanRenewals);
  return boss;
};
