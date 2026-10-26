import app from './app.js';
import { PORT } from './config/env.js';
import prisma from './database/prisma.js';
import { startReminderJobs } from './jobs/reminders.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    await startReminderJobs();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
