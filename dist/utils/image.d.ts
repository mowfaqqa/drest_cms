export interface ImageProcessingOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}
export declare class ImageProcessor {
    private uploadDir;
    constructor(uploadDir?: string);
    processImage(inputBuffer: Buffer, filename: string, options?: ImageProcessingOptions): Promise<{
        filename: string;
        path: string;
        size: number;
    }>;
    generateImageSizes(inputBuffer: Buffer, filename: string): Promise<{
        [key: string]: {
            filename: string;
            path: string;
            size: number;
        };
    }>;
    deleteImage(filename: string): Promise<void>;
}
//# sourceMappingURL=image.d.ts.map