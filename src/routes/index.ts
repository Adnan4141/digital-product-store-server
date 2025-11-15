import { Router } from 'express';
import productRoutes from './products';
import orderRoutes from './orders';
import categoryRoutes from './categories';

const router = Router();

router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);

export default router;

