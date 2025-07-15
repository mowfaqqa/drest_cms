import { Prisma } from '@prisma/client';
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
export declare class ProductService {
    getProducts(filters: ProductFilters, pagination: PaginationOptions, sorting: SortingOptions): Promise<{
        products: ({
            category: {
                name: string;
                id: string;
                slug: string;
            };
            _count: {
                variants: number;
                reviews: number;
            };
            brand: {
                name: string;
                id: string;
                slug: string;
            } | null;
            variants: {
                name: string;
                id: string;
                isActive: boolean;
                sku: string;
                price: Prisma.Decimal | null;
            }[];
        } & {
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
        })[];
        total: number;
    }>;
    getProductById(id: string, include?: any): Promise<({
        category: {
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
        };
        _count: {
            category: number;
            brand: number;
            variants: number;
            inventory: number;
            reviews: number;
            cartItems: number;
            orderItems: number;
            promotionProducts: number;
        };
        brand: {
            name: string;
            id: string;
            slug: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            logo: string | null;
            website: string | null;
        } | null;
        inventory: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string | null;
            variantId: string | null;
            quantity: number;
            reserved: number;
            available: number;
            locationId: string | null;
        }[];
        variants: {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            comparePrice: Prisma.Decimal | null;
            costPrice: Prisma.Decimal | null;
            images: Prisma.JsonValue[];
            attributes: Prisma.JsonValue;
            productId: string;
            sku: string;
            barcode: string | null;
            price: Prisma.Decimal | null;
        }[];
        reviews: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            images: Prisma.JsonValue[];
            productId: string;
            userId: string;
            rating: number;
            title: string | null;
            content: string;
            status: import(".prisma/client").$Enums.ReviewStatus;
            moderatedBy: string | null;
            moderatedAt: Date | null;
            helpfulCount: number;
        }[];
        cartItems: {
            id: string;
            updatedAt: Date;
            productId: string;
            variantId: string | null;
            quantity: number;
            userId: string;
            addedAt: Date;
        }[];
        orderItems: {
            id: string;
            productId: string;
            sku: string | null;
            variantId: string | null;
            quantity: number;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            orderId: string;
            productName: string;
            variantName: string | null;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
        }[];
        promotionProducts: {
            promotionId: string;
            productId: string;
        }[];
    } & {
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
    }) | null>;
    createProduct(data: any): Promise<{
        category: {
            name: string;
            id: string;
            slug: string;
        };
        brand: {
            name: string;
            id: string;
            slug: string;
        } | null;
    } & {
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
    }>;
    updateProduct(id: string, data: any): Promise<{
        category: {
            name: string;
            id: string;
            slug: string;
        };
        brand: {
            name: string;
            id: string;
            slug: string;
        } | null;
    } & {
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
    }>;
    deleteProduct(id: string): Promise<void>;
    bulkUpdateProducts(productIds: string[], updateData: any): Promise<Prisma.BatchPayload>;
    duplicateProduct(id: string, newName?: string): Promise<{
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
    }>;
    getProductVariants(productId: string): Promise<({
        inventory: {
            location: {
                name: string;
                id: string;
            } | null;
            quantity: number;
            reserved: number;
            available: number;
        }[];
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        comparePrice: Prisma.Decimal | null;
        costPrice: Prisma.Decimal | null;
        images: Prisma.JsonValue[];
        attributes: Prisma.JsonValue;
        productId: string;
        sku: string;
        barcode: string | null;
        price: Prisma.Decimal | null;
    })[]>;
    createProductVariant(productId: string, data: any): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        comparePrice: Prisma.Decimal | null;
        costPrice: Prisma.Decimal | null;
        images: Prisma.JsonValue[];
        attributes: Prisma.JsonValue;
        productId: string;
        sku: string;
        barcode: string | null;
        price: Prisma.Decimal | null;
    }>;
    updateProductVariant(variantId: string, data: any): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        comparePrice: Prisma.Decimal | null;
        costPrice: Prisma.Decimal | null;
        images: Prisma.JsonValue[];
        attributes: Prisma.JsonValue;
        productId: string;
        sku: string;
        barcode: string | null;
        price: Prisma.Decimal | null;
    }>;
    deleteProductVariant(variantId: string): Promise<void>;
    searchProducts(query: string, limit?: number): Promise<{
        name: string;
        category: {
            name: string;
        };
        id: string;
        slug: string;
        basePrice: Prisma.Decimal;
        images: Prisma.JsonValue[];
    }[]>;
    getProductsByCategory(categoryId: string, includeSubcategories: boolean | undefined, pagination: PaginationOptions): Promise<{
        products: ({
            category: {
                name: string;
                id: string;
                slug: string;
            };
            brand: {
                name: string;
                id: string;
                slug: string;
            } | null;
        } & {
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
        })[];
        total: number;
        category: {
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
        };
    }>;
    getProductStatistics(): Promise<{
        totalProducts: number;
        activeProducts: number;
        featuredProducts: number;
        lowStockProducts: number;
        categoriesWithProducts: number;
        inactiveProducts: number;
    }>;
    getProductAnalytics(productId: string, period: string): Promise<{
        period: string;
        orderCount: number;
        totalRevenue: number | Prisma.Decimal;
        averageRating: number;
        reviewCount: number;
    }>;
    importProducts(file: any): Promise<any>;
    exportProducts(format: string, filters?: any): Promise<{
        data: string;
        filename: string;
        contentType: string;
        count: number;
    }>;
    private createDefaultInventory;
}
export {};
//# sourceMappingURL=product.service.d.ts.map