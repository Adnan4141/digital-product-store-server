import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProductStock,
} from '../../controllers/productController';
import { adminAuth } from '../../middleware/auth';
import { validate } from '../../utils/validation';
import { createProductSchema } from '../../utils/validation';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', adminAuth, validate(createProductSchema), createProduct);
router.put('/:id/stock', adminAuth, updateProductStock);

export default router;

