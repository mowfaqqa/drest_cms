"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.createSuccessResponse = void 0;
const createSuccessResponse = (data, message) => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
});
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (error, message) => ({
    success: false,
    error,
    message,
    timestamp: new Date().toISOString()
});
exports.createErrorResponse = createErrorResponse;
//# sourceMappingURL=response.js.map