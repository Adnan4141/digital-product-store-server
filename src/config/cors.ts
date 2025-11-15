import { CorsOptions } from 'cors';
import { CLIENT_URL, NODE_ENV } from './env';

const isVercelDomain = (url: string): boolean => {
  if (!url) return false;
  return url.includes('vercel.app') || url.includes('vercel.com');
};

export const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://localhost:5555',
    ].filter(Boolean);

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (isVercelDomain(origin)) {
      return callback(null, true);
    }

    if (NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (!CLIENT_URL || CLIENT_URL === 'http://localhost:3001') {
      console.warn('CLIENT_URL not set properly, allowing all Vercel origins');
      if (isVercelDomain(origin)) {
        return callback(null, true);
      }
    }

    console.error('CORS blocked origin:', origin, 'CLIENT_URL:', CLIENT_URL);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'x-api-key',
    'Accept',
    'Origin',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

export const adminCorsOptions: CorsOptions = {
  ...corsOptions,
};

export const publicCorsOptions: CorsOptions = {
  ...corsOptions,
};
