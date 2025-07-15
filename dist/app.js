"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./utils/logger");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_middleware_1 = require("./middleware/auth.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const categories_routes_1 = __importDefault(require("./routes/categories.routes"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://via.placeholder.com"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'];
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
};
app.use((0, cors_1.default)(corsOptions));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
    max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.url === '/health' || req.url === '/api/v1/health';
    }
});
app.use(limiter);
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        try {
            (0, logger_1.logRequest)(req, res, duration);
        }
        catch (error) {
            console.error('Error in request logging:', error);
        }
    });
    next();
});
if (process.env['NODE_ENV'] === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
app.get('/health', (req, res) => {
    console.log('Health check accessed', req);
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'drest-cms',
        version: process.env['npm_package_version'] || '1.0.0',
        environment: process.env['NODE_ENV'] || 'development'
    });
});
try {
    const swaggerUi = require('swagger-ui-express');
    const YAML = require('yamljs');
    const fs = require('fs');
    const path = require('path');
    const swaggerPath = path.join(process.cwd(), '/swagger.yaml');
    if (fs.existsSync(swaggerPath)) {
        const swaggerDocument = YAML.load(swaggerPath);
        app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        console.log('Swagger documentation loaded successfully');
    }
    else {
        console.warn('swagger.yaml not found, skipping Swagger setup');
    }
}
catch (error) {
    console.warn('Error setting up Swagger documentation:', error.message);
}
const apiPrefix = process.env['API_PREFIX'] || '/api/v1';
app.use(`${apiPrefix}/auth`, auth_routes_1.default);
app.use(`${apiPrefix}/products`, auth_middleware_1.authMiddleware, products_routes_1.default);
app.use(`${apiPrefix}/categories`, auth_middleware_1.authMiddleware, categories_routes_1.default);
app.use('/uploads', express_1.default.static('uploads'));
app.get(`${apiPrefix}/docs`, (req, res) => {
    console.log('API Documentation accessed', req.originalUrl);
    res.json({
        name: 'Drest.sn CMS API',
        version: '1.0.0',
        description: 'Headless CMS API for Drest.sn E-commerce platform',
        endpoints: {
            auth: `${apiPrefix}/auth`,
            products: `${apiPrefix}/products`,
            categories: `${apiPrefix}/categories`,
            brands: `${apiPrefix}/brands`,
            inventory: `${apiPrefix}/inventory`,
            reviews: `${apiPrefix}/reviews`,
            media: `${apiPrefix}/media`,
            dashboard: `${apiPrefix}/dashboard`
        },
        documentation: 'https://docs.drest.sn/cms-api'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map