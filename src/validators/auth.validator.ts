import Joi from 'joi';
import { commonValidationSchemas } from '../utils/validation';

export const authValidators = {
  login: Joi.object({
    email: commonValidationSchemas.email,
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().min(2).max(50).messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
    avatar: Joi.string().uri().allow('').messages({
      'string.uri': 'Avatar must be a valid URL'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: commonValidationSchemas.password
  })
};