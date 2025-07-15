"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidators = void 0;
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../utils/validation");
exports.authValidators = {
    login: joi_1.default.object({
        email: validation_1.commonValidationSchemas.email,
        password: joi_1.default.string().required().messages({
            'any.required': 'Password is required'
        })
    }),
    updateProfile: joi_1.default.object({
        firstName: joi_1.default.string().min(2).max(50).messages({
            'string.min': 'First name must be at least 2 characters',
            'string.max': 'First name cannot exceed 50 characters'
        }),
        lastName: joi_1.default.string().min(2).max(50).messages({
            'string.min': 'Last name must be at least 2 characters',
            'string.max': 'Last name cannot exceed 50 characters'
        }),
        avatar: joi_1.default.string().uri().allow('').messages({
            'string.uri': 'Avatar must be a valid URL'
        })
    }),
    changePassword: joi_1.default.object({
        currentPassword: joi_1.default.string().required().messages({
            'any.required': 'Current password is required'
        }),
        newPassword: validation_1.commonValidationSchemas.password
    })
};
//# sourceMappingURL=auth.validator.js.map