"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryValidators = void 0;
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../utils/validation");
const client_1 = require("@prisma/client");
exports.categoryValidators = {
    create: joi_1.default.object({
        name: joi_1.default.string().min(2).max(100).required().messages({
            'string.min': 'Category name must be at least 2 characters',
            'string.max': 'Category name cannot exceed 100 characters',
            'any.required': 'Category name is required'
        }),
        slug: validation_1.commonValidationSchemas.slug.optional(),
        description: joi_1.default.string().max(1000).allow('').messages({
            'string.max': 'Description cannot exceed 1000 characters'
        }),
        image: joi_1.default.string().uri().allow('').messages({
            'string.uri': 'Image must be a valid URL'
        }),
        parentId: joi_1.default.string().optional().allow(null),
        seoTitle: joi_1.default.string().max(60).allow('').messages({
            'string.max': 'SEO title cannot exceed 60 characters'
        }),
        seoDescription: joi_1.default.string().max(160).allow('').messages({
            'string.max': 'SEO description cannot exceed 160 characters'
        }),
        isActive: validation_1.commonValidationSchemas.boolean.default(true),
        sortOrder: joi_1.default.number().integer().min(0).optional().messages({
            'number.min': 'Sort order cannot be negative'
        })
    }),
    update: joi_1.default.object({
        name: joi_1.default.string().min(2).max(100).messages({
            'string.min': 'Category name must be at least 2 characters',
            'string.max': 'Category name cannot exceed 100 characters'
        }),
        slug: validation_1.commonValidationSchemas.slug.optional(),
        description: joi_1.default.string().max(1000).allow(''),
        image: joi_1.default.string().uri().allow(''),
        parentId: joi_1.default.string().optional().allow(null),
        seoTitle: joi_1.default.string().max(60).allow(''),
        seoDescription: joi_1.default.string().max(160).allow(''),
        isActive: validation_1.commonValidationSchemas.boolean,
        sortOrder: joi_1.default.number().integer().min(0)
    }),
    updateStatus: joi_1.default.object({
        isActive: validation_1.commonValidationSchemas.boolean.required()
    }),
    reorder: joi_1.default.object({
        categoryOrders: joi_1.default.array().items(joi_1.default.object({
            id: validation_1.commonValidationSchemas.id,
            sortOrder: joi_1.default.number().integer().min(0).required()
        })).min(1).required().messages({
            'array.min': 'At least one category order is required',
            'any.required': 'Category orders are required'
        })
    }),
    move: joi_1.default.object({
        newParentId: joi_1.default.string().optional().allow(null)
    }),
    createAttribute: joi_1.default.object({
        name: joi_1.default.string().min(1).max(50).required().messages({
            'string.min': 'Attribute name is required',
            'string.max': 'Attribute name cannot exceed 50 characters',
            'any.required': 'Attribute name is required'
        }),
        type: joi_1.default.string().valid(...Object.values(client_1.AttributeType)).required().messages({
            'any.only': 'Invalid attribute type',
            'any.required': 'Attribute type is required'
        }),
        required: validation_1.commonValidationSchemas.boolean.default(false),
        options: joi_1.default.array().items(joi_1.default.string().max(50)).when('type', {
            is: joi_1.default.string().valid(client_1.AttributeType.SELECT, client_1.AttributeType.MULTI_SELECT),
            then: joi_1.default.required(),
            otherwise: joi_1.default.optional()
        }).messages({
            'any.required': 'Options are required for SELECT and MULTI_SELECT types'
        }),
        sortOrder: joi_1.default.number().integer().min(0).optional()
    }),
    updateAttribute: joi_1.default.object({
        name: joi_1.default.string().min(1).max(50).messages({
            'string.min': 'Attribute name is required',
            'string.max': 'Attribute name cannot exceed 50 characters'
        }),
        type: joi_1.default.string().valid(...Object.values(client_1.AttributeType)),
        required: validation_1.commonValidationSchemas.boolean,
        options: joi_1.default.array().items(joi_1.default.string().max(50)),
        sortOrder: joi_1.default.number().integer().min(0)
    }),
    bulkUpdate: joi_1.default.object({
        categoryIds: joi_1.default.array().items(validation_1.commonValidationSchemas.id).min(1).required().messages({
            'array.min': 'At least one category ID is required',
            'any.required': 'Category IDs are required'
        }),
        updateData: joi_1.default.object({
            isActive: validation_1.commonValidationSchemas.boolean,
            parentId: joi_1.default.string().optional().allow(null)
        }).min(1).required().messages({
            'object.min': 'At least one field to update is required',
            'any.required': 'Update data is required'
        })
    })
};
//# sourceMappingURL=category.validator.js.map