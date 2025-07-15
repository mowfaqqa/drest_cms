import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller';
import { requireRole, requirePermission } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { productValidators } from '../validators/product.validator';
import { AdminRole } from '@prisma/client';

const router = Router();
const productsController = new ProductsController();

// GET routes (read permissions)
router.get('/', requirePermission('products.read'), productsController.getProducts);
router.get('/stats', requirePermission('products.read'), productsController.getProductStats);
router.get('/search', requirePermission('products.read'), productsController.searchProducts);
router.get('/category/:categoryId', requirePermission('products.read'), productsController.getProductsByCategory);
router.get('/:id', requirePermission('products.read'), productsController.getProduct);
router.get('/:id/variants', requirePermission('products.read'), productsController.getProductVariants);
router.get('/:id/analytics', requirePermission('products.read'), productsController.getProductAnalytics);

// POST routes (create permissions)
router.post('/', 
  requirePermission('products.create'),
  validateRequest(productValidators.create),
  productsController.createProduct
);

router.post('/:id/duplicate',
  requirePermission('products.create'),
  validateRequest(productValidators.duplicate),
  productsController.duplicateProduct
);

router.post('/:id/variants',
  requirePermission('products.create'),
  validateRequest(productValidators.createVariant),
  productsController.createProductVariant
);

router.post('/import',
  requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
  uploadMiddleware.single('file'),
  productsController.importProducts
);

// PUT/PATCH routes (update permissions)
router.put('/:id',
  requirePermission('products.update'),
  validateRequest(productValidators.update),
  productsController.updateProduct
);

router.patch('/:id/status',
  requirePermission('products.update'),
  validateRequest(productValidators.updateStatus),
  productsController.updateProductStatus
);

router.put('/:id/variants/:variantId',
  requirePermission('products.update'),
  validateRequest(productValidators.updateVariant),
  productsController.updateProductVariant
);

router.patch('/bulk-update',
  requirePermission('products.update'),
  validateRequest(productValidators.bulkUpdate),
  productsController.bulkUpdateProducts
);

// DELETE routes (delete permissions)
router.delete('/:id',
  requirePermission('products.delete'),
  productsController.deleteProduct
);

router.delete('/:id/variants/:variantId',
  requirePermission('products.delete'),
  productsController.deleteProductVariant
);

// Export routes
router.get('/export/csv',
  requirePermission('products.read'),
  productsController.exportProducts
);

router.get('/export/excel',
  requirePermission('products.read'),
  productsController.exportProducts
);

export default router;