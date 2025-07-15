import Joi from 'joi';
import { commonValidationSchemas } from '../utils/validation';

export const commonValidators = {
  id: Joi.object({
    id: commonValidationSchemas.id
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  search: Joi.object({
    q: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Search query is required',
      'string.max': 'Search query cannot exceed 100 characters',
      'any.required': 'Search query is required'
    }),
    limit: Joi.number().integer().min(1).max(50).default(10)
  }),

  sort: Joi.object({
    sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt', 'price').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),

  bulkAction: Joi.object({
    ids: Joi.array().items(commonValidationSchemas.id).min(1).required().messages({
      'array.min': 'At least one ID is required',
      'any.required': 'IDs are required'
    }),
    action: Joi.string().required().messages({
      'any.required': 'Action is required'
    })
  })
};