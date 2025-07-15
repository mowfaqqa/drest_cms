import { Request, NextFunction } from 'express';
import Joi from 'joi';
export declare const validateRequest: (schema: Joi.ObjectSchema, options?: Joi.ValidationOptions) => (req: Request, _res: any, next: NextFunction) => void;
export declare const validateQuery: (schema: Joi.ObjectSchema, options?: Joi.ValidationOptions) => (req: Request, _res: any, next: NextFunction) => void;
export declare const validateParams: (schema: Joi.ObjectSchema, options?: Joi.ValidationOptions) => (req: Request, _res: any, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map