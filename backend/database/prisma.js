import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';
import { DATABASE_URL } from '../config/env.js';

const connectionString = DATABASE_URL.replace(
  /([?&])sslmode=require\b/,
  '$1sslmode=no-verify',
);
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
