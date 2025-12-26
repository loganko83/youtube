import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Storage Service - File upload and management
 * Supports local filesystem and can be extended for S3/GCS
 */

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface StorageOptions {
  directory?: string;
  filename?: string;
  mimeType?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseDir = this.config.get<string>('STORAGE_PATH') || './uploads';
    this.baseUrl = this.config.get<string>('STORAGE_URL') || '/uploads';
  }

  /**
   * Upload a file from buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    options: StorageOptions = {},
  ): Promise<UploadResult> {
    const directory = options.directory || 'files';
    const ext = this.getExtensionFromMimeType(options.mimeType || 'application/octet-stream');
    const filename = options.filename || `${this.generateId()}${ext}`;

    const dirPath = path.join(this.baseDir, directory);
    const filePath = path.join(dirPath, filename);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    const url = `${this.baseUrl}/${directory}/${filename}`;

    this.logger.log(`File uploaded: ${filePath} (${buffer.length} bytes)`);

    return {
      url,
      path: filePath,
      filename,
      size: buffer.length,
      mimeType: options.mimeType || 'application/octet-stream',
    };
  }

  /**
   * Upload audio file
   */
  async uploadAudio(buffer: Buffer, filename?: string): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      directory: 'audio',
      filename: filename || `${this.generateId()}.mp3`,
      mimeType: 'audio/mpeg',
    });
  }

  /**
   * Upload video file
   */
  async uploadVideo(buffer: Buffer, filename?: string): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      directory: 'videos',
      filename: filename || `${this.generateId()}.mp4`,
      mimeType: 'video/mp4',
    });
  }

  /**
   * Upload image file
   */
  async uploadImage(buffer: Buffer, mimeType: string = 'image/png', filename?: string): Promise<UploadResult> {
    const ext = this.getExtensionFromMimeType(mimeType);
    return this.uploadBuffer(buffer, {
      directory: 'images',
      filename: filename || `${this.generateId()}${ext}`,
      mimeType,
    });
  }

  /**
   * Download file from URL and upload to storage
   */
  async uploadFromUrl(url: string, options: StorageOptions = {}): Promise<UploadResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      return this.uploadBuffer(buffer, {
        ...options,
        mimeType: options.mimeType || contentType,
      });
    } catch (error) {
      this.logger.error(`Failed to upload from URL: ${url}`, error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${filePath}`, error);
    }
  }

  /**
   * Check if file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getStats(filePath: string): Promise<{ size: number; created: Date; modified: Date } | null> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate unique ID for filenames
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/json': '.json',
      'text/plain': '.txt',
    };

    return mimeToExt[mimeType] || '';
  }
}
