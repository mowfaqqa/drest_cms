import { Request, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '@/middleware/error.middleware';

export const validateRequest = (schema: Joi.ObjectSchema, options: Joi.ValidationOptions = {}) => {
  return (req: Request, res: any, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      throw new ValidationError('Validation failed', details);
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema, options: Joi.ValidationOptions = {}) => {
  return (req: Request, res: any, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      throw new ValidationError('Query validation failed', details);
    }

    // Replace request query with validated data
    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema, options: Joi.ValidationOptions = {}) => {
  return (req: Request, res: any, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      throw new ValidationError('Parameter validation failed', details);
    }

    // Replace request params with validated data
    req.params = value;
    next();
  };
};