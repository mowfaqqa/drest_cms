import Joi from 'joi';
import { commonValidationSchemas } from '../utils/validation';
import { AttributeType } from '@prisma/client';

export const categoryValidators = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name cannot exceed 100 characters',
      'any.required': 'Category name is required'
    }),
    slug: commonValidationSchemas.slug.optional(),
    description: Joi.string().max(1000).allow('').messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    image: Joi.string().uri().allow('').messages({
      'string.uri': 'Image must be a valid URL'
    }),
    parentId: Joi.string().optional().allow(null),
    seoTitle: Joi.string().max(60).allow('').messages({
      'string.max': 'SEO title cannot exceed 60 characters'
    }),
    seoDescription: Joi.string().max(160).allow('').messages({
      'string.max': 'SEO description cannot exceed 160 characters'
    }),
    isActive: commonValidationSchemas.boolean.default(true),
    sortOrder: Joi.number().integer().min(0).optional().messages({
      'number.min': 'Sort order cannot be negative'
    })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).messages({
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name cannot exceed 100 characters'
    }),
    slug: commonValidationSchemas.slug.optional(),
    description: Joi.string().max(1000).allow(''),
    image: Joi.string().uri().allow(''),
    parentId: Joi.string().optional().allow(null),
    seoTitle: Joi.string().max(60).allow(''),
    seoDescription: Joi.string().max(160).allow(''),
    isActive: commonValidationSchemas.boolean,
    sortOrder: Joi.number().integer().min(0)
  }),

  updateStatus: Joi.object({
    isActive: commonValidationSchemas.boolean.required()
  }),

  reorder: Joi.object({
    categoryOrders: Joi.array().items(
      Joi.object({
        id: commonValidationSchemas.id,
        sortOrder: Joi.number().integer().min(0).required()
      })
    ).min(1).required().messages({
      'array.min': 'At least one category order is required',
      'any.required': 'Category orders are required'
    })
  }),

  move: Joi.object({
    newParentId: Joi.string().optional().allow(null)
  }),

  createAttribute: Joi.object({
    name: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Attribute name is required',
      'string.max': 'Attribute name cannot exceed 50 characters',
      'any.required': 'Attribute name is required'
    }),
    type: Joi.string().valid(...Object.values(AttributeType)).required().messages({
      'any.only': 'Invalid attribute type',
      'any.required': 'Attribute type is required'
    }),
    required: commonValidationSchemas.boolean.default(false),
    options: Joi.array().items(Joi.string().max(50)).when('type', {
      is: Joi.string().valid(AttributeType.SELECT, AttributeType.MULTI_SELECT),
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'any.required': 'Options are required for SELECT and MULTI_SELECT types'
    }),
    sortOrder: Joi.number().integer().min(0).optional()
  }),

  updateAttribute: Joi.object({
    name: Joi.string().min(1).max(50).messages({
      'string.min': 'Attribute name is required',
      'string.max': 'Attribute name cannot exceed 50 characters'
    }),
    type: Joi.string().valid(...Object.values(AttributeType)),
    required: commonValidationSchemas.boolean,
    options: Joi.array().items(Joi.string().max(50)),
    sortOrder: Joi.number().integer().min(0)
  }),

  bulkUpdate: Joi.object({
    categoryIds: Joi.array().items(commonValidationSchemas.id).min(1).required().messages({
      'array.min': 'At least one category ID is required',
      'any.required': 'Category IDs are required'
    }),
    updateData: Joi.object({
      isActive: commonValidationSchemas.boolean,
      parentId: Joi.string().optional().allow(null)
    }).min(1).required().messages({
      'object.min': 'At least one field to update is required',
      'any.required': 'Update data is required'
    })
  })
};