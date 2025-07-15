"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const slug_1 = require("../utils/slug");
class CategoryService {
    async getCategoryHierarchy(options) {
        const whereClause = {
            parentId: null
        };
        if (options.isActive !== undefined) {
            whereClause.isActive = options.isActive;
        }
        const childrenWhere = {};
        if (options.isActive !== undefined) {
            childrenWhere.isActive = options.isActive;
        }
        const childrenInclude = {
            include: {
                children: {
                    include: {
                        children: true,
                        ...(options.includeProducts && {
                            products: {
                                where: { isActive: true },
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    basePrice: true,
                                    images: true
                                }
                            }
                        }),
                        _count: {
                            select: {
                                products: true
                            }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                },
                ...(options.includeProducts && {
                    products: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            basePrice: true,
                            images: true
                        }
                    }
                }),
                _count: {
                    select: {
                        products: true
                    }
                }
            },
            orderBy: { sortOrder: 'asc' }
        };
        const categories = await database_1.prisma.category.findMany({
            where: whereClause,
            include: {
                children: childrenInclude,
                ...(options.includeProducts && {
                    products: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            basePrice: true,
                            images: true
                        }
                    }
                }),
                _count: {
                    select: {
                        products: true,
                        children: true
                    }
                }
            },
            orderBy: { sortOrder: 'asc' }
        });
        return categories;
    }
    async getFlatCategories(options) {
        const { pagination } = options;
        const where = {};
        if (options.isActive !== undefined) {
            where.isActive = options.isActive;
        }
        const includeClause = {
            parent: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            _count: {
                select: {
                    products: true,
                    children: true
                }
            }
        };
        if (options.includeProducts) {
            includeClause.products = {
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    basePrice: true,
                    images: true
                }
            };
        }
        const queryOptions = {
            where,
            include: includeClause,
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ]
        };
        if (pagination) {
            queryOptions.skip = (pagination.page - 1) * pagination.limit;
            queryOptions.take = pagination.limit;
        }
        const [categories, total] = await Promise.all([
            database_1.prisma.category.findMany(queryOptions),
            database_1.prisma.category.count({ where })
        ]);
        return { categories, total };
    }
    async getCategoryById(id, options = {}) {
        const includeClause = {
            parent: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            attributes: {
                orderBy: { sortOrder: 'asc' }
            },
            _count: {
                select: {
                    products: true,
                    children: true
                }
            }
        };
        if (options.includeChildren) {
            includeClause.children = {
                include: {
                    _count: {
                        select: {
                            products: true
                        }
                    }
                },
                orderBy: { sortOrder: 'asc' }
            };
        }
        if (options.includeProducts) {
            includeClause.products = {
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    basePrice: true,
                    images: true
                }
            };
        }
        const category = await database_1.prisma.category.findUnique({
            where: { id },
            include: includeClause
        });
        return category;
    }
    async createCategory(data) {
        if (!data.slug) {
            data.slug = (0, slug_1.generateSlug)(data.name);
        }
        const existingCategory = await database_1.prisma.category.findUnique({
            where: { slug: data.slug }
        });
        if (existingCategory) {
            data.slug = `${data.slug}-${Date.now()}`;
        }
        if (data.parentId) {
            const parentCategory = await database_1.prisma.category.findUnique({
                where: { id: data.parentId }
            });
            if (!parentCategory) {
                throw new error_middleware_1.ValidationError('Parent category not found');
            }
            const depth = await this.getCategoryDepth(data.parentId);
            if (depth >= 3) {
                throw new error_middleware_1.ValidationError('Maximum category depth exceeded (4 levels)');
            }
        }
        if (data.sortOrder === undefined) {
            const maxOrder = await database_1.prisma.category.aggregate({
                where: { parentId: data.parentId || null },
                _max: { sortOrder: true }
            });
            data.sortOrder = (maxOrder._max.sortOrder || 0) + 1;
        }
        const category = await database_1.prisma.category.create({
            data,
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                _count: {
                    select: {
                        products: true,
                        children: true
                    }
                }
            }
        });
        return category;
    }
    async updateCategory(id, data) {
        const existingCategory = await database_1.prisma.category.findUnique({
            where: { id }
        });
        if (!existingCategory) {
            throw new error_middleware_1.NotFoundError('Category');
        }
        if (data.name && data.name !== existingCategory.name && !data.slug) {
            data.slug = (0, slug_1.generateSlug)(data.name);
            const slugExists = await database_1.prisma.category.findFirst({
                where: {
                    slug: data.slug,
                    id: { not: id }
                }
            });
            if (slugExists) {
                data.slug = `${data.slug}-${Date.now()}`;
            }
        }
        if (data.parentId !== undefined) {
            if (data.parentId === id) {
                throw new error_middleware_1.ValidationError('Category cannot be its own parent');
            }
            if (data.parentId) {
                const parentCategory = await database_1.prisma.category.findUnique({
                    where: { id: data.parentId }
                });
                if (!parentCategory) {
                    throw new error_middleware_1.ValidationError('Parent category not found');
                }
                const isCircular = await this.wouldCreateCircularReference(id, data.parentId);
                if (isCircular) {
                    throw new error_middleware_1.ValidationError('This would create a circular reference');
                }
                const depth = await this.getCategoryDepth(data.parentId);
                if (depth >= 3) {
                    throw new error_middleware_1.ValidationError('Maximum category depth exceeded (4 levels)');
                }
            }
        }
        const category = await database_1.prisma.category.update({
            where: { id },
            data,
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                _count: {
                    select: {
                        products: true,
                        children: true
                    }
                }
            }
        });
        return category;
    }
    async deleteCategory(id, moveProductsTo) {
        const category = await database_1.prisma.category.findUnique({
            where: { id },
            include: {
                children: true,
                products: true
            }
        });
        if (!category) {
            throw new error_middleware_1.NotFoundError('Category');
        }
        if (category.children.length > 0) {
            throw new error_middleware_1.ConflictError('Cannot delete category with subcategories. Move or delete them first.');
        }
        if (category.products.length > 0) {
            if (moveProductsTo) {
                const targetCategory = await database_1.prisma.category.findUnique({
                    where: { id: moveProductsTo }
                });
                if (!targetCategory) {
                    throw new error_middleware_1.ValidationError('Target category not found');
                }
                await database_1.prisma.product.updateMany({
                    where: { categoryId: id },
                    data: { categoryId: moveProductsTo }
                });
            }
            else {
                throw new error_middleware_1.ConflictError('Category has products. Specify a target category to move them or delete products first.');
            }
        }
        await database_1.prisma.categoryAttribute.deleteMany({
            where: { categoryId: id }
        });
        await database_1.prisma.promotionCategory.deleteMany({
            where: { categoryId: id }
        });
        await database_1.prisma.category.delete({
            where: { id }
        });
    }
    async reorderCategories(categoryOrders) {
        const updatePromises = categoryOrders.map(({ id, sortOrder }) => database_1.prisma.category.update({
            where: { id },
            data: { sortOrder }
        }));
        await Promise.all(updatePromises);
    }
    async moveCategory(id, newParentId) {
        if (newParentId === id) {
            throw new error_middleware_1.ValidationError('Category cannot be its own parent');
        }
        if (newParentId) {
            const parentCategory = await database_1.prisma.category.findUnique({
                where: { id: newParentId }
            });
            if (!parentCategory) {
                throw new error_middleware_1.ValidationError('Parent category not found');
            }
            const isCircular = await this.wouldCreateCircularReference(id, newParentId);
            if (isCircular) {
                throw new error_middleware_1.ValidationError('This would create a circular reference');
            }
            const depth = await this.getCategoryDepth(newParentId);
            if (depth >= 3) {
                throw new error_middleware_1.ValidationError('Maximum category depth exceeded (4 levels)');
            }
        }
        const category = await database_1.prisma.category.update({
            where: { id },
            data: { parentId: newParentId || null },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });
        return category;
    }
    async getCategoryAttributes(categoryId) {
        const attributes = await database_1.prisma.categoryAttribute.findMany({
            where: { categoryId },
            orderBy: { sortOrder: 'asc' }
        });
        return attributes;
    }
    async createCategoryAttribute(categoryId, data) {
        const category = await database_1.prisma.category.findUnique({
            where: { id: categoryId }
        });
        if (!category) {
            throw new error_middleware_1.NotFoundError('Category');
        }
        const existingAttribute = await database_1.prisma.categoryAttribute.findFirst({
            where: {
                categoryId,
                name: data.name
            }
        });
        if (existingAttribute) {
            throw new error_middleware_1.ConflictError('Attribute with this name already exists for this category');
        }
        if (data.sortOrder === undefined) {
            const maxOrder = await database_1.prisma.categoryAttribute.aggregate({
                where: { categoryId },
                _max: { sortOrder: true }
            });
            data.sortOrder = (maxOrder._max.sortOrder || 0) + 1;
        }
        const attribute = await database_1.prisma.categoryAttribute.create({
            data: {
                ...data,
                categoryId
            }
        });
        return attribute;
    }
    async updateCategoryAttribute(attributeId, data) {
        const existingAttribute = await database_1.prisma.categoryAttribute.findUnique({
            where: { id: attributeId }
        });
        if (!existingAttribute) {
            throw new error_middleware_1.NotFoundError('Category attribute');
        }
        if (data.name && data.name !== existingAttribute.name) {
            const nameExists = await database_1.prisma.categoryAttribute.findFirst({
                where: {
                    categoryId: existingAttribute.categoryId,
                    name: data.name,
                    id: { not: attributeId }
                }
            });
            if (nameExists) {
                throw new error_middleware_1.ConflictError('Attribute with this name already exists for this category');
            }
        }
        const attribute = await database_1.prisma.categoryAttribute.update({
            where: { id: attributeId },
            data
        });
        return attribute;
    }
    async deleteCategoryAttribute(attributeId) {
        const attribute = await database_1.prisma.categoryAttribute.findUnique({
            where: { id: attributeId }
        });
        if (!attribute) {
            throw new error_middleware_1.NotFoundError('Category attribute');
        }
        await database_1.prisma.categoryAttribute.delete({
            where: { id: attributeId }
        });
    }
    async searchCategories(query, limit = 10) {
        const categories = await database_1.prisma.category.findMany({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true,
                parent: {
                    select: {
                        name: true
                    }
                }
            },
            take: limit,
            orderBy: { name: 'asc' }
        });
        return categories;
    }
    async getCategoryBreadcrumb(categoryId) {
        const breadcrumb = [];
        let currentCategory = await database_1.prisma.category.findUnique({
            where: { id: categoryId },
            select: {
                id: true,
                name: true,
                slug: true,
                parentId: true
            }
        });
        while (currentCategory) {
            breadcrumb.unshift({
                id: currentCategory.id,
                name: currentCategory.name,
                slug: currentCategory.slug
            });
            if (currentCategory.parentId) {
                currentCategory = await database_1.prisma.category.findUnique({
                    where: { id: currentCategory.parentId },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        parentId: true
                    }
                });
            }
            else {
                currentCategory = null;
            }
        }
        return breadcrumb;
    }
    async getCategoryStatistics() {
        const [totalCategories, activeCategories, categoriesWithProducts, rootCategories, categoryProductCounts] = await Promise.all([
            database_1.prisma.category.count(),
            database_1.prisma.category.count({ where: { isActive: true } }),
            database_1.prisma.category.count({
                where: {
                    products: {
                        some: {}
                    }
                }
            }),
            database_1.prisma.category.count({ where: { parentId: null } }),
            database_1.prisma.category.findMany({
                select: {
                    _count: {
                        select: {
                            products: true
                        }
                    }
                }
            })
        ]);
        const totalProducts = categoryProductCounts.reduce((sum, category) => sum + category._count.products, 0);
        const averageProductsPerCategory = totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0;
        return {
            totalCategories,
            activeCategories,
            categoriesWithProducts,
            rootCategories,
            inactiveCategories: totalCategories - activeCategories,
            averageProductsPerCategory
        };
    }
    async bulkUpdateCategories(categoryIds, updateData) {
        const result = await database_1.prisma.category.updateMany({
            where: {
                id: { in: categoryIds }
            },
            data: updateData
        });
        return result;
    }
    async exportCategories(format, includeHierarchy = true) {
        const includeClause = {
            _count: {
                select: {
                    products: true,
                    children: true
                }
            }
        };
        if (includeHierarchy) {
            includeClause.parent = {
                select: {
                    name: true
                }
            };
        }
        const categories = await database_1.prisma.category.findMany({
            include: includeClause,
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ]
        });
        const data = categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            parentCategory: category.parent?.name || '',
            productCount: category._count.products,
            subcategoryCount: category._count.children,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
            createdAt: category.createdAt
        }));
        return {
            data: JSON.stringify(data),
            filename: `categories-export-${Date.now()}.${format}`,
            contentType: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            count: categories.length
        };
    }
    async getCategoryDepth(categoryId) {
        let depth = 0;
        let currentCategory = await database_1.prisma.category.findUnique({
            where: { id: categoryId },
            select: { parentId: true }
        });
        while (currentCategory?.parentId) {
            depth++;
            currentCategory = await database_1.prisma.category.findUnique({
                where: { id: currentCategory.parentId },
                select: { parentId: true }
            });
        }
        return depth;
    }
    async wouldCreateCircularReference(categoryId, newParentId) {
        let currentParent = await database_1.prisma.category.findUnique({
            where: { id: newParentId },
            select: { parentId: true }
        });
        while (currentParent) {
            if (currentParent.parentId === categoryId) {
                return true;
            }
            currentParent = currentParent.parentId ? await database_1.prisma.category.findUnique({
                where: { id: currentParent.parentId },
                select: { parentId: true }
            }) : null;
        }
        return false;
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map