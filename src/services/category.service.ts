import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { NotFoundError, ValidationError, ConflictError } from '@/middleware/error.middleware';
import { generateSlug } from '@/utils/slug';

interface CategoryOptions {
  includeProducts?: boolean;
  includeChildren?: boolean;
  isActive?: boolean;
  pagination?: {
    page: number;
    limit: number;
  };
}

interface FlatCategoryOptions extends CategoryOptions {
  flat: true;
}

export class CategoryService {
  /**
   * Get category hierarchy (tree structure)
   */
  async getCategoryHierarchy(options: CategoryOptions = {}) {
    // Build the where clause conditionally
    const whereClause: Prisma.CategoryWhereInput = {
      parentId: null
    };
    
    if (options.isActive !== undefined) {
      whereClause.isActive = options.isActive;
    }

    // Build children where clause
    const childrenWhere: Prisma.CategoryWhereInput = {};
    if (options.isActive !== undefined) {
      childrenWhere.isActive = options.isActive;
    }

    // Build include objects conditionally
    const childrenInclude: Prisma.Category$childrenArgs = {
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

    // Add where clause only if needed
    // if (Object.keys(childrenWhere).length > 0) {
    //   childrenInclude.where = childrenWhere;
    //   if (childrenInclude.include?.children) {
    //     childrenInclude.include.children.where = childrenWhere;
    //     if (childrenInclude.include.children.include?.children) {
    //       childrenInclude.include.children.include.children.where = childrenWhere;
    //     }
    //   }
    // }

    const categories = await prisma.category.findMany({
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

  /**
   * Get flat list of categories with pagination
   */
  async getFlatCategories(options: FlatCategoryOptions) {
    const { pagination } = options;

    const where: Prisma.CategoryWhereInput = {};
    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const includeClause: Prisma.CategoryInclude = {
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

    // Build query options conditionally
    const queryOptions: Prisma.CategoryFindManyArgs = {
      where,
      include: includeClause,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    };

    // Add pagination only if provided
    if (pagination) {
      queryOptions.skip = (pagination.page - 1) * pagination.limit;
      queryOptions.take = pagination.limit;
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany(queryOptions),
      prisma.category.count({ where })
    ]);

    return { categories, total };
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string, options: CategoryOptions = {}) {
    const includeClause: Prisma.CategoryInclude = {
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: includeClause
    });

    return category;
  }

  /**
   * Create new category
   */
  async createCategory(data: any) {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.name);
    }

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: data.slug }
    });

    if (existingCategory) {
      data.slug = `${data.slug}-${Date.now()}`;
    }

    // Validate parent category if provided
    if (data.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: data.parentId }
      });

      if (!parentCategory) {
        throw new ValidationError('Parent category not found');
      }

      // Prevent deep nesting (max 4 levels)
      const depth = await this.getCategoryDepth(data.parentId);
      if (depth >= 3) {
        throw new ValidationError('Maximum category depth exceeded (4 levels)');
      }
    }

    // Set sort order if not provided
    if (data.sortOrder === undefined) {
      const maxOrder = await prisma.category.aggregate({
        where: { parentId: data.parentId || null },
        _max: { sortOrder: true }
      });
      data.sortOrder = (maxOrder._max.sortOrder || 0) + 1;
    }

    const category = await prisma.category.create({
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

  /**
   * Update category
   */
  async updateCategory(id: string, data: any) {
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      throw new NotFoundError('Category');
    }

    // Update slug if name changed
    if (data.name && data.name !== existingCategory.name && !data.slug) {
      data.slug = generateSlug(data.name);
      
      // Check if new slug already exists
      const slugExists = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          id: { not: id }
        }
      });

      if (slugExists) {
        data.slug = `${data.slug}-${Date.now()}`;
      }
    }

    // Validate parent category if being changed
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new ValidationError('Category cannot be its own parent');
      }

      if (data.parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: data.parentId }
        });

        if (!parentCategory) {
          throw new ValidationError('Parent category not found');
        }

        // Check if this would create a circular reference
        const isCircular = await this.wouldCreateCircularReference(id, data.parentId);
        if (isCircular) {
          throw new ValidationError('This would create a circular reference');
        }

        // Check depth
        const depth = await this.getCategoryDepth(data.parentId);
        if (depth >= 3) {
          throw new ValidationError('Maximum category depth exceeded (4 levels)');
        }
      }
    }

    const category = await prisma.category.update({
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

  /**
   * Delete category
   */
  async deleteCategory(id: string, moveProductsTo?: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true
      }
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    // Check if category has children
    if (category.children.length > 0) {
      throw new ConflictError('Cannot delete category with subcategories. Move or delete them first.');
    }

    // Handle products
    if (category.products.length > 0) {
      if (moveProductsTo) {
        // Validate target category exists
        const targetCategory = await prisma.category.findUnique({
          where: { id: moveProductsTo }
        });

        if (!targetCategory) {
          throw new ValidationError('Target category not found');
        }

        // Move products to target category
        await prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: moveProductsTo }
        });
      } else {
        throw new ConflictError('Category has products. Specify a target category to move them or delete products first.');
      }
    }

    // Delete category attributes
    await prisma.categoryAttribute.deleteMany({
      where: { categoryId: id }
    });

    // Delete promotion associations
    await prisma.promotionCategory.deleteMany({
      where: { categoryId: id }
    });

    // Delete the category
    await prisma.category.delete({
      where: { id }
    });
  }

  /**
   * Reorder categories
   */
  async reorderCategories(categoryOrders: { id: string; sortOrder: number }[]) {
    const updatePromises = categoryOrders.map(({ id, sortOrder }) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder }
      })
    );

    await Promise.all(updatePromises);
  }

  /**
   * Move category to different parent
   */
  async moveCategory(id: string, newParentId?: string) {
    if (newParentId === id) {
      throw new ValidationError('Category cannot be its own parent');
    }

    if (newParentId) {
      // Check if parent exists
      const parentCategory = await prisma.category.findUnique({
        where: { id: newParentId }
      });

      if (!parentCategory) {
        throw new ValidationError('Parent category not found');
      }

      // Check for circular reference
      const isCircular = await this.wouldCreateCircularReference(id, newParentId);
      if (isCircular) {
        throw new ValidationError('This would create a circular reference');
      }

      // Check depth
      const depth = await this.getCategoryDepth(newParentId);
      if (depth >= 3) {
        throw new ValidationError('Maximum category depth exceeded (4 levels)');
      }
    }

    const category = await prisma.category.update({
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

  /**
   * Get category attributes
   */
  async getCategoryAttributes(categoryId: string) {
    const attributes = await prisma.categoryAttribute.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' }
    });

    return attributes;
  }

  /**
   * Create category attribute
   */
  async createCategoryAttribute(categoryId: string, data: any) {
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    // Check if attribute name already exists for this category
    const existingAttribute = await prisma.categoryAttribute.findFirst({
      where: {
        categoryId,
        name: data.name
      }
    });

    if (existingAttribute) {
      throw new ConflictError('Attribute with this name already exists for this category');
    }

    // Set sort order if not provided
    if (data.sortOrder === undefined) {
      const maxOrder = await prisma.categoryAttribute.aggregate({
        where: { categoryId },
        _max: { sortOrder: true }
      });
      data.sortOrder = (maxOrder._max.sortOrder || 0) + 1;
    }

    const attribute = await prisma.categoryAttribute.create({
      data: {
        ...data,
        categoryId
      }
    });

    return attribute;
  }

  /**
   * Update category attribute
   */
  async updateCategoryAttribute(attributeId: string, data: any) {
    const existingAttribute = await prisma.categoryAttribute.findUnique({
      where: { id: attributeId }
    });

    if (!existingAttribute) {
      throw new NotFoundError('Category attribute');
    }

    // Check name uniqueness if being changed
    if (data.name && data.name !== existingAttribute.name) {
      const nameExists = await prisma.categoryAttribute.findFirst({
        where: {
          categoryId: existingAttribute.categoryId,
          name: data.name,
          id: { not: attributeId }
        }
      });

      if (nameExists) {
        throw new ConflictError('Attribute with this name already exists for this category');
      }
    }

    const attribute = await prisma.categoryAttribute.update({
      where: { id: attributeId },
      data
    });

    return attribute;
  }

  /**
   * Delete category attribute
   */
  async deleteCategoryAttribute(attributeId: string) {
    const attribute = await prisma.categoryAttribute.findUnique({
      where: { id: attributeId }
    });

    if (!attribute) {
      throw new NotFoundError('Category attribute');
    }

    await prisma.categoryAttribute.delete({
      where: { id: attributeId }
    });
  }

  /**
   * Search categories
   */
  async searchCategories(query: string, limit: number = 10) {
    const categories = await prisma.category.findMany({
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

  /**
   * Get category breadcrumb
   */
  async getCategoryBreadcrumb(categoryId: string) {
    const breadcrumb = [];
    let currentCategory = await prisma.category.findUnique({
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
        currentCategory = await prisma.category.findUnique({
          where: { id: currentCategory.parentId },
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true
          }
        });
      } else {
        currentCategory = null;
      }
    }

    return breadcrumb;
  }

  /**
   * Get category statistics
   */
  async getCategoryStatistics() {
    const [
      totalCategories,
      activeCategories,
      categoriesWithProducts,
      rootCategories,
      categoryProductCounts
    ] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count({
        where: {
          products: {
            some: {}
          }
        }
      }),
      prisma.category.count({ where: { parentId: null } }),
      prisma.category.findMany({
        select: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })
    ]);

    // Calculate average products per category manually
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

  /**
   * Bulk update categories
   */
  async bulkUpdateCategories(categoryIds: string[], updateData: any) {
    const result = await prisma.category.updateMany({
      where: {
        id: { in: categoryIds }
      },
      data: updateData
    });

    return result;
  }

  /**
   * Export categories
   */
  async exportCategories(format: string, includeHierarchy: boolean = true) {
    const includeClause: Prisma.CategoryInclude = {
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

    const categories = await prisma.category.findMany({
      include: includeClause,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    // This is a simplified version - implement actual CSV/Excel generation
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
      data: JSON.stringify(data), // Replace with actual CSV/Excel generation
      filename: `categories-export-${Date.now()}.${format}`,
      contentType: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      count: categories.length
    };
  }

  /**
   * Get category depth in hierarchy
   */
  private async getCategoryDepth(categoryId: string): Promise<number> {
    let depth = 0;
    let currentCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { parentId: true }
    });

    while (currentCategory?.parentId) {
      depth++;
      currentCategory = await prisma.category.findUnique({
        where: { id: currentCategory.parentId },
        select: { parentId: true }
      });
    }

    return depth;
  }

  /**
   * Check if moving category would create circular reference
   */
  private async wouldCreateCircularReference(categoryId: string, newParentId: string): Promise<boolean> {
    let currentParent = await prisma.category.findUnique({
      where: { id: newParentId },
      select: { parentId: true }
    });

    while (currentParent) {
      if (currentParent.parentId === categoryId) {
        return true;
      }

      currentParent = currentParent.parentId ? await prisma.category.findUnique({
        where: { id: currentParent.parentId },
        select: { parentId: true }
      }) : null;
    }

    return false;
  }
}