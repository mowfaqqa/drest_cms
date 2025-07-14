import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { asyncHandler, ValidationError, NotFoundError } from '@/middleware/error.middleware';
import { logAudit } from '@/utils/logger';
import { createPaginationMeta } from '@/utils/pagination';

export class CategoriesController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Get all categories with hierarchy
   */
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const {
      flat = 'false',
      includeProducts = 'false',
      isActive,
      page = 1,
      limit = 50
    } = req.query;

    const options = {
      flat: flat === 'true',
      includeProducts: includeProducts === 'true',
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      pagination: {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100)
      }
    };

    if (options.flat) {
      const result = await this.categoryService.getFlatCategories(options);
      const paginationMeta = createPaginationMeta(
        result.total,
        options.pagination.page,
        options.pagination.limit
      );

      res.json({
        success: true,
        data: {
          categories: result.categories,
          pagination: paginationMeta
        }
      });
    } else {
      const categories = await this.categoryService.getCategoryHierarchy(options);
      res.json({
        success: true,
        data: { categories }
      });
    }
  });

  /**
   * Get category by ID
   */
  getCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { includeProducts = 'false', includeChildren = 'true' } = req.query;

    const options = {
      includeProducts: includeProducts === 'true',
      includeChildren: includeChildren === 'true'
    };

    const category = await this.categoryService.getCategoryById(id, options);

    if (!category) {
      throw new NotFoundError('Category');
    }

    res.json({
      success: true,
      data: { category }
    });
  });

  /**
   * Create new category
   */
  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const categoryData = req.body;

    if (!categoryData.name) {
      throw new ValidationError('Category name is required');
    }

    const category = await this.categoryService.createCategory(categoryData);

    logAudit('CREATE', req.user!.id, 'category', category.id, categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  });

  /**
   * Update category
   */
  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingCategory = await this.categoryService.getCategoryById(id);
    if (!existingCategory) {
      throw new NotFoundError('Category');
    }

    const category = await this.categoryService.updateCategory(id, updateData);

    logAudit('UPDATE', req.user!.id, 'category', id, updateData);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  });

  /**
   * Delete category
   */
  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { moveProductsTo } = req.query;

    const existingCategory = await this.categoryService.getCategoryById(id);
    if (!existingCategory) {
      throw new NotFoundError('Category');
    }

    await this.categoryService.deleteCategory(id, moveProductsTo as string);

    logAudit('DELETE', req.user!.id, 'category', id, { moveProductsTo });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  });

  /**
   * Update category status (activate/deactivate)
   */
  updateCategoryStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean value');
    }

    const category = await this.categoryService.updateCategory(id, { isActive });

    logAudit('STATUS_UPDATE', req.user!.id, 'category', id, { isActive });

    res.json({
      success: true,
      message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { category }
    });
  });

  /**
   * Reorder categories
   */
  reorderCategories = asyncHandler(async (req: Request, res: Response) => {
    const { categoryOrders } = req.body;

    if (!Array.isArray(categoryOrders)) {
      throw new ValidationError('categoryOrders must be an array');
    }

    await this.categoryService.reorderCategories(categoryOrders);

    logAudit('REORDER', req.user!.id, 'category', 'multiple', { categoryOrders });

    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  });

  /**
   * Move category to different parent
   */
  moveCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newParentId } = req.body;

    const category = await this.categoryService.moveCategory(id, newParentId);

    logAudit('MOVE', req.user!.id, 'category', id, { newParentId });

    res.json({
      success: true,
      message: 'Category moved successfully',
      data: { category }
    });
  });

  /**
   * Get category attributes
   */
  getCategoryAttributes = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const attributes = await this.categoryService.getCategoryAttributes(id);

    res.json({
      success: true,
      data: { attributes }
    });
  });

  /**
   * Create category attribute
   */
  createCategoryAttribute = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const attributeData = req.body;

    if (!attributeData.name || !attributeData.type) {
      throw new ValidationError('Attribute name and type are required');
    }

    const attribute = await this.categoryService.createCategoryAttribute(id, attributeData);

    logAudit('CREATE', req.user!.id, 'category_attribute', attribute.id, {
      categoryId: id,
      ...attributeData
    });

    res.status(201).json({
      success: true,
      message: 'Category attribute created successfully',
      data: { attribute }
    });
  });

  /**
   * Update category attribute
   */
  updateCategoryAttribute = asyncHandler(async (req: Request, res: Response) => {
    const { id, attributeId } = req.params;
    const updateData = req.body;

    const attribute = await this.categoryService.updateCategoryAttribute(attributeId, updateData);

    logAudit('UPDATE', req.user!.id, 'category_attribute', attributeId, updateData);

    res.json({
      success: true,
      message: 'Category attribute updated successfully',
      data: { attribute }
    });
  });

  /**
   * Delete category attribute
   */
  deleteCategoryAttribute = asyncHandler(async (req: Request, res: Response) => {
    const { id, attributeId } = req.params;

    await this.categoryService.deleteCategoryAttribute(attributeId);

    logAudit('DELETE', req.user!.id, 'category_attribute', attributeId);

    res.json({
      success: true,
      message: 'Category attribute deleted successfully'
    });
  });

  /**
   * Get category statistics
   */
  getCategoryStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.categoryService.getCategoryStatistics();

    res.json({
      success: true,
      data: { stats }
    });
  });

  /**
   * Search categories
   */
  searchCategories = asyncHandler(async (req: Request, res: Response) => {
    const { q: query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required');
    }

    const categories = await this.categoryService.searchCategories(
      query,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: { categories }
    });
  });

  /**
   * Get category breadcrumb
   */
  getCategoryBreadcrumb = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const breadcrumb = await this.categoryService.getCategoryBreadcrumb(id);

    res.json({
      success: true,
      data: { breadcrumb }
    });
  });

  /**
   * Bulk update categories
   */
  bulkUpdateCategories = asyncHandler(async (req: Request, res: Response) => {
    const { categoryIds, updateData } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new ValidationError('Category IDs array is required');
    }

    const result = await this.categoryService.bulkUpdateCategories(categoryIds, updateData);

    logAudit('BULK_UPDATE', req.user!.id, 'category', 'multiple', {
      categoryIds,
      updateData,
      updatedCount: result.count
    });

    res.json({
      success: true,
      message: `${result.count} categories updated successfully`,
      data: { updatedCount: result.count }
    });
  });

  /**
   * Export categories
   */
  exportCategories = asyncHandler(async (req: Request, res: Response) => {
    const { format = 'csv', includeHierarchy = 'true' } = req.query;

    const exportResult = await this.categoryService.exportCategories(
      format as string,
      includeHierarchy === 'true'
    );

    logAudit('EXPORT', req.user!.id, 'category', 'bulk', {
      format,
      includeHierarchy,
      exportedCount: exportResult.count
    });

    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.send(exportResult.data);
  });
}