import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL || '';

export const PORT = parseInt(process.env.PORT || '5000', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
export const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER || '';

export const validateEnv = () => {
  const required = [
    { key: 'DATABASE_URL', value: DATABASE_URL },
    { key: 'STRIPE_SECRET_KEY', value: STRIPE_SECRET_KEY },
  ];

  const missing: string[] = [];

  required.forEach(({ key, value }) => {
    if (!value) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};
