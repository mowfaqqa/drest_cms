"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const products_routes_1 = __importDefault(require("./products.routes"));
const categories_routes_1 = __importDefault(require("./categories.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/products', products_routes_1.default);
router.use('/categories', categories_routes_1.default);
router.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'drest-cms-api',
        version: process.env['npm_package_version'] || '1.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=index.routes.js.map