"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldFiles = exports.getFileUrl = exports.deleteUploadedFile = exports.uploadDocument = exports.uploadImage = exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = exports.uploadMiddleware = exports.handleUploadError = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const error_middleware_1 = require("../middleware/error.middleware");
const constant_1 = require("../utils/constant");
const sanitize_1 = require("../utils/sanitize");
const uploadDir = process.env['UPLOAD_DIR'] || 'uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, file, cb) => {
        const subDir = getSubDirectory(file.mimetype);
        const fullPath = path_1.default.join(uploadDir, subDir);
        if (!fs_1.default.existsSync(fullPath)) {
            fs_1.default.mkdirSync(fullPath, { recursive: true });
        }
        cb(null, fullPath);
    },
    filename: (_req, file, cb) => {
        const sanitizedName = (0, sanitize_1.sanitizeFilename)(file.originalname);
        const name = path_1.default.parse(sanitizedName).name;
        const ext = path_1.default.extname(sanitizedName);
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        cb(null, `${name}-${timestamp}-${randomString}${ext}`);
    }
});
const getSubDirectory = (mimetype) => {
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
const fileFilter = (_req, file, cb) => {
    if (!constant_1.FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(new error_middleware_1.ValidationError(`File type ${file.mimetype} is not allowed. Allowed types: ${constant_1.FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`));
    }
    cb(null, true);
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: constant_1.FILE_UPLOAD.MAX_SIZE,
        files: constant_1.FILE_UPLOAD.MAX_FILES
    }
});
const handleUploadError = (error, _req, _res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                throw new error_middleware_1.ValidationError(`File size exceeds limit of ${constant_1.FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`);
            case 'LIMIT_FILE_COUNT':
                throw new error_middleware_1.ValidationError(`Maximum ${constant_1.FILE_UPLOAD.MAX_FILES} files allowed`);
            case 'LIMIT_UNEXPECTED_FILE':
                throw new error_middleware_1.ValidationError('Unexpected field name');
            default:
                throw new error_middleware_1.ValidationError('File upload failed');
        }
    }
    next(error);
};
exports.handleUploadError = handleUploadError;
exports.uploadMiddleware = upload;
const uploadSingle = (fieldName = 'file') => [
    upload.single(fieldName),
    exports.handleUploadError
];
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName = 'files', maxCount = 5) => [
    upload.array(fieldName, maxCount),
    exports.handleUploadError
];
exports.uploadMultiple = uploadMultiple;
const uploadFields = (fields) => [
    upload.fields(fields),
    exports.handleUploadError
];
exports.uploadFields = uploadFields;
exports.uploadImage = [
    (0, multer_1.default)({
        storage,
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                return cb(new error_middleware_1.ValidationError('Only image files are allowed'));
            }
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
                return cb(new error_middleware_1.ValidationError('Allowed image types: JPEG, PNG, WebP, GIF'));
            }
            cb(null, true);
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
            files: 10
        }
    }).array('images', 10),
    exports.handleUploadError
];
exports.uploadDocument = [
    (0, multer_1.default)({
        storage,
        fileFilter: (_req, file, cb) => {
            const allowedTypes = [
                'text/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            if (!allowedTypes.includes(file.mimetype)) {
                return cb(new error_middleware_1.ValidationError('Only CSV and Excel files are allowed'));
            }
            cb(null, true);
        },
        limits: {
            fileSize: 50 * 1024 * 1024,
            files: 1
        }
    }).single('file'),
    exports.handleUploadError
];
const deleteUploadedFile = (filePath) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    catch (error) {
        console.error('Error deleting file:', error);
    }
};
exports.deleteUploadedFile = deleteUploadedFile;
const getFileUrl = (filename, subDir) => {
    const baseUrl = process.env['BASE_URL'] || 'http://localhost:3000';
    if (subDir) {
        return `${baseUrl}/uploads/${subDir}/${filename}`;
    }
    return `${baseUrl}/uploads/${filename}`;
};
exports.getFileUrl = getFileUrl;
const cleanupOldFiles = (olderThanDays = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const traverseDirectory = (directory) => {
        try {
            const files = fs_1.default.readdirSync(directory);
            files.forEach(file => {
                const filePath = path_1.default.join(directory, file);
                const stats = fs_1.default.statSync(filePath);
                if (stats.isDirectory()) {
                    traverseDirectory(filePath);
                }
                else if (stats.mtime < cutoffDate) {
                }
            });
        }
        catch (error) {
            console.error('Error cleaning up files:', error);
        }
    };
    traverseDirectory(uploadDir);
};
exports.cleanupOldFiles = cleanupOldFiles;
//# sourceMappingURL=upload.middleware.js.map