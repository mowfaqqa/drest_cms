"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonValidators = void 0;
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../utils/validation");
exports.commonValidators = {
    id: joi_1.default.object({
        id: validation_1.commonValidationSchemas.id
    }),
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20)
    }),
    search: joi_1.default.object({
        q: joi_1.default.string().min(1).max(100).required().messages({
            'string.min': 'Search query is required',
            'string.max': 'Search query cannot exceed 100 characters',
            'any.required': 'Search query is required'
        }),
        limit: joi_1.default.number().integer().min(1).max(50).default(10)
    }),
    sort: joi_1.default.object({
        sortBy: joi_1.default.string().valid('name', 'createdAt', 'updatedAt', 'price').default('createdAt'),
        sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
    }),
    dateRange: joi_1.default.object({
        startDate: joi_1.default.date().iso().required(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).required()
    }),
    bulkAction: joi_1.default.object({
        ids: joi_1.default.array().items(validation_1.commonValidationSchemas.id).min(1).required().messages({
            'array.min': 'At least one ID is required',
            'any.required': 'IDs are required'
        }),
        action: joi_1.default.string().required().messages({
            'any.required': 'Action is required'
        })
    })
};
//# sourceMappingURL=common.validator.js.map