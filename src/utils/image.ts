import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export class ImageProcessor {
  private uploadDir: string;

  constructor(uploadDir: string = 'uploads') {
    this.uploadDir = uploadDir;
  }

  /**
   * Process and optimize image
   */
  async processImage(
    inputBuffer: Buffer,
    filename: string,
    options: ImageProcessingOptions = {}
  ): Promise<{ filename: string; path: string; size: number }> {
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'webp',
      fit = 'cover'
    } = options;

    // Generate unique filename
    const ext = format;
    const baseName = path.parse(filename).name;
    const processedFilename = `${baseName}-${Date.now()}.${ext}`;
    const outputPath = path.join(this.uploadDir, processedFilename);

    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Process image
    const processedBuffer = await sharp(inputBuffer)
      .resize(width, height, { fit })
      .toFormat(format, { quality })
      .toBuffer();

    // Save processed image
    await fs.writeFile(outputPath, processedBuffer);

    return {
      filename: processedFilename,
      path: outputPath,
      size: processedBuffer.length
    };
  }

  /**
   * Generate multiple image sizes
   */
  async generateImageSizes(
    inputBuffer: Buffer,
    filename: string
  ): Promise<{ [key: string]: { filename: string; path: string; size: number } }> {
    const sizes = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 300, height: 300 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 }
    };

    const results: any = {};

    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      results[sizeName] = await this.processImage(inputBuffer, filename, {
        ...dimensions,
        format: 'webp',
        quality: 80
      });
    }

    return results;
  }

  /**
   * Delete image file
   */
  async deleteImage(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }
}
