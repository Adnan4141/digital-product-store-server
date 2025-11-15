import { Router } from 'express';
import cors from 'cors';
import {
  createOrder,
  createPaymentIntent,
  updateOrderStatus,
  getOrderById,
  getOrderHistory,
  getAllOrders,
} from '../../controllers/orderController';
import { adminAuth } from '../../middleware/auth';
import { validate } from '../../utils/validation';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../../utils/validation';
import { corsOptions } from '../../config/cors';

const router = Router();

router.use(cors(corsOptions));

router.get('/', adminAuth, getAllOrders);
router.get('/history', getOrderHistory);
router.get('/:id', getOrderById);
router.post('/', validate(createOrderSchema), createOrder);
router.post('/:id/payment', createPaymentIntent);
router.put('/:id/status', adminAuth, validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
