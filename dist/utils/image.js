"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProcessor = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class ImageProcessor {
    constructor(uploadDir = 'uploads') {
        this.uploadDir = uploadDir;
    }
    async processImage(inputBuffer, filename, options = {}) {
        const { width = 800, height = 600, quality = 80, format = 'webp', fit = 'cover' } = options;
        const ext = format;
        const baseName = path_1.default.parse(filename).name;
        const processedFilename = `${baseName}-${Date.now()}.${ext}`;
        const outputPath = path_1.default.join(this.uploadDir, processedFilename);
        await promises_1.default.mkdir(this.uploadDir, { recursive: true });
        const processedBuffer = await (0, sharp_1.default)(inputBuffer)
            .resize(width, height, { fit })
            .toFormat(format, { quality })
            .toBuffer();
        await promises_1.default.writeFile(outputPath, processedBuffer);
        return {
            filename: processedFilename,
            path: outputPath,
            size: processedBuffer.length
        };
    }
    async generateImageSizes(inputBuffer, filename) {
        const sizes = {
            thumbnail: { width: 150, height: 150 },
            small: { width: 300, height: 300 },
            medium: { width: 600, height: 600 },
            large: { width: 1200, height: 1200 }
        };
        const results = {};
        for (const [sizeName, dimensions] of Object.entries(sizes)) {
            results[sizeName] = await this.processImage(inputBuffer, filename, {
                ...dimensions,
                format: 'webp',
                quality: 80
            });
        }
        return results;
    }
    async deleteImage(filename) {
        try {
            const filePath = path_1.default.join(this.uploadDir, filename);
            await promises_1.default.unlink(filePath);
        }
        catch (error) {
        }
    }
}
exports.ImageProcessor = ImageProcessor;
//# sourceMappingURL=image.js.map