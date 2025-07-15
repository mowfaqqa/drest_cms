import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger, logError } from '../utils/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code!;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends AppError {
  public details: any[];

  constructor(message: string, details: any[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

// Authentication error class
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// Authorization error class
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Not found error class
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

// Conflict error class
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

// Handle Prisma errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.['target'] as string[] | undefined;
      const fieldName = field?.[0] || 'field';
      return new ConflictError(`${fieldName} already exists`);
      
    case 'P2025':
      // Record not found
      return new NotFoundError('Record');
      
    case 'P2003':
      // Foreign key constraint violation
      return new AppError('Cannot delete record due to related data', 400, 'FOREIGN_KEY_CONSTRAINT');
      
    case 'P2014':
      // Required relation missing
      return new ValidationError('Required relation is missing');
      
    default:
      logger.error('Unhandled Prisma error:', { code: error.code, message: error.message });
      return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

// Handle JWT errors
const handleJWTError = (error: Error): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token has expired');
  }
  return new AuthenticationError('Token verification failed');
};

// Handle multer errors
const handleMulterError = (error: any): AppError => {
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

// Format error response
const formatErrorResponse = (error: AppError, req: Request) => {
  const response: any = {
    success: false,
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add validation details if available
  if (error instanceof ValidationError && error.details.length > 0) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (process.env['NODE_ENV'] === 'development') {
    response.stack = error.stack;
  }

  return response;
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Handle known error types
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Invalid data provided');
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    appError = handleJWTError(error);
  } else if (error.name === 'MulterError') {
    appError = handleMulterError(error);
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    appError = new ValidationError('Invalid JSON in request body');
  } else {
    // Unknown error
    appError = new AppError(
      process.env['NODE_ENV'] === 'production' 
        ? 'Something went wrong' 
        : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log error details
  logError(error, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Send error response
  const errorResponse = formatErrorResponse(appError, req);
  res.status(appError.statusCode).json(errorResponse);

  next();
};

// Not found middleware
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new NotFoundError('API endpoint');
  const errorResponse = formatErrorResponse(error, req);
  res.status(404).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error helper
export const createValidationError = (details: any[]) => {
  return new ValidationError('Validation failed', details);
};