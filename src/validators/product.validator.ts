import Joi from 'joi';
import { commonValidationSchemas } from '@/utils/validation';

export const productValidators = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required().messages({
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name cannot exceed 200 characters',
      'any.required': 'Product name is required'
    }),
    slug: commonValidationSchemas.slug.optional(),
    description: Joi.string().max(5000).allow('').messages({
      'string.max': 'Description cannot exceed 5000 characters'
    }),
    shortDescription: Joi.string().max(500).allow('').messages({
      'string.max': 'Short description cannot exceed 500 characters'
    }),
    basePrice: commonValidationSchemas.price,
    comparePrice: Joi.number().positive().precision(2).optional().messages({
      'number.positive': 'Compare price must be a positive number'
    }),
    costPrice: Joi.number().positive().precision(2).optional().messages({
      'number.positive': 'Cost price must be a positive number'
    }),
    categoryId: commonValidationSchemas.id,
    brandId: Joi.string().optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(200).required(),
        isPrimary: Joi.boolean().default(false)
      })
    ).max(10).default([]).messages({
      'array.max': 'Maximum 10 images allowed'
    }),
    videos: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        title: Joi.string().max(200).optional(),
        thumbnail: Joi.string().uri().optional()
      })
    ).max(5).default([]).messages({
      'array.max': 'Maximum 5 videos allowed'
    }),
    seoTitle: Joi.string().max(60).allow('').messages({
      'string.max': 'SEO title cannot exceed 60 characters'
    }),
    seoDescription: Joi.string().max(160).allow('').messages({
      'string.max': 'SEO description cannot exceed 160 characters'
    }),
    tags: Joi.array().items(Joi.string().max(50)).max(20).default([]).messages({
      'array.max': 'Maximum 20 tags allowed'
    }),
    isActive: commonValidationSchemas.boolean.default(true),
    isFeatured: commonValidationSchemas.boolean.default(false),
    isDigital: commonValidationSchemas.boolean.default(false),
    requiresShipping: commonValidationSchemas.boolean.default(true),
    trackInventory: commonValidationSchemas.boolean.default(true),
    allowBackorder: commonValidationSchemas.boolean.default(false),
    lowStockThreshold: Joi.number().integer().min(0).optional().messages({
      'number.min': 'Low stock threshold cannot be negative'
    })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).messages({
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name cannot exceed 200 characters'
    }),
    slug: commonValidationSchemas.slug.optional(),
    description: Joi.string().max(5000).allow(''),
    shortDescription: Joi.string().max(500).allow(''),
    basePrice: Joi.number().positive().precision(2).messages({
      'number.positive': 'Price must be a positive number'
    }),
    comparePrice: Joi.number().positive().precision(2).optional(),
    costPrice: Joi.number().positive().precision(2).optional(),
    categoryId: Joi.string().optional(),
    brandId: Joi.string().optional().allow(null),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(200).required(),
        isPrimary: Joi.boolean().default(false)
      })
    ).max(10),
    videos: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        title: Joi.string().max(200).optional(),
        thumbnail: Joi.string().uri().optional()
      })
    ).max(5),
    seoTitle: Joi.string().max(60).allow(''),
    seoDescription: Joi.string().max(160).allow(''),
    tags: Joi.array().items(Joi.string().max(50)).max(20),
    isActive: commonValidationSchemas.boolean,
    isFeatured: commonValidationSchemas.boolean,
    isDigital: commonValidationSchemas.boolean,
    requiresShipping: commonValidationSchemas.boolean,
    trackInventory: commonValidationSchemas.boolean,
    allowBackorder: commonValidationSchemas.boolean,
    lowStockThreshold: Joi.number().integer().min(0).optional()
  }),

  updateStatus: Joi.object({
    isActive: commonValidationSchemas.boolean.required()
  }),

  createVariant: Joi.object({
    name: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Variant name is required',
      'string.max': 'Variant name cannot exceed 200 characters',
      'any.required': 'Variant name is required'
    }),
    sku: Joi.string().min(1).max(100).required().messages({
      'string.min': 'SKU is required',
      'string.max': 'SKU cannot exceed 100 characters',
      'any.required': 'SKU is required'
    }),
    barcode: Joi.string().max(50).allow('').messages({
      'string.max': 'Barcode cannot exceed 50 characters'
    }),
    price: Joi.number().positive().precision(2).optional().messages({
      'number.positive': 'Price must be a positive number'
    }),
    comparePrice: Joi.number().positive().precision(2).optional(),
    costPrice: Joi.number().positive().precision(2).optional(),
    attributes: Joi.object().required().messages({
      'any.required': 'Variant attributes are required'
    }),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(200).required(),
        isPrimary: Joi.boolean().default(false)
      })
    ).max(5).default([]),
    isActive: commonValidationSchemas.boolean.default(true)
  }),

  updateVariant: Joi.object({
    name: Joi.string().min(1).max(200).messages({
      'string.min': 'Variant name is required',
      'string.max': 'Variant name cannot exceed 200 characters'
    }),
    sku: Joi.string().min(1).max(100).messages({
      'string.min': 'SKU is required',
      'string.max': 'SKU cannot exceed 100 characters'
    }),
    barcode: Joi.string().max(50).allow(''),
    price: Joi.number().positive().precision(2).optional(),
    comparePrice: Joi.number().positive().precision(2).optional(),
    costPrice: Joi.number().positive().precision(2).optional(),
    attributes: Joi.object(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(200).required(),
        isPrimary: Joi.boolean().default(false)
      })
    ).max(5),
    isActive: commonValidationSchemas.boolean
  }),

  duplicate: Joi.object({
    name: Joi.string().min(2).max(200).optional().messages({
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name cannot exceed 200 characters'
    })
  }),

  bulkUpdate: Joi.object({
    productIds: Joi.array().items(commonValidationSchemas.id).min(1).required().messages({
      'array.min': 'At least one product ID is required',
      'any.required': 'Product IDs are required'
    }),
    updateData: Joi.object({
      isActive: commonValidationSchemas.boolean,
      isFeatured: commonValidationSchemas.boolean,
      categoryId: Joi.string().optional(),
      brandId: Joi.string().optional().allow(null)
    }).min(1).required().messages({
      'object.min': 'At least one field to update is required',
      'any.required': 'Update data is required'
    })
  })
};
