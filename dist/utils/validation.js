"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonValidationSchemas = void 0;
const joi_1 = __importDefault(require("joi"));
exports.commonValidationSchemas = {
    id: joi_1.default.string().min(1).required().messages({
        'string.empty': 'ID is required',
        'any.required': 'ID is required'
    }),
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20)
    }),
    search: joi_1.default.object({
        q: joi_1.default.string().min(1).max(100).required().messages({
            'string.empty': 'Search query is required',
            'string.min': 'Search query must be at least 1 character',
            'string.max': 'Search query cannot exceed 100 characters'
        })
    }),
    slug: joi_1.default.string()
        .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .min(1)
        .max(100)
        .messages({
        'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens',
        'string.min': 'Slug must be at least 1 character',
        'string.max': 'Slug cannot exceed 100 characters'
    }),
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: joi_1.default.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
        'any.required': 'Password is required'
    }),
    price: joi_1.default.number().positive().precision(2).required().messages({
        'number.positive': 'Price must be a positive number',
        'any.required': 'Price is required'
    }),
    boolean: joi_1.default.boolean().messages({
        'boolean.base': 'Value must be true or false'
    })
};
//# sourceMappingURL=validation.js.map