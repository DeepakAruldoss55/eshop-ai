import { Router } from 'express';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import customerRoutes from './customerRoutes.js';
import addressRoutes from './addressRoutes.js';
import orderRoutes from './orderRoutes.js';
import shippingRoutes from './shippingRoutes.js';
import expenseRoutes from './expenseRoutes.js';

const apiRouter = Router();

apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/customer-addresses', addressRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/shipping', shippingRoutes);
apiRouter.use('/expenses', expenseRoutes);

export default apiRouter;
