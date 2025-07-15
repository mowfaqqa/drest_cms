"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.logAudit = exports.logPerformance = exports.logSecurityEvent = exports.logError = exports.logRequest = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logsDir = 'logs';
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
}));
const logger = winston_1.default.createLogger({
    level: process.env['LOG_LEVEL'] || 'info',
    format: logFormat,
    defaultMeta: {
        service: process.env['npm_package_name'] || 'drest-backend',
        environment: process.env['NODE_ENV'] || 'development'
    },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'exceptions.log'),
            maxsize: 5242880,
            maxFiles: 5,
        })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'rejections.log'),
            maxsize: 5242880,
            maxFiles: 5,
        })
    ]
});
exports.logger = logger;
if (process.env['NODE_ENV'] !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}
const logRequest = (req, res, duration) => {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
    });
};
exports.logRequest = logRequest;
const logError = (error, context) => {
    logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        context
    });
};
exports.logError = logError;
const logSecurityEvent = (event, details) => {
    logger.warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
};
exports.logSecurityEvent = logSecurityEvent;
const logPerformance = (operation, duration, metadata) => {
    logger.info('Performance Metric', {
        operation,
        duration: `${duration}ms`,
        ...metadata
    });
};
exports.logPerformance = logPerformance;
const logAudit = (action, userId, resource, resourceId, changes) => {
    logger.info('Audit Log', {
        action,
        userId,
        resource,
        resourceId,
        changes,
        timestamp: new Date().toISOString()
    });
};
exports.logAudit = logAudit;
exports.default = logger;
//# sourceMappingURL=logger.js.map