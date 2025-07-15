import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error.middleware';
import { generateSlug } from '../utils/slug';
import { logger } from '../utils/logger';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean | undefined;
  isFeatured?: boolean | undefined;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

interface SortingOptions {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export class ProductService {
  /**
   * Get products with filtering, pagination, and sorting
   */
  async getProducts(
    filters: ProductFilters,
    pagination: PaginationOptions,
    sorting: SortingOptions
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

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

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    
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
      prisma.product.findMany({
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
      prisma.product.count({ where })
    ]);

    return { products, total };
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string, include: any = {}) {
    const includeClause: Prisma.ProductInclude = {
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
    } else if (include.inventory) {
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: includeClause
    });

    return product;
  }

  /**
   * Create new product
   */
  async createProduct(data: any) {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.name);
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: data.slug }
    });

    if (existingProduct) {
      data.slug = `${data.slug}-${Date.now()}`;
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });

    if (!category) {
      throw new ValidationError('Category not found');
    }

    // Validate brand if provided
    if (data.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: data.brandId }
      });

      if (!brand) {
        throw new ValidationError('Brand not found');
      }
    }

    const createData = {
      ...data,
      publishedAt: data.isActive ? new Date() : null
    };

    const product = await prisma.product.create({
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

    // Create default inventory if trackInventory is true
    if (data.trackInventory && !data.variants?.length) {
      await this.createDefaultInventory(product.id);
    }

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, data: any) {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      throw new NotFoundError('Product');
    }

    // Update slug if name changed
    if (data.name && data.name !== existingProduct.name && !data.slug) {
      data.slug = generateSlug(data.name);
      
      // Check if new slug already exists
      const slugExists = await prisma.product.findFirst({
        where: {
          slug: data.slug,
          id: { not: id }
        }
      });

      if (slugExists) {
        data.slug = `${data.slug}-${Date.now()}`;
      }
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId }
      });

      if (!category) {
        throw new ValidationError('Category not found');
      }
    }

    // Validate brand if provided
    if (data.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: data.brandId }
      });

      if (!brand) {
        throw new ValidationError('Brand not found');
      }
    }

    // Update publishedAt if status changed to active
    if (data.isActive === true && !existingProduct.publishedAt) {
      data.publishedAt = new Date();
    } else if (data.isActive === false) {
      data.publishedAt = null;
    }

    const product = await prisma.product.update({
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

  /**
   * Delete product
   */
  async deleteProduct(id: string) {
    // Check if product has any orders
    const ordersCount = await prisma.orderItem.count({
      where: { productId: id }
    });

    if (ordersCount > 0) {
      throw new ConflictError('Cannot delete product with existing orders. Consider deactivating instead.');
    }

    // Delete related data first
    await prisma.$transaction([
      // Delete inventory
      prisma.inventory.deleteMany({
        where: { productId: id }
      }),
      // Delete variants and their inventory
      prisma.inventory.deleteMany({
        where: {
          variant: {
            productId: id
          }
        }
      }),
      prisma.productVariant.deleteMany({
        where: { productId: id }
      }),
      // Delete reviews
      prisma.review.deleteMany({
        where: { productId: id }
      }),
      // Delete cart items
      prisma.cartItem.deleteMany({
        where: { productId: id }
      }),
      // Delete promotion associations
      prisma.promotionProduct.deleteMany({
        where: { productId: id }
      }),
      // Finally delete the product
      prisma.product.delete({
        where: { id }
      })
    ]);
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(productIds: string[], updateData: any) {
    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds }
      },
      data: updateData
    });

    return result;
  }

  /**
   * Duplicate product
   */
  async duplicateProduct(id: string, newName?: string) {
    const originalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true
      }
    });

    if (!originalProduct) {
      throw new NotFoundError('Product');
    }

    const productName = newName || `${originalProduct.name} (Copy)`;
    const slug = generateSlug(productName);

    // Ensure unique slug
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Extract only product fields, excluding relations and system fields
    const {
      id: originalId,
      createdAt,
      updatedAt,
      publishedAt,
      variants,
      ...productData
    } = originalProduct;

    const duplicatedProduct = await prisma.product.create({
      data: {
        ...productData,
        id: originalId, // Keep original ID to avoid conflicts
        description: originalProduct.description,
        seoTitle: originalProduct.seoTitle,
        seoDescription: originalProduct.seoDescription,
        shortDescription: originalProduct.shortDescription,
        basePrice: originalProduct.basePrice,
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePrice: originalProduct.comparePrice,
        costPrice: originalProduct.costPrice,
        images: originalProduct.images as any,
        videos: originalProduct.videos as any,
        tags: originalProduct.tags,
        requiresShipping: originalProduct.requiresShipping,
        trackInventory: originalProduct.trackInventory,
        allowBackorder: originalProduct.allowBackorder,
        lowStockThreshold: originalProduct.lowStockThreshold!,
        categoryId: originalProduct.categoryId,
        brandId: originalProduct.brandId,
        name: productName,
        slug: finalSlug,
        isActive: false, // Start as inactive
        isFeatured: false,
        publishedAt: null
      }
    });

    // Duplicate variants if any
    if (originalProduct.variants.length > 0) {
      const variantPromises = originalProduct.variants.map(variant => {
        const {
          id: variantId,
          productId,
          createdAt: vCreatedAt,
          updatedAt: vUpdatedAt,
          ...variantData
        } = variant;
        
        return prisma.productVariant.create({
          data: {
            ...variantData,
             name: variantData.name,
            id: variantId,
            isActive: variantData.isActive,
            price: variantData.price,
            comparePrice: variantData.comparePrice,
            costPrice: variantData.costPrice,
            images: variantData.images as any,
            attributes: variantData.attributes as any,
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

  /**
   * Get product variants
   */
  async getProductVariants(productId: string) {
    const variants = await prisma.productVariant.findMany({
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

  /**
   * Create product variant
   */
  async createProductVariant(productId: string, data: any) {
    // Validate SKU uniqueness
    if (data.sku) {
      const existingVariant = await prisma.productVariant.findUnique({
        where: { sku: data.sku }
      });

      if (existingVariant) {
        throw new ConflictError('SKU already exists');
      }
    }

    const variant = await prisma.productVariant.create({
      data: {
        ...data,
        productId
      }
    });

    // Create default inventory for the variant
    await this.createDefaultInventory(productId, variant.id);

    return variant;
  }

  /**
   * Update product variant
   */
  async updateProductVariant(variantId: string, data: any) {
    // Validate SKU uniqueness if provided
    if (data.sku) {
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          sku: data.sku,
          id: { not: variantId }
        }
      });

      if (existingVariant) {
        throw new ConflictError('SKU already exists');
      }
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data
    });

    return variant;
  }

  /**
   * Delete product variant
   */
  async deleteProductVariant(variantId: string) {
    // Check if variant has any orders
    const ordersCount = await prisma.orderItem.count({
      where: { variantId }
    });

    if (ordersCount > 0) {
      throw new ConflictError('Cannot delete variant with existing orders');
    }

    await prisma.$transaction([
      // Delete inventory
      prisma.inventory.deleteMany({
        where: { variantId }
      }),
      // Delete cart items
      prisma.cartItem.deleteMany({
        where: { variantId }
      }),
      // Delete variant
      prisma.productVariant.delete({
        where: { id: variantId }
      })
    ]);
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit: number = 10) {
    const products = await prisma.product.findMany({
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

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: string,
    includeSubcategories: boolean = true,
    pagination: PaginationOptions
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Get category
    const includeClause = includeSubcategories ? {
      children: {
        select: { id: true }
      }
    } : {};

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: includeClause
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    // Build category filter
    const categoryIds = [categoryId];
    if (includeSubcategories && 'children' in category && category.children) {
      categoryIds.push(...category.children.map(child => child.id));
    }

    const where = {
      categoryId: { in: categoryIds },
      isActive: true
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
      prisma.product.count({ where })
    ]);

    return { products, total, category };
  }

  /**
   * Get product statistics
   */
  async getProductStatistics() {
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      lowStockProducts,
      categoriesWithProducts
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isFeatured: true } }),
      prisma.product.count({
        where: {
          inventory: {
            some: {
              quantity: { lte: 10 }
            }
          }
        }
      }),
      prisma.category.count({
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

  /**
   * Get product analytics
   */
  async getProductAnalytics(productId: string, period: string) {
    const now = new Date();
    let startDate: Date;

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

    const [
      orderCount,
      totalRevenue,
      averageRating,
      reviewCount
    ] = await Promise.all([
      prisma.orderItem.count({
        where: {
          productId,
          order: {
            createdAt: { gte: startDate }
          }
        }
      }),
      prisma.orderItem.aggregate({
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
      prisma.review.aggregate({
        where: {
          productId,
          status: 'APPROVED'
        },
        _avg: {
          rating: true
        }
      }),
      prisma.review.count({
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

  /**
   * Import products from file
   */
  async importProducts(file: any) {
    const results: any = { successful: [], errors: [] };
    
    // This is a simplified version - you'd want to use a proper CSV/Excel parser
    // and implement detailed validation
    
    try {
      const stream = Readable.from(file.buffer);
      const products: any = [];
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data: any) => products.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      for (const productData of products) {
        try {
          const product = await this.createProduct(productData);
          results.successful.push(product.id);
        } catch (error: any) {
          results.errors.push({
            row: productData,
            error: error.message
          });
        }
      }
    } catch (error) {
      logger.error('Product import failed:', error);
      throw new ValidationError('Failed to process import file');
    }

    return results;
  }

  /**
   * Export products to file
   */
  async exportProducts(format: string, filters?: any) {
    const products = await prisma.product.findMany({
      where: filters,
      include: {
        category: true,
        brand: true,
        variants: true
      }
    });

    // This is a simplified version - implement actual CSV/Excel generation
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
      data: JSON.stringify(data), // Replace with actual CSV/Excel generation
      filename: `products-export-${Date.now()}.${format}`,
      contentType: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      count: products.length
    };
  }

  /**
   * Create default inventory for product or variant
   */
  private async createDefaultInventory(productId: string, variantId?: string) {
    const defaultLocation = await prisma.location.findFirst({
      where: { isDefault: true }
    });

    if (defaultLocation) {
      const inventoryData: Prisma.InventoryCreateInput = {
        quantity: 0,
        reserved: 0,
        available: 0,
        location: {
          connect: { id: defaultLocation.id }
        }
      };

      if (variantId) {
        inventoryData.variant = { connect: { id: variantId } };
      } else {
        inventoryData.product = { connect: { id: productId } };
      }

      await prisma.inventory.create({
        data: inventoryData
      });
    }
  }
}