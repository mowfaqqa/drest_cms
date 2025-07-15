import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { logRequest } from '@/utils/logger';
import { errorHandler } from '@/middleware/error.middleware';
// import { notFoundHandler } from '@/middleware/not-found.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';

// Import routes
import authRoutes from '@/routes/auth.routes';
import productRoutes from '@/routes/products.routes';
import categoryRoutes from '@/routes/categories.routes';
// import brandRoutes from '@/routes/brands.routes';
// import inventoryRoutes from '@/routes/inventory.routes';
// import reviewRoutes from '@/routes/reviews.routes';
// import mediaRoutes from '@/routes/media.routes';
// import dashboardRoutes from '@/routes/dashboard.routes';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
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

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.url === '/health' || req.url === '/api/v1/health';
  }
});

app.use(limiter);

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Custom request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res, duration);
  });
  
  next();
});

// Morgan for additional request logging in development
if (process.env['NODE_ENV'] === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'drest-cms',
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// API routes
const apiPrefix = process.env['API_PREFIX'] || '/api/v1';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/products`, authMiddleware, productRoutes);
app.use(`${apiPrefix}/categories`, authMiddleware, categoryRoutes);
// app.use(`${apiPrefix}/brands`, authMiddleware, brandRoutes);
// app.use(`${apiPrefix}/inventory`, authMiddleware, inventoryRoutes);
// app.use(`${apiPrefix}/reviews`, authMiddleware, reviewRoutes);
// app.use(`${apiPrefix}/media`, authMiddleware, mediaRoutes);
// app.use(`${apiPrefix}/dashboard`, authMiddleware, dashboardRoutes);

// Serve static files
app.use('/uploads', express.static('uploads'));

// API documentation endpoint
app.get(`${apiPrefix}/docs`, (req, res) => {
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

// Handle 404 for API routes
app.use(`${apiPrefix}/*`, 
    // notFoundHandler
);

// Handle 404 for other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;