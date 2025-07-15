"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productValidators = void 0;
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../utils/validation");
exports.productValidators = {
    create: joi_1.default.object({
        name: joi_1.default.string().min(2).max(200).required().messages({
            'string.min': 'Product name must be at least 2 characters',
            'string.max': 'Product name cannot exceed 200 characters',
            'any.required': 'Product name is required'
        }),
        slug: validation_1.commonValidationSchemas.slug.optional(),
        description: joi_1.default.string().max(5000).allow('').messages({
            'string.max': 'Description cannot exceed 5000 characters'
        }),
        shortDescription: joi_1.default.string().max(500).allow('').messages({
            'string.max': 'Short description cannot exceed 500 characters'
        }),
        basePrice: validation_1.commonValidationSchemas.price,
        comparePrice: joi_1.default.number().positive().precision(2).optional().messages({
            'number.positive': 'Compare price must be a positive number'
        }),
        costPrice: joi_1.default.number().positive().precision(2).optional().messages({
            'number.positive': 'Cost price must be a positive number'
        }),
        categoryId: validation_1.commonValidationSchemas.id,
        brandId: joi_1.default.string().optional(),
        images: joi_1.default.array().items(joi_1.default.object({
            url: joi_1.default.string().uri().required(),
            alt: joi_1.default.string().max(200).required(),
            isPrimary: joi_1.default.boolean().default(false)
        })).max(10).default([]).messages({
            'array.max': 'Maximum 10 images allowed'
        }),
        videos: joi_1.default.array().items(joi_1.default.object({
            url: joi_1.default.string().uri().required(),
            title: joi_1.default.string().max(200).optional(),
            thumbnail: joi_1.default.string().uri().optional()
        })).max(5).default([]).messages({
            'array.max': 'Maximum 5 videos allowed'
        }),
        seoTitle: joi_1.default.string().max(60).allow('').messages({
            'string.max': 'SEO title cannot exceed 60 characters'
        }),
        seoDescription: joi_1.default.string().max(160).allow('').messages({
            'string.max': 'SEO description cannot exceed 160 characters'
        }),
        tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(20).default([]).messages({
            'array.max': 'Maximum 20 tags allowed'
        }),
        isActive: validation_1.commonValidationSchemas.boolean.default(true),
        isFeatured: validation_1.commonValidationSchemas.boolean.default(false),
        isDigital: validation_1.commonValidationSchemas.boolean.default(false),
        requiresShipping: validation_1.commonValidationSchemas.boolean.default(true),
        trackInventory: validation_1.commonValidationSchemas.boolean.default(true),
        allowBackorder: validation_1.commonValidationSchemas.boolean.default(false),
        lowStockThreshold: joi_1.default.number().integer().min(0).optional().messages({
            'number.min': 'Low stock threshold cannot be negative'
        })
    }),
    update: joi_1.default.object({
        name: joi_1.default.string().min(2).max(200).messages({
            'string.min': 'Product name must be at least 2 characters',
            'string.max': 'Product name cannot exceed 200 characters'
        }),
        slug: validation_1.commonValidationSchemas.slug.optional(),
        description: joi_1.default.string().max(5000).allow(''),
        shortDescription: joi_1.default.string().max(500).allow(''),
        basePrice: joi_1.default.number().positive().precision(2).messages({
            'number.positive': 'Price must be a positive number'
        }),
        comparePrice: joi_1.default.number().positive().precision(2).optional(),
        costPrice: joi_1.default.number().positive().precision(2).optional(),
        categoryId: joi_1.default.string().optional(),
        brandId: joi_1.default.string().optional().allow(null),
        images: joi_1.default.array().items(joi_1.default.object({
            url: joi_1.default.string().uri().required(),
            alt: joi_1.default.string().max(200).required(),
            isPrimary: joi_1.default.boolean().default(false)
        })).max(10),
        videos: joi_1.default.array().items(joi_1.default.object({
            url: joi_1.default.string().uri().required(),
            title: joi_1.default.string().max(200).optional(),
            thumbnail: joi_1.default.string().uri().optional()
        })).max(5),
        seoTitle: joi_1.default.string().max(60).allow(''),
        seoDescription: joi_1.default.string().max(160).allow(''),
        tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(20),
        isActive: validation_1.commonValidationSchemas.boolean,
        isFeatured: validation_1.commonValidationSchemas.boolean,
        isDigital: validation_1.commonValidationSchemas.boolean,
        requiresShipping: validation_1.commonValidationSchemas.boolean,
        trackInventory: validation_1.commonValidationSchemas.boolean,
        allowBackorder: validation_1.commonValidationSchemas.boolean,
        lowStockThreshold: joi_1.default.number().integer().min(0).optional()
    }),
    updateStatus: joi_1.default.object({
        isActive: validation_1.commonValidationSchemas.boolean.required()
    }),
    createVariant: joi_1.default.object({
        name: joi_1.default.string().min(1).max(200).required().messages({
            'string.min': 'Variant name is required',
            'string.max': 'Variant name cannot exceed 200 characters',
            'any.required': 'Variant name is required'
        }),
        sku: joi_1.default.string().min(1).max(100).required().messages({
            'string.min': 'SKU is required',
            'string.max': 'SKU cannot exceed 100 characters',
            'any.required': 'SKU is required'
        }),
        barcode: joi_1.default.string().max(50).allow('').messages({
            'string.max': 'Barcode cannot exceed 50 characters'
        }),
        price: joi_1.default.number().positive().precision(2).optional().messages({
            'number.positive': 'Price must be a positive number'
        }),
        comparePrice: joi_1.default.number().positive().precision(2).optional(),
        costPrice: joi_1.default.number().positive().precision(2).optional(),
        attributes: joi_1.default.object().required().messages({
            'any.required': 'Variant attributes are required'
        }),
        images: joi_1.default.array().items(joi_1.default.object({
            url: joi_1.default.string().uri().required(),
            alt: joi_1.default.string().max(200).required(),
            isPrimary: joi_1.default.boolean().default(false)
        })).max(5).default([]),
        isActive: validation_1.commonValidationSchemas.boolean.default(true)
    }),
    updateVariant: joi_1.default.object({
        name: joi_1.default.string().min(1).max(200).messages({
            'string.min': 'Variant name is required',
            'string.max': 'Variant name cannot exceed 200 characters'
        }),
        sku: joi_1.default.string().min(1).max(100).messages({
            'string.min': 'SKU is required',
            'string.max': 'SKU cannot exceed 100 characters'
        }),
        barcode: joi_1.default.string().max(50).allow(''),
        price: joi_1.default.number().positive().precision(2).optional(),
        comparePrice: joi_1.default.number().positive().precision(2).optional(),
        costPrice: joi_1.default.number().positive().precision(2).optional(),
        attributes: joi_1.default.object(),
        images: joi_1.default.array().items(joi_1.default.object({
            url: joi_1.default.string().uri().required(),
            alt: joi_1.default.string().max(200).required(),
            isPrimary: joi_1.default.boolean().default(false)
        })).max(5),
        isActive: validation_1.commonValidationSchemas.boolean
    }),
    duplicate: joi_1.default.object({
        name: joi_1.default.string().min(2).max(200).optional().messages({
            'string.min': 'Product name must be at least 2 characters',
            'string.max': 'Product name cannot exceed 200 characters'
        })
    }),
    bulkUpdate: joi_1.default.object({
        productIds: joi_1.default.array().items(validation_1.commonValidationSchemas.id).min(1).required().messages({
            'array.min': 'At least one product ID is required',
            'any.required': 'Product IDs are required'
        }),
        updateData: joi_1.default.object({
            isActive: validation_1.commonValidationSchemas.boolean,
            isFeatured: validation_1.commonValidationSchemas.boolean,
            categoryId: joi_1.default.string().optional(),
            brandId: joi_1.default.string().optional().allow(null)
        }).min(1).required().messages({
            'object.min': 'At least one field to update is required',
            'any.required': 'Update data is required'
        })
    })
};
//# sourceMappingURL=product.validator.js.map