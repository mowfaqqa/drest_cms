import multer from 'multer';
import { Request } from 'express';
export declare const handleUploadError: (error: any, _req: Request, _res: any, next: any) => void;
export declare const uploadMiddleware: multer.Multer;
export declare const uploadSingle: (fieldName?: string) => (((error: any, _req: Request, _res: any, next: any) => void) | import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>)[];
export declare const uploadMultiple: (fieldName?: string, maxCount?: number) => (((error: any, _req: Request, _res: any, next: any) => void) | import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>)[];
export declare const uploadFields: (fields: {
    name: string;
    maxCount: number;
}[]) => (((error: any, _req: Request, _res: any, next: any) => void) | import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>)[];
export declare const uploadImage: (((error: any, _req: Request, _res: any, next: any) => void) | import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>)[];
export declare const uploadDocument: (((error: any, _req: Request, _res: any, next: any) => void) | import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>)[];
export declare const deleteUploadedFile: (filePath: string) => void;
export declare const getFileUrl: (filename: string, subDir?: string) => string;
export declare const cleanupOldFiles: (olderThanDays?: number) => void;
//# sourceMappingURL=upload.middleware.d.ts.map