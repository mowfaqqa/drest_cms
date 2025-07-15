"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const product_service_1 = require("../services/product.service");
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = require("../utils/logger");
const pagination_1 = require("../utils/pagination");
class ProductsController {
    constructor() {
        this.getProducts = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 20, search, categoryId, brandId, isActive, isFeatured, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filters = {
                search: search,
                categoryId: categoryId,
                brandId: brandId,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined
            };
            const pagination = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100)
            };
            const sorting = {
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await this.productService.getProducts(filters, pagination, sorting);
            const paginationMeta = (0, pagination_1.createPaginationMeta)(result.total, pagination.page, pagination.limit);
            res.json({
                success: true,
                data: {
                    products: result.products,
                    pagination: paginationMeta
                }
            });
        });
        this.getProduct = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { include } = req.query;
            const includeArr = typeof include === 'string'
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
                throw new error_middleware_1.NotFoundError('Product');
            }
            res.json({
                success: true,
                data: { product }
            });
        });
        this.createProduct = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const productData = req.body;
            if (!productData.name || !productData.categoryId) {
                throw new error_middleware_1.ValidationError('Name and category are required');
            }
            const product = await this.productService.createProduct(productData);
            (0, logger_1.logAudit)('CREATE', req.user.id, 'product', product.id, productData);
            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: { product }
            });
        });
        this.updateProduct = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const updateData = req.body;
            const existingProduct = await this.productService.getProductById(id);
            if (!existingProduct) {
                throw new error_middleware_1.NotFoundError('Product');
            }
            const product = await this.productService.updateProduct(id, updateData);
            (0, logger_1.logAudit)('UPDATE', req.user.id, 'product', id, updateData);
            res.json({
                success: true,
                message: 'Product updated successfully',
                data: { product }
            });
        });
        this.deleteProduct = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const existingProduct = await this.productService.getProductById(id);
            if (!existingProduct) {
                throw new error_middleware_1.NotFoundError('Product');
            }
            await this.productService.deleteProduct(id);
            (0, logger_1.logAudit)('DELETE', req.user.id, 'product', id);
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        });
        this.bulkUpdateProducts = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { productIds, updateData } = req.body;
            if (!Array.isArray(productIds) || productIds.length === 0) {
                throw new error_middleware_1.ValidationError('Product IDs array is required');
            }
            const result = await this.productService.bulkUpdateProducts(productIds, updateData);
            (0, logger_1.logAudit)('BULK_UPDATE', req.user.id, 'product', 'multiple', {
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
        this.duplicateProduct = (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
                throw new error_middleware_1.NotFoundError('Product');
            }
            const duplicatedProduct = await this.productService.duplicateProduct(id, name);
            (0, logger_1.logAudit)('DUPLICATE', req.user.id, 'product', duplicatedProduct.id, {
                originalProductId: id,
                newName: name
            });
            res.status(201).json({
                success: true,
                message: 'Product duplicated successfully',
                data: { product: duplicatedProduct }
            });
        });
        this.getProductVariants = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const variants = await this.productService.getProductVariants(id);
            res.json({
                success: true,
                data: { variants }
            });
        });
        this.createProductVariant = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const variantData = req.body;
            const product = await this.productService.getProductById(id);
            if (!product) {
                throw new error_middleware_1.NotFoundError('Product');
            }
            const variant = await this.productService.createProductVariant(id, variantData);
            (0, logger_1.logAudit)('CREATE', req.user.id, 'product_variant', variant.id, {
                productId: id,
                ...variantData
            });
            res.status(201).json({
                success: true,
                message: 'Product variant created successfully',
                data: { variant }
            });
        });
        this.updateProductVariant = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { variantId } = req.params;
            const updateData = req.body;
            const variant = await this.productService.updateProductVariant(variantId, updateData);
            (0, logger_1.logAudit)('UPDATE', req.user.id, 'product_variant', variantId, updateData);
            res.json({
                success: true,
                message: 'Product variant updated successfully',
                data: { variant }
            });
        });
        this.deleteProductVariant = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { variantId } = req.params;
            await this.productService.deleteProductVariant(variantId);
            (0, logger_1.logAudit)('DELETE', req.user.id, 'product_variant', variantId);
            res.json({
                success: true,
                message: 'Product variant deleted successfully'
            });
        });
        this.updateProductStatus = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                throw new error_middleware_1.ValidationError('isActive must be a boolean value');
            }
            const product = await this.productService.updateProduct(id, { isActive });
            (0, logger_1.logAudit)('STATUS_UPDATE', req.user.id, 'product', id, { isActive });
            res.json({
                success: true,
                message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: { product }
            });
        });
        this.getProductAnalytics = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { period = '30d' } = req.query;
            const analytics = await this.productService.getProductAnalytics(id, period);
            res.json({
                success: true,
                data: { analytics }
            });
        });
        this.searchProducts = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { q: query, limit = 10 } = req.query;
            if (!query || typeof query !== 'string') {
                throw new error_middleware_1.ValidationError('Search query is required');
            }
            const products = await this.productService.searchProducts(query, parseInt(limit));
            res.json({
                success: true,
                data: { products }
            });
        });
        this.getProductsByCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { categoryId } = req.params;
            const { page = 1, limit = 20, includeSubcategories = 'true' } = req.query;
            const pagination = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100)
            };
            const result = await this.productService.getProductsByCategory(categoryId, includeSubcategories === 'true', pagination);
            const paginationMeta = (0, pagination_1.createPaginationMeta)(result.total, pagination.page, pagination.limit);
            res.json({
                success: true,
                data: {
                    products: result.products,
                    pagination: paginationMeta,
                    category: result.category
                }
            });
        });
        this.getProductStats = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
            const stats = await this.productService.getProductStatistics();
            res.json({
                success: true,
                data: { stats }
            });
        });
        this.importProducts = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            if (!req.file) {
                throw new error_middleware_1.ValidationError('File is required');
            }
            const result = await this.productService.importProducts(req.file);
            (0, logger_1.logAudit)('IMPORT', req.user.id, 'product', 'bulk', {
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
        this.exportProducts = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { format = 'csv', filters } = req.query;
            const exportResult = await this.productService.exportProducts(format, filters);
            (0, logger_1.logAudit)('EXPORT', req.user.id, 'product', 'bulk', {
                format,
                filters,
                exportedCount: exportResult.count
            });
            res.setHeader('Content-Type', exportResult.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
            res.send(exportResult.data);
        });
        this.productService = new product_service_1.ProductService();
    }
}
exports.ProductsController = ProductsController;
//# sourceMappingURL=products.controller.js.map