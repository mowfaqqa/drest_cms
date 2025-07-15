import { Request, Response } from 'express';
export declare class CategoriesController {
    private categoryService;
    constructor();
    getCategories: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateCategoryStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    reorderCategories: (req: Request, res: Response, next: import("express").NextFunction) => void;
    moveCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCategoryAttributes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createCategoryAttribute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateCategoryAttribute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteCategoryAttribute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCategoryStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    searchCategories: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCategoryBreadcrumb: (req: Request, res: Response, next: import("express").NextFunction) => void;
    bulkUpdateCategories: (req: Request, res: Response, next: import("express").NextFunction) => void;
    exportCategories: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=categorires.controller.d.ts.map