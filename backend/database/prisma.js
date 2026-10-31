import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';
import { DATABASE_SSL_REJECT_UNAUTHORIZED, DATABASE_URL } from '../config/env.js';

const connectionUrl = new URL(DATABASE_URL);
connectionUrl.searchParams.delete('sslmode');

const adapter = new PrismaPg({
  connectionString: connectionUrl.toString(),
  ssl: { rejectUnauthorized: DATABASE_SSL_REJECT_UNAUTHORIZED },
});
const prisma = new PrismaClient({ adapter });

export default prisma;
