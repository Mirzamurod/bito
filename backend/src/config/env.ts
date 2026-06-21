import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  MONGODB_URI: required('MONGODB_URI', 'mongodb://localhost:27017/bito'),
  CORS_ORIGIN: required('CORS_ORIGIN', 'http://localhost:3000'),
  JWT_SECRET: required('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '8h',
  PAYMENT_WEBHOOK_SECRET: required(
    'PAYMENT_WEBHOOK_SECRET',
    'whsec_dev_secret',
  ),
} as const;
