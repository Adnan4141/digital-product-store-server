import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return sendSuccess(res, categories, 'Categories fetched successfully', 200);
  } catch (error: any) {
    logger.error('Error in getAllCategories', error, {
      method: req.method,
      path: req.path,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch categories', 500);
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            stock: true,
            categoryId: true,
            createdAt: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return sendSuccess(res, category, 'Category fetched successfully', 200);
  } catch (error: any) {
    logger.error('Error in getCategoryById', error, {
      method: req.method,
      path: req.path,
      params: req.params,
      categoryId: req.params.id,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch category', 500);
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    const categorySlug = (slug && slug.trim() !== '') 
      ? slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    if (!categorySlug || categorySlug.length === 0) {
      throw new AppError('Category name must contain at least one alphanumeric character', 400);
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: categorySlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, category, 'Category created successfully', 201);
  } catch (error: any) {
    logger.error('Error in createCategory', error, {
      method: req.method,
      path: req.path,
      body: req.body,
      prismaCode: error.code,
      prismaMeta: error.meta,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.code === 'P2002') {
      logger.warn('Category unique constraint violation', {
        method: req.method,
        path: req.path,
        body: req.body,
        target: error.meta?.target,
      });
      return sendError(res, 'Category with this name or slug already exists', 400);
    }
    return sendError(res, 'Failed to create category', 500);
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, updatedCategory, 'Category updated successfully', 200);
  } catch (error: any) {
    logger.error('Error in updateCategory', error, {
      method: req.method,
      path: req.path,
      params: req.params,
      body: req.body,
      categoryId: req.params.id,
      prismaCode: error.code,
      prismaMeta: error.meta,
    });
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.code === 'P2002') {
      logger.warn('Category unique constraint violation', {
        method: req.method,
        path: req.path,
        params: req.params,
        body: req.body,
        target: error.meta?.target,
      });
      return sendError(res, 'Category with this name or slug already exists', 400);
    }
    return sendError(res, 'Failed to update category', 500);
  }
};
