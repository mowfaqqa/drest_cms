export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const CACHE_KEYS: {
    readonly PRODUCTS: "products";
    readonly CATEGORIES: "categories";
    readonly BRANDS: "brands";
    readonly USER_PROFILE: "user_profile";
    readonly CART: "cart";
};
export declare const CACHE_TTL: {
    readonly SHORT: 300;
    readonly MEDIUM: 1800;
    readonly LONG: 3600;
    readonly VERY_LONG: 86400;
};
export declare const FILE_UPLOAD: {
    readonly MAX_SIZE: number;
    readonly ALLOWED_TYPES: readonly ["image/jpeg", "image/png", "image/webp", "image/gif"];
    readonly MAX_FILES: 10;
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const SORT_ORDERS: readonly ["asc", "desc"];
export declare const PRODUCT_SORT_FIELDS: readonly ["name", "price", "createdAt", "updatedAt", "basePrice"];
export declare const CATEGORY_SORT_FIELDS: readonly ["name", "sortOrder", "createdAt", "updatedAt"];
//# sourceMappingURL=constant.d.ts.map