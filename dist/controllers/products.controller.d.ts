import { Request, Response } from 'express';
export declare class ProductsController {
    private productService;
    constructor();
    getProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    bulkUpdateProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    duplicateProduct: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProductVariants: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createProductVariant: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateProductVariant: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteProductVariant: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateProductStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProductAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    searchProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProductsByCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProductStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    importProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    exportProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=products.controller.d.ts.map