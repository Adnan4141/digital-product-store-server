import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
} from '../../controllers/categoryController';
import { adminAuth } from '../../middleware/auth';
import { validate } from '../../utils/validation';
import { createCategorySchema, updateCategorySchema } from '../../utils/validation';

const router = Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', adminAuth, validate(createCategorySchema), createCategory);
router.put('/:id', adminAuth, validate(updateCategorySchema), updateCategory);

export default router;

