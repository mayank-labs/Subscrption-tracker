import { config } from "dotenv";
config();
config({ path: `.env.${process.env.NODE_ENV || "development"}.local`, override: true });

export const {
    PORT = 3000, NODE_ENV = "development",
    DATABASE_URL, JWT_SECRET,
    SUPABASE_URL = process.env.supabase_url,
    SUPABASE_PUBLIC_KEY = process.env.supabase_public_key,
    SUPABASE_SERVICE_KEY = process.env.supabase_service_key,
    JWT_EXPIRES_IN,
    ARCJET_ENV , ARCJET_KEY } = process.env;

if (!DATABASE_URL || !JWT_SECRET || !JWT_EXPIRES_IN) {
    throw new Error('DATABASE_URL, JWT_SECRET, and JWT_EXPIRES_IN are required. Get DATABASE_URL from Supabase Connect > ORMs > Prisma.');
}