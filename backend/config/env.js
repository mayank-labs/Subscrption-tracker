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

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || JWT_EXPIRES_IN || '15m';
export const JWT_REFRESH_EXPIRES_IN = Number(process.env.JWT_REFRESH_EXPIRES_IN || 604800);
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const REMINDER_FROM_EMAIL = process.env.REMINDER_FROM_EMAIL || 'SubDub <onboarding@resend.dev>';

if (!DATABASE_URL || !JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('DATABASE_URL, JWT_SECRET (or access/refresh secrets) are required. Get DATABASE_URL from Supabase Connect > ORMs > Prisma.');
}