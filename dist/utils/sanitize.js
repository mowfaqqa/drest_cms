"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFilename = exports.sanitizeInput = void 0;
const sanitizeInput = (input) => {
    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
};
exports.sanitizeInput = sanitizeInput;
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();
};
exports.sanitizeFilename = sanitizeFilename;
//# sourceMappingURL=sanitize.js.map