"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const slug_1 = require("../utils/slug");
const logger_1 = require("../utils/logger");
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
class ProductService {
    async getProducts(filters, pagination, sorting) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { shortDescription: { contains: filters.search, mode: 'insensitive' } },
                { tags: { hasSome: [filters.search] } }
            ];
        }
        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters.brandId) {
            where.brandId = filters.brandId;
        }
        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        if (filters.isFeatured !== undefined) {
            where.isFeatured = filters.isFeatured;
        }
        const orderBy = {};
        switch (sorting.sortBy) {
            case 'name':
                orderBy.name = sorting.sortOrder;
                break;
            case 'price':
                orderBy.basePrice = sorting.sortOrder;
                break;
            case 'createdAt':
                orderBy.createdAt = sorting.sortOrder;
                break;
            case 'updatedAt':
                orderBy.updatedAt = sorting.sortOrder;
                break;
            default:
                orderBy.createdAt = 'desc';
        }
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    brand: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    variants: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            price: true,
                            isActive: true
                        }
                    },
                    _count: {
                        select: {
                            variants: true,
                            reviews: true
                        }
                    }
                }
            }),
            database_1.prisma.product.count({ where })
        ]);
        return { products, total };
    }
    async getProductById(id, include = {}) {
        const includeClause = {
            _count: {
                select: {
                    variants: true,
                    reviews: true
                }
            }
        };
        if (include.category) {
            includeClause.category = {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true
                }
            };
        }
        if (include.brand) {
            includeClause.brand = {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    logo: true
                }
            };
        }
        if (include.variants) {
            includeClause.variants = {
                include: {
                    inventory: !!include.inventory
                }
            };
        }
        else if (include.inventory) {
            includeClause.inventory = true;
        }
        if (include.reviews) {
            includeClause.reviews = {
                where: { status: 'APPROVED' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            };
        }
        const product = await database_1.prisma.product.findUnique({
            where: { id },
            include: includeClause
        });
        return product;
    }
    async createProduct(data) {
        if (!data.slug) {
            data.slug = (0, slug_1.generateSlug)(data.name);
        }
        const existingProduct = await database_1.prisma.product.findUnique({
            where: { slug: data.slug }
        });
        if (existingProduct) {
            data.slug = `${data.slug}-${Date.now()}`;
        }
        const category = await database_1.prisma.category.findUnique({
            where: { id: data.categoryId }
        });
        if (!category) {
            throw new error_middleware_1.ValidationError('Category not found');
        }
        if (data.brandId) {
            const brand = await database_1.prisma.brand.findUnique({
                where: { id: data.brandId }
            });
            if (!brand) {
                throw new error_middleware_1.ValidationError('Brand not found');
            }
        }
        const createData = {
            ...data,
            publishedAt: data.isActive ? new Date() : null
        };
        const product = await database_1.prisma.product.create({
            data: createData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                brand: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });
        if (data.trackInventory && !data.variants?.length) {
            await this.createDefaultInventory(product.id);
        }
        return product;
    }
    async updateProduct(id, data) {
        const existingProduct = await database_1.prisma.product.findUnique({
            where: { id }
        });
        if (!existingProduct) {
            throw new error_middleware_1.NotFoundError('Product');
        }
        if (data.name && data.name !== existingProduct.name && !data.slug) {
            data.slug = (0, slug_1.generateSlug)(data.name);
            const slugExists = await database_1.prisma.product.findFirst({
                where: {
                    slug: data.slug,
                    id: { not: id }
                }
            });
            if (slugExists) {
                data.slug = `${data.slug}-${Date.now()}`;
            }
        }
        if (data.categoryId) {
            const category = await database_1.prisma.category.findUnique({
                where: { id: data.categoryId }
            });
            if (!category) {
                throw new error_middleware_1.ValidationError('Category not found');
            }
        }
        if (data.brandId) {
            const brand = await database_1.prisma.brand.findUnique({
                where: { id: data.brandId }
            });
            if (!brand) {
                throw new error_middleware_1.ValidationError('Brand not found');
            }
        }
        if (data.isActive === true && !existingProduct.publishedAt) {
            data.publishedAt = new Date();
        }
        else if (data.isActive === false) {
            data.publishedAt = null;
        }
        const product = await database_1.prisma.product.update({
            where: { id },
            data,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                brand: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });
        return product;
    }
    async deleteProduct(id) {
        const ordersCount = await database_1.prisma.orderItem.count({
            where: { productId: id }
        });
        if (ordersCount > 0) {
            throw new error_middleware_1.ConflictError('Cannot delete product with existing orders. Consider deactivating instead.');
        }
        await database_1.prisma.$transaction([
            database_1.prisma.inventory.deleteMany({
                where: { productId: id }
            }),
            database_1.prisma.inventory.deleteMany({
                where: {
                    variant: {
                        productId: id
                    }
                }
            }),
            database_1.prisma.productVariant.deleteMany({
                where: { productId: id }
            }),
            database_1.prisma.review.deleteMany({
                where: { productId: id }
            }),
            database_1.prisma.cartItem.deleteMany({
                where: { productId: id }
            }),
            database_1.prisma.promotionProduct.deleteMany({
                where: { productId: id }
            }),
            database_1.prisma.product.delete({
                where: { id }
            })
        ]);
    }
    async bulkUpdateProducts(productIds, updateData) {
        const result = await database_1.prisma.product.updateMany({
            where: {
                id: { in: productIds }
            },
            data: updateData
        });
        return result;
    }
    async duplicateProduct(id, newName) {
        const originalProduct = await database_1.prisma.product.findUnique({
            where: { id },
            include: {
                variants: true
            }
        });
        if (!originalProduct) {
            throw new error_middleware_1.NotFoundError('Product');
        }
        const productName = newName || `${originalProduct.name} (Copy)`;
        const slug = (0, slug_1.generateSlug)(productName);
        let finalSlug = slug;
        let counter = 1;
        while (await database_1.prisma.product.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }
        const { id: originalId, createdAt, updatedAt, publishedAt, variants, ...productData } = originalProduct;
        const duplicatedProduct = await database_1.prisma.product.create({
            data: {
                ...productData,
                id: originalId,
                description: originalProduct.description,
                seoTitle: originalProduct.seoTitle,
                seoDescription: originalProduct.seoDescription,
                shortDescription: originalProduct.shortDescription,
                basePrice: originalProduct.basePrice,
                createdAt: new Date(),
                updatedAt: new Date(),
                comparePrice: originalProduct.comparePrice,
                costPrice: originalProduct.costPrice,
                images: originalProduct.images,
                videos: originalProduct.videos,
                tags: originalProduct.tags,
                requiresShipping: originalProduct.requiresShipping,
                trackInventory: originalProduct.trackInventory,
                allowBackorder: originalProduct.allowBackorder,
                lowStockThreshold: originalProduct.lowStockThreshold,
                categoryId: originalProduct.categoryId,
                brandId: originalProduct.brandId,
                name: productName,
                slug: finalSlug,
                isActive: false,
                isFeatured: false,
                publishedAt: null
            }
        });
        if (originalProduct.variants.length > 0) {
            const variantPromises = originalProduct.variants.map(variant => {
                const { id: variantId, productId, createdAt: vCreatedAt, updatedAt: vUpdatedAt, ...variantData } = variant;
                return database_1.prisma.productVariant.create({
                    data: {
                        ...variantData,
                        name: variantData.name,
                        id: variantId,
                        isActive: variantData.isActive,
                        price: variantData.price,
                        comparePrice: variantData.comparePrice,
                        costPrice: variantData.costPrice,
                        images: variantData.images,
                        attributes: variantData.attributes,
                        barcode: variantData.barcode,
                        productId: duplicatedProduct.id,
                        sku: `${variantData.sku}-copy-${Date.now()}`
                    }
                });
            });
            await Promise.all(variantPromises);
        }
        return duplicatedProduct;
    }
    async getProductVariants(productId) {
        const variants = await database_1.prisma.productVariant.findMany({
            where: { productId },
            include: {
                inventory: {
                    select: {
                        quantity: true,
                        reserved: true,
                        available: true,
                        location: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        return variants;
    }
    async createProductVariant(productId, data) {
        if (data.sku) {
            const existingVariant = await database_1.prisma.productVariant.findUnique({
                where: { sku: data.sku }
            });
            if (existingVariant) {
                throw new error_middleware_1.ConflictError('SKU already exists');
            }
        }
        const variant = await database_1.prisma.productVariant.create({
            data: {
                ...data,
                productId
            }
        });
        await this.createDefaultInventory(productId, variant.id);
        return variant;
    }
    async updateProductVariant(variantId, data) {
        if (data.sku) {
            const existingVariant = await database_1.prisma.productVariant.findFirst({
                where: {
                    sku: data.sku,
                    id: { not: variantId }
                }
            });
            if (existingVariant) {
                throw new error_middleware_1.ConflictError('SKU already exists');
            }
        }
        const variant = await database_1.prisma.productVariant.update({
            where: { id: variantId },
            data
        });
        return variant;
    }
    async deleteProductVariant(variantId) {
        const ordersCount = await database_1.prisma.orderItem.count({
            where: { variantId }
        });
        if (ordersCount > 0) {
            throw new error_middleware_1.ConflictError('Cannot delete variant with existing orders');
        }
        await database_1.prisma.$transaction([
            database_1.prisma.inventory.deleteMany({
                where: { variantId }
            }),
            database_1.prisma.cartItem.deleteMany({
                where: { variantId }
            }),
            database_1.prisma.productVariant.delete({
                where: { id: variantId }
            })
        ]);
    }
    async searchProducts(query, limit = 10) {
        const products = await database_1.prisma.product.findMany({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } },
                            { shortDescription: { contains: query, mode: 'insensitive' } },
                            { tags: { hasSome: [query] } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                images: true,
                category: {
                    select: {
                        name: true
                    }
                }
            },
            take: limit,
            orderBy: [
                { isFeatured: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return products;
    }
    async getProductsByCategory(categoryId, includeSubcategories = true, pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const includeClause = includeSubcategories ? {
            children: {
                select: { id: true }
            }
        } : {};
        const category = await database_1.prisma.category.findUnique({
            where: { id: categoryId },
            include: includeClause
        });
        if (!category) {
            throw new error_middleware_1.NotFoundError('Category');
        }
        const categoryIds = [categoryId];
        if (includeSubcategories && 'children' in category && category.children) {
            categoryIds.push(...category.children.map(child => child.id));
        }
        const where = {
            categoryId: { in: categoryIds },
            isActive: true
        };
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    brand: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    }
                },
                orderBy: [
                    { isFeatured: 'desc' },
                    { createdAt: 'desc' }
                ]
            }),
            database_1.prisma.product.count({ where })
        ]);
        return { products, total, category };
    }
    async getProductStatistics() {
        const [totalProducts, activeProducts, featuredProducts, lowStockProducts, categoriesWithProducts] = await Promise.all([
            database_1.prisma.product.count(),
            database_1.prisma.product.count({ where: { isActive: true } }),
            database_1.prisma.product.count({ where: { isFeatured: true } }),
            database_1.prisma.product.count({
                where: {
                    inventory: {
                        some: {
                            quantity: { lte: 10 }
                        }
                    }
                }
            }),
            database_1.prisma.category.count({
                where: {
                    products: {
                        some: {}
                    }
                }
            })
        ]);
        return {
            totalProducts,
            activeProducts,
            featuredProducts,
            lowStockProducts,
            categoriesWithProducts,
            inactiveProducts: totalProducts - activeProducts
        };
    }
    async getProductAnalytics(productId, period) {
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const [orderCount, totalRevenue, averageRating, reviewCount] = await Promise.all([
            database_1.prisma.orderItem.count({
                where: {
                    productId,
                    order: {
                        createdAt: { gte: startDate }
                    }
                }
            }),
            database_1.prisma.orderItem.aggregate({
                where: {
                    productId,
                    order: {
                        createdAt: { gte: startDate }
                    }
                },
                _sum: {
                    totalPrice: true
                }
            }),
            database_1.prisma.review.aggregate({
                where: {
                    productId,
                    status: 'APPROVED'
                },
                _avg: {
                    rating: true
                }
            }),
            database_1.prisma.review.count({
                where: {
                    productId,
                    status: 'APPROVED'
                }
            })
        ]);
        return {
            period,
            orderCount,
            totalRevenue: totalRevenue._sum.totalPrice || 0,
            averageRating: averageRating._avg.rating || 0,
            reviewCount
        };
    }
    async importProducts(file) {
        const results = { successful: [], errors: [] };
        try {
            const stream = stream_1.Readable.from(file.buffer);
            const products = [];
            await new Promise((resolve, reject) => {
                stream
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (data) => products.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });
            for (const productData of products) {
                try {
                    const product = await this.createProduct(productData);
                    results.successful.push(product.id);
                }
                catch (error) {
                    results.errors.push({
                        row: productData,
                        error: error.message
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Product import failed:', error);
            throw new error_middleware_1.ValidationError('Failed to process import file');
        }
        return results;
    }
    async exportProducts(format, filters) {
        const products = await database_1.prisma.product.findMany({
            where: filters,
            include: {
                category: true,
                brand: true,
                variants: true
            }
        });
        const data = products.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.basePrice,
            category: product.category?.name,
            brand: product.brand?.name,
            isActive: product.isActive,
            createdAt: product.createdAt
        }));
        return {
            data: JSON.stringify(data),
            filename: `products-export-${Date.now()}.${format}`,
            contentType: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            count: products.length
        };
    }
    async createDefaultInventory(productId, variantId) {
        const defaultLocation = await database_1.prisma.location.findFirst({
            where: { isDefault: true }
        });
        if (defaultLocation) {
            const inventoryData = {
                quantity: 0,
                reserved: 0,
                available: 0,
                location: {
                    connect: { id: defaultLocation.id }
                }
            };
            if (variantId) {
                inventoryData.variant = { connect: { id: variantId } };
            }
            else {
                inventoryData.product = { connect: { id: productId } };
            }
            await database_1.prisma.inventory.create({
                data: inventoryData
            });
        }
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map