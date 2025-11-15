import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { stripe } from '../config/stripe';
import { AppError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { sendOrderConfirmationEmail } from '../services/emailService';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, customerEmail } = req.body;

    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found', 404);
    }

    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }
      
      if (product.stock !== undefined && product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          400
        );
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        price: product.price,
        quantity: item.quantity,
      };
    });

    const order = await prisma.order.create({
      data: {
        customerEmail,
        totalAmount,
        status: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error: any) {
    logger.error('Error in createOrder', error, {
      method: req.method,
      path: req.path,
      body: req.body,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to create order', 500);
  }
};

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'PENDING') {
      throw new AppError('Order is not in pending status', 400);
    }

    const amountInCents = Math.round(order.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        orderId: order.id,
        customerEmail: order.customerEmail,
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return sendSuccess(
      res,
      {
        order: updatedOrder,
        clientSecret: paymentIntent.client_secret,
      },
      'Payment intent created successfully',
      200
    );
  } catch (error: any) {
    logger.error('Error in createPaymentIntent', error, {
      method: req.method,
      path: req.path,
      params: req.params,
      orderId: req.params.id,
      stripeError: error.type || error.code,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to create payment intent', 500);
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const validStatuses = ['PENDING', 'PAID', 'FAILED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (status === 'PAID' && order.status !== 'PAID') {
      for (const item of order.items) {
        try {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            } as any,
          });
        } catch (stockError: any) {
          logger.error(`Failed to update stock for product ${item.productId}`, stockError, {
            method: req.method,
            path: req.path,
            orderId: id,
            productId: item.productId,
            quantity: item.quantity,
          });
        }
      }

      try {
        await sendOrderConfirmationEmail(order.customerEmail, order.id, updatedOrder);
      } catch (emailError) {
        logger.error('Failed to send confirmation email', emailError as Error, {
          method: req.method,
          path: req.path,
          orderId: id,
          customerEmail: order.customerEmail,
        });
      }
    }

    return sendSuccess(res, updatedOrder, 'Order status updated successfully', 200);
  } catch (error: any) {
    logger.error('Error in updateOrderStatus', error, {
      method: req.method,
      path: req.path,
      params: req.params,
      body: req.body,
      orderId: req.params.id,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to update order status', 500);
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return sendSuccess(res, order, 'Order fetched successfully', 200);
  } catch (error: any) {
    logger.error('Error in getOrderById', error, {
      method: req.method,
      path: req.path,
      params: req.params,
      orderId: req.params.id,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch order', 500);
  }
};

export const getOrderHistory = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email) {
      throw new AppError('Email query parameter is required', 400);
    }

    const orders = await prisma.order.findMany({
      where: {
        customerEmail: email as string,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sendSuccess(res, orders, 'Order history fetched successfully', 200);
  } catch (error: any) {
    logger.error('Error in getOrderHistory', error, {
      method: req.method,
      path: req.path,
      query: req.query,
      email: req.query.email,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch order history', 500);
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { email, status, limit, offset } = req.query;

    const where: any = {};
    
    if (email) {
      where.customerEmail = { contains: email as string, mode: 'insensitive' };
    }
    
    if (status) {
      where.status = status as string;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined,
    });

    const total = await prisma.order.count({ where });

    return sendSuccess(
      res,
      {
        orders,
        total,
        limit: limit ? parseInt(limit as string) : null,
        offset: offset ? parseInt(offset as string) : null,
      },
      'Orders fetched successfully',
      200
    );
  } catch (error: any) {
    logger.error('Error in getAllOrders', error, {
      method: req.method,
      path: req.path,
      query: req.query,
      filters: { email: req.query.email, status: req.query.status },
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch orders', 500);
  }
};
