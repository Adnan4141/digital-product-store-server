import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import prisma from '../config/prisma';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { STRIPE_WEBHOOK_SECRET } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return sendError(res, 'Missing stripe-signature header', 400);
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      logger.error('Webhook signature verification failed', err, {
        method: req.method,
        path: req.path,
        hasSignature: !!sig,
      });
      return sendError(res, `Webhook Error: ${err.message}`, 400);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          });

          if (order && order.status === 'PENDING') {
            const updatedOrder = await prisma.order.update({
              where: { id: orderId },
              data: { status: 'PAID' },
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            });

            for (const item of order.items) {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });
            }

            try {
              await sendOrderConfirmationEmail(order.customerEmail, order.id, updatedOrder);
              logger.info(`Order ${orderId} confirmed and email sent`, {
                orderId,
                customerEmail: order.customerEmail,
              });
            } catch (emailError) {
              logger.error('Failed to send confirmation email', emailError as Error, {
                orderId,
                customerEmail: order.customerEmail,
              });
            }
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as any;
        const failedOrderId = failedPayment.metadata?.orderId;

        if (failedOrderId) {
          await prisma.order.update({
            where: { id: failedOrderId },
            data: { status: 'FAILED' },
          });
          logger.warn(`Order ${failedOrderId} payment failed`, {
            orderId: failedOrderId,
            paymentIntentId: failedPayment.id,
          });
        }
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`, {
          eventType: event.type,
          eventId: event.id,
        });
    }

    return sendSuccess(res, { received: true }, 'Webhook processed successfully', 200);
  } catch (error: any) {
    logger.error('Error in handleStripeWebhook', error, {
      method: req.method,
      path: req.path,
      eventType: (error as any).type,
    });
    return sendError(res, 'Webhook processing failed', 500);
  }
};
