import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { search, minPrice, maxPrice, inStock, categoryId } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (minPrice) {
      where.price = { gte: parseFloat(minPrice as string) };
    }
    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice as string) };
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sendSuccess(res, products, 'Products fetched successfully', 200);
  } catch (error: any) {
    logger.error('Error in getAllProducts', error, {
      method: req.method,
      path: req.path,
      query: req.query,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch products', 500);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new AppError('Invalid product ID format', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return sendSuccess(res, product, 'Product fetched successfully', 200);
  } catch (error: any) {
    logger.error('Error in getProductById', error, {
      method: req.method,
      path: req.path,
      params: req.params,
      productId: req.params.id,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch product', 500);
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, imageUrl, stock, categoryId } = req.body;

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        stock: stock || 0,
        categoryId: categoryId || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error: any) {
    logger.error('Error in createProduct', error, {
      method: req.method,
      path: req.path,
      body: req.body,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to create product', 500);
  }
};

export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock },
    });

    return sendSuccess(res, updatedProduct, 'Product stock updated successfully', 200);
  } catch (error: any) {
    logger.error('Error in updateProductStock', error, {
      method: req.method,
      path: req.path,
      params: req.params,
      body: req.body,
      productId: req.params.id,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to update product stock', 500);
  }
};
