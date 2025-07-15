import { Prisma } from '@prisma/client';
interface CategoryOptions {
    includeProducts?: boolean;
    includeChildren?: boolean;
    isActive?: boolean;
    pagination?: {
        page: number;
        limit: number;
    };
}
export declare class CategoryService {
    getCategoryHierarchy(options: any): Promise<({
        [x: string]: ({
            name: string;
            id: string;
            slug: string;
            description: string | null;
            image: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            sortOrder: number;
            parentId: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            image: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            sortOrder: number;
            parentId: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[] | ({
            name: string;
            id: string;
            slug: string;
            description: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            shortDescription: string | null;
            basePrice: Prisma.Decimal;
            comparePrice: Prisma.Decimal | null;
            costPrice: Prisma.Decimal | null;
            images: Prisma.JsonValue[];
            videos: Prisma.JsonValue[];
            tags: string[];
            isFeatured: boolean;
            isDigital: boolean;
            requiresShipping: boolean;
            trackInventory: boolean;
            allowBackorder: boolean;
            lowStockThreshold: number | null;
            categoryId: string;
            brandId: string | null;
            publishedAt: Date | null;
        } | {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            shortDescription: string | null;
            basePrice: Prisma.Decimal;
            comparePrice: Prisma.Decimal | null;
            costPrice: Prisma.Decimal | null;
            images: Prisma.JsonValue[];
            videos: Prisma.JsonValue[];
            tags: string[];
            isFeatured: boolean;
            isDigital: boolean;
            requiresShipping: boolean;
            trackInventory: boolean;
            allowBackorder: boolean;
            lowStockThreshold: number | null;
            categoryId: string;
            brandId: string | null;
            publishedAt: Date | null;
        })[] | ({
            name: string;
            id: string;
            sortOrder: number;
            categoryId: string;
            type: import(".prisma/client").$Enums.AttributeType;
            required: boolean;
            options: Prisma.JsonValue | null;
        } | {
            name: string;
            id: string;
            sortOrder: number;
            categoryId: string;
            type: import(".prisma/client").$Enums.AttributeType;
            required: boolean;
            options: Prisma.JsonValue | null;
        })[] | ({
            categoryId: string;
            promotionId: string;
        } | {
            categoryId: string;
            promotionId: string;
        })[] | {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            image: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            sortOrder: number;
            parentId: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[] | {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            shortDescription: string | null;
            basePrice: Prisma.Decimal;
            comparePrice: Prisma.Decimal | null;
            costPrice: Prisma.Decimal | null;
            images: Prisma.JsonValue[];
            videos: Prisma.JsonValue[];
            tags: string[];
            isFeatured: boolean;
            isDigital: boolean;
            requiresShipping: boolean;
            trackInventory: boolean;
            allowBackorder: boolean;
            lowStockThreshold: number | null;
            categoryId: string;
            brandId: string | null;
            publishedAt: Date | null;
        }[] | {
            name: string;
            id: string;
            sortOrder: number;
            categoryId: string;
            type: import(".prisma/client").$Enums.AttributeType;
            required: boolean;
            options: Prisma.JsonValue | null;
        }[] | {
            categoryId: string;
            promotionId: string;
        }[];
        [x: number]: never;
        [x: symbol]: never;
    } & {
        name: string;
        id: string;
        slug: string;
        description: string | null;
        image: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        isActive: boolean;
        sortOrder: number;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getFlatCategories(options: any): Promise<{
        categories: {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            image: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            sortOrder: number;
            parentId: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
    getCategoryById(id: string, options?: CategoryOptions): Promise<({
        PromotionCategory: {
            categoryId: string;
            promotionId: string;
        }[];
        parent: {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            image: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            sortOrder: number;
            parentId: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        children: {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            image: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            sortOrder: number;
            parentId: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        products: {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            shortDescription: string | null;
            basePrice: Prisma.Decimal;
            comparePrice: Prisma.Decimal | null;
            costPrice: Prisma.Decimal | null;
            images: Prisma.JsonValue[];
            videos: Prisma.JsonValue[];
            tags: string[];
            isFeatured: boolean;
            isDigital: boolean;
            requiresShipping: boolean;
            trackInventory: boolean;
            allowBackorder: boolean;
            lowStockThreshold: number | null;
            categoryId: string;
            brandId: string | null;
            publishedAt: Date | null;
        }[];
        attributes: {
            name: string;
            id: string;
            sortOrder: number;
            categoryId: string;
            type: import(".prisma/client").$Enums.AttributeType;
            required: boolean;
            options: Prisma.JsonValue | null;
        }[];
        _count: {
            parent: number;
            children: number;
            products: number;
            attributes: number;
            PromotionCategory: number;
        };
    } & {
        name: string;
        id: string;
        slug: string;
        description: string | null;
        image: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        isActive: boolean;
        sortOrder: number;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    createCategory(data: any): Promise<{
        parent: {
            name: string;
            id: string;
            slug: string;
        } | null;
        _count: {
            children: number;
            products: number;
        };
    } & {
        name: string;
        id: string;
        slug: string;
        description: string | null;
        image: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        isActive: boolean;
        sortOrder: number;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateCategory(id: string, data: any): Promise<{
        parent: {
            name: string;
            id: string;
            slug: string;
        } | null;
        _count: {
            children: number;
            products: number;
        };
    } & {
        name: string;
        id: string;
        slug: string;
        description: string | null;
        image: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        isActive: boolean;
        sortOrder: number;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteCategory(id: string, moveProductsTo?: string): Promise<void>;
    reorderCategories(categoryOrders: {
        id: string;
        sortOrder: number;
    }[]): Promise<void>;
    moveCategory(id: string, newParentId?: string): Promise<{
        parent: {
            name: string;
            id: string;
            slug: string;
        } | null;
    } & {
        name: string;
        id: string;
        slug: string;
        description: string | null;
        image: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        isActive: boolean;
        sortOrder: number;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCategoryAttributes(categoryId: string): Promise<{
        name: string;
        id: string;
        sortOrder: number;
        categoryId: string;
        type: import(".prisma/client").$Enums.AttributeType;
        required: boolean;
        options: Prisma.JsonValue | null;
    }[]>;
    createCategoryAttribute(categoryId: string, data: any): Promise<{
        name: string;
        id: string;
        sortOrder: number;
        categoryId: string;
        type: import(".prisma/client").$Enums.AttributeType;
        required: boolean;
        options: Prisma.JsonValue | null;
    }>;
    updateCategoryAttribute(attributeId: string, data: any): Promise<{
        name: string;
        id: string;
        sortOrder: number;
        categoryId: string;
        type: import(".prisma/client").$Enums.AttributeType;
        required: boolean;
        options: Prisma.JsonValue | null;
    }>;
    deleteCategoryAttribute(attributeId: string): Promise<void>;
    searchCategories(query: string, limit?: number): Promise<{
        name: string;
        id: string;
        slug: string;
        description: string | null;
        image: string | null;
        parent: {
            name: string;
        } | null;
    }[]>;
    getCategoryBreadcrumb(categoryId: string): Promise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
    getCategoryStatistics(): Promise<{
        totalCategories: number;
        activeCategories: number;
        categoriesWithProducts: number;
        rootCategories: number;
        inactiveCategories: number;
        averageProductsPerCategory: number;
    }>;
    bulkUpdateCategories(categoryIds: string[], updateData: any): Promise<Prisma.BatchPayload>;
    exportCategories(format: string, includeHierarchy?: boolean): Promise<{
        data: string;
        filename: string;
        contentType: string;
        count: number;
    }>;
    private getCategoryDepth;
    private wouldCreateCircularReference;
}
export {};
//# sourceMappingURL=category.service.d.ts.map