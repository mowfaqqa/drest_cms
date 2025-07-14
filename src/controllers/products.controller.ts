import { Request, Response } from 'express';
import { ProductService } from '@/services/product.service';
import { asyncHandler, ValidationError, NotFoundError } from '@/middleware/error.middleware';
import { logAudit } from '@/utils/logger';
import { createPaginationMeta } from '@/utils/pagination';

export class ProductsController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Get all products with filtering and pagination
   */
  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      brandId,
      isActive,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      categoryId: categoryId as string,
      brandId: brandId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined
    };

    const pagination = {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100) // Max 100 items per page
    };

    const sorting = {
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await this.productService.getProducts(filters, pagination, sorting);

    const paginationMeta = createPaginationMeta(
      result.total,
      pagination.page,
      pagination.limit
    );

    res.json({
      success: true,
      data: {
        products: result.products,
        pagination: paginationMeta
      }
    });
  });

  /**
   * Get product by ID
   */
  getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { include } = req.query;

    const includeArr =
      typeof include === 'string'
        ? [include]
        : Array.isArray(include)
        ? include
        : [];

    const includeOptions = {
      variants: includeArr.includes('variants'),
      inventory: includeArr.includes('inventory'),
      category: includeArr.includes('category'),
      brand: includeArr.includes('brand'),
      reviews: includeArr.includes('reviews')
    };

    const product = await this.productService.getProductById(id, includeOptions);

    if (!product) {
      throw new NotFoundError('Product');
    }

    res.json({
      success: true,
      data: { product }
    });
  });

  /**
   * Create new product
   */
  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const productData = req.body;

    // Validate required fields
    if (!productData.name || !productData.categoryId) {
      throw new ValidationError('Name and category are required');
    }

    const product = await this.productService.createProduct(productData);

    logAudit('CREATE', req.user!.id, 'product', product.id, productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  });

  /**
   * Update product
   */
  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingProduct = await this.productService.getProductById(id);
    if (!existingProduct) {
      throw new NotFoundError('Product');
    }

    const product = await this.productService.updateProduct(id, updateData);

    logAudit('UPDATE', req.user!.id, 'product', id, updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  });

  /**
   * Delete product
   */
  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingProduct = await this.productService.getProductById(id);
    if (!existingProduct) {
      throw new NotFoundError('Product');
    }

    await this.productService.deleteProduct(id);

    logAudit('DELETE', req.user!.id, 'product', id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  });

  /**
   * Bulk update products
   */
  bulkUpdateProducts = asyncHandler(async (req: Request, res: Response) => {
    const { productIds, updateData } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new ValidationError('Product IDs array is required');
    }

    const result = await this.productService.bulkUpdateProducts(productIds, updateData);

    logAudit('BULK_UPDATE', req.user!.id, 'product', 'multiple', {
      productIds,
      updateData,
      updatedCount: result.count
    });

    res.json({
      success: true,
      message: `${result.count} products updated successfully`,
      data: { updatedCount: result.count }
    });
  });

  /**
   * Duplicate product
   */
  duplicateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    const existingProduct = await this.productService.getProductById(id, {
      variants: true,
      inventory: false,
      category: false,
      brand: false,
      reviews: false
    });

    if (!existingProduct) {
      throw new NotFoundError('Product');
    }

    const duplicatedProduct = await this.productService.duplicateProduct(id, name);

    logAudit('DUPLICATE', req.user!.id, 'product', duplicatedProduct.id, {
      originalProductId: id,
      newName: name
    });

    res.status(201).json({
      success: true,
      message: 'Product duplicated successfully',
      data: { product: duplicatedProduct }
    });
  });

  /**
   * Get product variants
   */
  getProductVariants = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const variants = await this.productService.getProductVariants(id);

    res.json({
      success: true,
      data: { variants }
    });
  });

  /**
   * Create product variant
   */
  createProductVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const variantData = req.body;

    // Check if product exists
    const product = await this.productService.getProductById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const variant = await this.productService.createProductVariant(id, variantData);

    logAudit('CREATE', req.user!.id, 'product_variant', variant.id, {
      productId: id,
      ...variantData
    });

    res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      data: { variant }
    });
  });

  /**
   * Update product variant
   */
  updateProductVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id, variantId } = req.params;
    const updateData = req.body;

    const variant = await this.productService.updateProductVariant(variantId, updateData);

    logAudit('UPDATE', req.user!.id, 'product_variant', variantId, updateData);

    res.json({
      success: true,
      message: 'Product variant updated successfully',
      data: { variant }
    });
  });

  /**
   * Delete product variant
   */
  deleteProductVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id, variantId } = req.params;

    await this.productService.deleteProductVariant(variantId);

    logAudit('DELETE', req.user!.id, 'product_variant', variantId);

    res.json({
      success: true,
      message: 'Product variant deleted successfully'
    });
  });

  /**
   * Update product status (activate/deactivate)
   */
  updateProductStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean value');
    }

    const product = await this.productService.updateProduct(id, { isActive });

    logAudit('STATUS_UPDATE', req.user!.id, 'product', id, { isActive });

    res.json({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { product }
    });
  });

  /**
   * Get product analytics
   */
  getProductAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    const analytics = await this.productService.getProductAnalytics(id, period as string);

    res.json({
      success: true,
      data: { analytics }
    });
  });

  /**
   * Search products
   */
  searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const { q: query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required');
    }

    const products = await this.productService.searchProducts(
      query,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: { products }
    });
  });

  /**
   * Get products by category
   */
  getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, includeSubcategories = 'true' } = req.query;

    const pagination = {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100)
    };

    const result = await this.productService.getProductsByCategory(
      categoryId,
      includeSubcategories === 'true',
      pagination
    );

    const paginationMeta = createPaginationMeta(
      result.total,
      pagination.page,
      pagination.limit
    );

    res.json({
      success: true,
      data: {
        products: result.products,
        pagination: paginationMeta,
        category: result.category
      }
    });
  });

  /**
   * Get product statistics
   */
  getProductStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.productService.getProductStatistics();

    res.json({
      success: true,
      data: { stats }
    });
  });

  /**
   * Import products from CSV/Excel
   */
  importProducts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError('File is required');
    }

    const result = await this.productService.importProducts(req.file);

    logAudit('IMPORT', req.user!.id, 'product', 'bulk', {
      fileName: req.file.originalname,
      importedCount: result.successful.length,
      errorCount: result.errors.length
    });

    res.json({
      success: true,
      message: `Import completed. ${result.successful.length} products imported, ${result.errors.length} errors`,
      data: {
        successful: result.successful.length,
        errors: result.errors
      }
    });
  });

  /**
   * Export products to CSV/Excel
   */
  exportProducts = asyncHandler(async (req: Request, res: Response) => {
    const { format = 'csv', filters } = req.query;

    const exportResult = await this.productService.exportProducts(
      format as string,
      filters as any
    );

    logAudit('EXPORT', req.user!.id, 'product', 'bulk', {
      format,
      filters,
      exportedCount: exportResult.count
    });

    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.send(exportResult.data);
  });
}