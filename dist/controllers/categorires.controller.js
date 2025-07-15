"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesController = void 0;
const category_service_1 = require("../services/category.service");
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = require("../utils/logger");
const pagination_1 = require("../utils/pagination");
class CategoriesController {
    constructor() {
        this.getCategories = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { flat = 'false', includeProducts = 'false', isActive, page = 1, limit = 50 } = req.query;
            const options = {
                flat: flat === 'true',
                includeProducts: includeProducts === 'true',
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                pagination: {
                    page: parseInt(page),
                    limit: Math.min(parseInt(limit), 100)
                }
            };
            if (options.flat) {
                const result = await this.categoryService.getFlatCategories(options);
                const paginationMeta = (0, pagination_1.createPaginationMeta)(result.total, options.pagination.page, options.pagination.limit);
                res.json({
                    success: true,
                    data: {
                        categories: result.categories,
                        pagination: paginationMeta
                    }
                });
            }
            else {
                const categories = await this.categoryService.getCategoryHierarchy(options);
                res.json({
                    success: true,
                    data: { categories }
                });
            }
        });
        this.getCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { includeProducts = 'false', includeChildren = 'true' } = req.query;
            const options = {
                includeProducts: includeProducts === 'true',
                includeChildren: includeChildren === 'true'
            };
            const category = await this.categoryService.getCategoryById(id, options);
            if (!category) {
                throw new error_middleware_1.NotFoundError('Category');
            }
            res.json({
                success: true,
                data: { category }
            });
        });
        this.createCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const categoryData = req.body;
            if (!categoryData.name) {
                throw new error_middleware_1.ValidationError('Category name is required');
            }
            const category = await this.categoryService.createCategory(categoryData);
            (0, logger_1.logAudit)('CREATE', req.user.id, 'category', category.id, categoryData);
            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: { category }
            });
        });
        this.updateCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const updateData = req.body;
            const existingCategory = await this.categoryService.getCategoryById(id);
            if (!existingCategory) {
                throw new error_middleware_1.NotFoundError('Category');
            }
            const category = await this.categoryService.updateCategory(id, updateData);
            (0, logger_1.logAudit)('UPDATE', req.user.id, 'category', id, updateData);
            res.json({
                success: true,
                message: 'Category updated successfully',
                data: { category }
            });
        });
        this.deleteCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { moveProductsTo } = req.query;
            const existingCategory = await this.categoryService.getCategoryById(id);
            if (!existingCategory) {
                throw new error_middleware_1.NotFoundError('Category');
            }
            await this.categoryService.deleteCategory(id, moveProductsTo);
            (0, logger_1.logAudit)('DELETE', req.user.id, 'category', id, { moveProductsTo });
            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        });
        this.updateCategoryStatus = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                throw new error_middleware_1.ValidationError('isActive must be a boolean value');
            }
            const category = await this.categoryService.updateCategory(id, { isActive });
            (0, logger_1.logAudit)('STATUS_UPDATE', req.user.id, 'category', id, { isActive });
            res.json({
                success: true,
                message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: { category }
            });
        });
        this.reorderCategories = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { categoryOrders } = req.body;
            if (!Array.isArray(categoryOrders)) {
                throw new error_middleware_1.ValidationError('categoryOrders must be an array');
            }
            await this.categoryService.reorderCategories(categoryOrders);
            (0, logger_1.logAudit)('REORDER', req.user.id, 'category', 'multiple', { categoryOrders });
            res.json({
                success: true,
                message: 'Categories reordered successfully'
            });
        });
        this.moveCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { newParentId } = req.body;
            const category = await this.categoryService.moveCategory(id, newParentId);
            (0, logger_1.logAudit)('MOVE', req.user.id, 'category', id, { newParentId });
            res.json({
                success: true,
                message: 'Category moved successfully',
                data: { category }
            });
        });
        this.getCategoryAttributes = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const attributes = await this.categoryService.getCategoryAttributes(id);
            res.json({
                success: true,
                data: { attributes }
            });
        });
        this.createCategoryAttribute = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const attributeData = req.body;
            if (!attributeData.name || !attributeData.type) {
                throw new error_middleware_1.ValidationError('Attribute name and type are required');
            }
            const attribute = await this.categoryService.createCategoryAttribute(id, attributeData);
            (0, logger_1.logAudit)('CREATE', req.user.id, 'category_attribute', attribute.id, {
                categoryId: id,
                ...attributeData
            });
            res.status(201).json({
                success: true,
                message: 'Category attribute created successfully',
                data: { attribute }
            });
        });
        this.updateCategoryAttribute = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { attributeId } = req.params;
            const updateData = req.body;
            const attribute = await this.categoryService.updateCategoryAttribute(attributeId, updateData);
            (0, logger_1.logAudit)('UPDATE', req.user.id, 'category_attribute', attributeId, updateData);
            res.json({
                success: true,
                message: 'Category attribute updated successfully',
                data: { attribute }
            });
        });
        this.deleteCategoryAttribute = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { attributeId } = req.params;
            await this.categoryService.deleteCategoryAttribute(attributeId);
            (0, logger_1.logAudit)('DELETE', req.user.id, 'category_attribute', attributeId);
            res.json({
                success: true,
                message: 'Category attribute deleted successfully'
            });
        });
        this.getCategoryStats = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
            const stats = await this.categoryService.getCategoryStatistics();
            res.json({
                success: true,
                data: { stats }
            });
        });
        this.searchCategories = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { q: query, limit = 10 } = req.query;
            if (!query || typeof query !== 'string') {
                throw new error_middleware_1.ValidationError('Search query is required');
            }
            const categories = await this.categoryService.searchCategories(query, parseInt(limit));
            res.json({
                success: true,
                data: { categories }
            });
        });
        this.getCategoryBreadcrumb = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const breadcrumb = await this.categoryService.getCategoryBreadcrumb(id);
            res.json({
                success: true,
                data: { breadcrumb }
            });
        });
        this.bulkUpdateCategories = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { categoryIds, updateData } = req.body;
            if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
                throw new error_middleware_1.ValidationError('Category IDs array is required');
            }
            const result = await this.categoryService.bulkUpdateCategories(categoryIds, updateData);
            (0, logger_1.logAudit)('BULK_UPDATE', req.user.id, 'category', 'multiple', {
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
        this.exportCategories = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { format = 'csv', includeHierarchy = 'true' } = req.query;
            const exportResult = await this.categoryService.exportCategories(format, includeHierarchy === 'true');
            (0, logger_1.logAudit)('EXPORT', req.user.id, 'category', 'bulk', {
                format,
                includeHierarchy,
                exportedCount: exportResult.count
            });
            res.setHeader('Content-Type', exportResult.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
            res.send(exportResult.data);
        });
        this.categoryService = new category_service_1.CategoryService();
    }
}
exports.CategoriesController = CategoriesController;
//# sourceMappingURL=categorires.controller.js.map