import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './utils/errors';
import { handleStripeWebhook } from './controllers/webhookController';
import { NODE_ENV, PORT, validateEnv } from './config/env';
import { corsOptions } from './config/cors';
import { sendSuccess, sendError } from './utils/response';

validateEnv();

const app = express();

app.use(cors(corsOptions));

if (NODE_ENV === 'development' || !NODE_ENV) {
  app.use(morgan('dev'));
}

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

app.use('/api', routes);

app.get('/api', (req, res) => {
  return sendSuccess(res, { status: 'ok' }, 'API is working', 200);
});

app.use(errorHandler);

app.use((req, res) => {
  return sendError(res, 'Route Not Found', 404, { path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`
🚀 Server ready at: http://localhost:${PORT}

  `);
});

export default app;
