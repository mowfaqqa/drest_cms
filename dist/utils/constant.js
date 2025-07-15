"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_SORT_FIELDS = exports.PRODUCT_SORT_FIELDS = exports.SORT_ORDERS = exports.PAGINATION = exports.FILE_UPLOAD = exports.CACHE_TTL = exports.CACHE_KEYS = exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
};
exports.CACHE_KEYS = {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    BRANDS: 'brands',
    USER_PROFILE: 'user_profile',
    CART: 'cart'
};
exports.CACHE_TTL = {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600,
    VERY_LONG: 86400
};
exports.FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    MAX_FILES: 10
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};
exports.SORT_ORDERS = ['asc', 'desc'];
exports.PRODUCT_SORT_FIELDS = [
    'name',
    'price',
    'createdAt',
    'updatedAt',
    'basePrice'
];
exports.CATEGORY_SORT_FIELDS = [
    'name',
    'sortOrder',
    'createdAt',
    'updatedAt'
];
//# sourceMappingURL=constant.js.map