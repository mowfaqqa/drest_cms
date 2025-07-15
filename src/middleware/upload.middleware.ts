import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ValidationError } from '../middleware/error.middleware';
import { FILE_UPLOAD } from '../utils/constant';
import { sanitizeFilename } from '../utils/sanitize';

// Ensure upload directory exists
const uploadDir = process.env['UPLOAD_DIR'] || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: any, file: any, cb: any) => {
    const subDir = getSubDirectory(file.mimetype);
    const fullPath = path.join(uploadDir, subDir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (_req: any, file: any, cb: any) => {
    const sanitizedName = sanitizeFilename(file.originalname);
    const name = path.parse(sanitizedName).name;
    const ext = path.extname(sanitizedName);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    
    cb(null, `${name}-${timestamp}-${randomString}${ext}`);
  }
});

// Get subdirectory based on file type
const getSubDirectory = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) {
    return 'images';
  }
  if (mimetype.startsWith('video/')) {
    return 'videos';
  }
  if (mimetype.includes('pdf')) {
    return 'documents';
  }
  if (mimetype.includes('spreadsheet') || mimetype.includes('csv') || mimetype.includes('excel')) {
    return 'spreadsheets';
  }
  return 'others';
};

// File filter function
const fileFilter = (_req: Request, file: any, cb: any) => {
  // Check if file type is allowed
  if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new ValidationError(
      `File type ${file.mimetype} is not allowed. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`
    ));
  }
  
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: FILE_UPLOAD.MAX_FILES
  }
});

// Middleware for handling multer errors
export const handleUploadError = (error: any, _req: Request, _res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        throw new ValidationError(`File size exceeds limit of ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`);
      case 'LIMIT_FILE_COUNT':
        throw new ValidationError(`Maximum ${FILE_UPLOAD.MAX_FILES} files allowed`);
      case 'LIMIT_UNEXPECTED_FILE':
        throw new ValidationError('Unexpected field name');
      default:
        throw new ValidationError('File upload failed');
    }
  }
  next(error);
};

// Export configured multer instance
export const uploadMiddleware = upload;

// Specific middleware for different upload types
export const uploadSingle = (fieldName: string = 'file') => [
  upload.single(fieldName),
  handleUploadError
];

export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => [
  upload.array(fieldName, maxCount),
  handleUploadError
];

export const uploadFields = (fields: { name: string; maxCount: number }[]) => [
  upload.fields(fields),
  handleUploadError
];

// Image-specific upload middleware
export const uploadImage = [
  multer({
    storage,
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new ValidationError('Only image files are allowed'));
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
        return cb(new ValidationError('Allowed image types: JPEG, PNG, WebP, GIF'));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB for images
      files: 10
    }
  }).array('images', 10),
  handleUploadError
];

// Document upload middleware (for imports)
export const uploadDocument = [
  multer({
    storage,
    fileFilter: (_req, file, cb) => {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new ValidationError('Only CSV and Excel files are allowed'));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB for documents
      files: 1
    }
  }).single('file'),
  handleUploadError
];

// Utility function to delete uploaded file
export const deleteUploadedFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Utility function to get file URL
export const getFileUrl = (filename: string, subDir?: string): string => {
  const baseUrl = process.env['BASE_URL'] || 'http://localhost:3000';
  if (subDir) {
    return `${baseUrl}/uploads/${subDir}/${filename}`;
  }
  return `${baseUrl}/uploads/${filename}`;
};

// Clean up old files (should be run as a scheduled job)
export const cleanupOldFiles = (olderThanDays: number = 30): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const traverseDirectory = (directory: string) => {
    try {
      const files = fs.readdirSync(directory);
      
      files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          traverseDirectory(filePath);
        } else if (stats.mtime < cutoffDate) {
          // Check if file is still referenced in database before deleting
          // This is a placeholder - implement actual database check
          // deleteUploadedFile(filePath);
        }
      });
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  };

  traverseDirectory(uploadDir);
};