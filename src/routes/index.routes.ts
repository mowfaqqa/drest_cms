import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './products.routes';
import categoryRoutes from './categories.routes';
// import brandRoutes from './brands.routes';
// import inventoryRoutes from './inventory.routes';
// import reviewRoutes from './reviews.routes';
// import mediaRoutes from './media.routes';
// import dashboardRoutes from './dashboard.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
// router.use('/brands', brandRoutes);
// router.use('/inventory', inventoryRoutes);
// router.use('/reviews', reviewRoutes);
// router.use('/media', mediaRoutes);
// router.use('/dashboard', dashboardRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'drest-cms-api',
    version: process.env['npm_package_version'] || '1.0.0'
  });
});

export default router;