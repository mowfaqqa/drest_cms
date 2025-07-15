import Joi from 'joi';
export declare const commonValidationSchemas: {
    id: Joi.StringSchema<string>;
    pagination: Joi.ObjectSchema<any>;
    search: Joi.ObjectSchema<any>;
    slug: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    price: Joi.NumberSchema<number>;
    boolean: Joi.BooleanSchema<boolean>;
};
//# sourceMappingURL=validation.d.ts.map