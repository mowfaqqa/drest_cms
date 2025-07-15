"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidationError = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
const handlePrismaError = (error) => {
    switch (error.code) {
        case 'P2002':
            const field = error.meta?.['target'];
            const fieldName = field?.[0] || 'field';
            return new ConflictError(`${fieldName} already exists`);
        case 'P2025':
            return new NotFoundError('Record');
        case 'P2003':
            return new AppError('Cannot delete record due to related data', 400, 'FOREIGN_KEY_CONSTRAINT');
        case 'P2014':
            return new ValidationError('Required relation is missing');
        default:
            logger_1.logger.error('Unhandled Prisma error:', { code: error.code, message: error.message });
            return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
    }
};
const handleJWTError = (error) => {
    if (error.name === 'JsonWebTokenError') {
        return new AuthenticationError('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
        return new AuthenticationError('Token has expired');
    }
    return new AuthenticationError('Token verification failed');
};
const handleMulterError = (error) => {
    if (error.code === 'LIMIT_FILE_SIZE') {
        return new ValidationError('File size too large');
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
        return new ValidationError('Too many files');
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return new ValidationError('Unexpected field');
    }
    return new AppError('File upload failed', 400, 'UPLOAD_ERROR');
};
const formatErrorResponse = (error, req) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };
    if (error instanceof ValidationError && error.details.length > 0) {
        response.details = error.details;
    }
    if (process.env['NODE_ENV'] === 'development') {
        response.stack = error.stack;
    }
    return response;
};
const errorHandler = (error, req, res, next) => {
    let appError;
    if (error instanceof AppError) {
        appError = error;
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        appError = handlePrismaError(error);
    }
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        appError = new ValidationError('Invalid data provided');
    }
    else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        appError = handleJWTError(error);
    }
    else if (error.name === 'MulterError') {
        appError = handleMulterError(error);
    }
    else if (error.name === 'SyntaxError' && 'body' in error) {
        appError = new ValidationError('Invalid JSON in request body');
    }
    else {
        appError = new AppError(process.env['NODE_ENV'] === 'production'
            ? 'Something went wrong'
            : error.message, 500, 'INTERNAL_ERROR');
    }
    (0, logger_1.logError)(error, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        body: req.body,
        params: req.params,
        query: req.query
    });
    const errorResponse = formatErrorResponse(appError, req);
    res.status(appError.statusCode).json(errorResponse);
    next();
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    const error = new NotFoundError('API endpoint');
    const errorResponse = formatErrorResponse(error, req);
    res.status(404).json(errorResponse);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const createValidationError = (details) => {
    return new ValidationError('Validation failed', details);
};
exports.createValidationError = createValidationError;
//# sourceMappingURL=error.middleware.js.map