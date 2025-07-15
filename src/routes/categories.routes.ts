import { Router } from 'express';
import { CategoriesController } from '../controllers/categorires.controller';
import { requirePermission } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { categoryValidators } from '../validators/category.validator';


const router = Router();
const categoriesController = new CategoriesController();

// GET routes (read permissions)
router.get('/', requirePermission('categories.read'), categoriesController.getCategories);
router.get('/stats', requirePermission('categories.read'), categoriesController.getCategoryStats);
router.get('/search', requirePermission('categories.read'), categoriesController.searchCategories);
router.get('/:id', requirePermission('categories.read'), categoriesController.getCategory);
router.get('/:id/breadcrumb', requirePermission('categories.read'), categoriesController.getCategoryBreadcrumb);
router.get('/:id/attributes', requirePermission('categories.read'), categoriesController.getCategoryAttributes);

// POST routes (create permissions)
router.post('/',
  requirePermission('categories.create'),
  validateRequest(categoryValidators.create),
  categoriesController.createCategory
);

router.post('/:id/attributes',
  requirePermission('categories.create'),
  validateRequest(categoryValidators.createAttribute),
  categoriesController.createCategoryAttribute
);

// PUT/PATCH routes (update permissions)
router.put('/:id',
  requirePermission('categories.update'),
  validateRequest(categoryValidators.update),
  categoriesController.updateCategory
);

router.patch('/:id/status',
  requirePermission('categories.update'),
  validateRequest(categoryValidators.updateStatus),
  categoriesController.updateCategoryStatus
);

router.patch('/reorder',
  requirePermission('categories.update'),
  validateRequest(categoryValidators.reorder),
  categoriesController.reorderCategories
);

router.patch('/:id/move',
  requirePermission('categories.update'),
  validateRequest(categoryValidators.move),
  categoriesController.moveCategory
);

router.put('/:id/attributes/:attributeId',
  requirePermission('categories.update'),
  validateRequest(categoryValidators.updateAttribute),
  categoriesController.updateCategoryAttribute
);

router.patch('/bulk-update',
  requirePermission('categories.update'),
  validateRequest(categoryValidators.bulkUpdate),
  categoriesController.bulkUpdateCategories
);

// DELETE routes (delete permissions)
router.delete('/:id',
  requirePermission('categories.delete'),
  categoriesController.deleteCategory
);

router.delete('/:id/attributes/:attributeId',
  requirePermission('categories.delete'),
  categoriesController.deleteCategoryAttribute
);

// Export routes
router.get('/export/csv',
  requirePermission('categories.read'),
  categoriesController.exportCategories
);

export default router;