import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import sharp from 'sharp';

interface UploadedDocumentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface PrepareUploadedFileOptions {
  manualRotationDegrees?: number | null;
}

@Injectable()
export class DocumentStorageService {
  private cloudinaryConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  async prepareUploadedFile(
    file: UploadedDocumentFile,
    options: PrepareUploadedFileOptions = {},
  ) {
    this.ensureRawUploadWithinLimit(file.size);

    if (!file.mimetype.startsWith('image/')) {
      this.ensurePreparedFileWithinLimit(file.size, false);
      return file;
    }

    const manualRotationDegrees = this.normalizeManualRotationDegrees(
      options.manualRotationDegrees,
    );
    const shouldOptimizeImage =
      file.size >
        this.getConfigSizeInBytes(
          'DOCUMENT_IMAGE_OPTIMIZATION_THRESHOLD_MB',
          4,
        ) || manualRotationDegrees !== 0;

    if (!shouldOptimizeImage) {
      this.ensurePreparedFileWithinLimit(file.size, true);
      return file;
    }

    const optimizedFile = await this.optimizeImageUpload(
      file,
      manualRotationDegrees,
    );

    this.ensurePreparedFileWithinLimit(optimizedFile.size, true);
    return optimizedFile;
  }

  async saveUploadedFile(userId: number, file: UploadedDocumentFile) {
    if (this.getStorageDriver() === 'cloudinary') {
      return this.saveUploadedFileToCloudinary(file);
    }

    return this.saveUploadedFileToLocal(userId, file);
  }

  async readFileBuffer(storagePath: string) {
    if (this.isCloudinaryStoragePath(storagePath)) {
      const asset = await this.getCloudinaryAsset(storagePath);
      const response = await fetch(asset.secure_url);

      if (!response.ok) {
        throw new InternalServerErrorException(
          `No se pudo descargar el archivo desde Cloudinary (${response.status})`,
        );
      }

      return Buffer.from(await response.arrayBuffer());
    }

    return readFile(this.resolveAbsolutePath(storagePath));
  }

  async readTextFile(storagePath: string) {
    const fileBuffer = await this.readFileBuffer(storagePath);
    return fileBuffer.toString('utf8');
  }

  async deleteFile(storagePath: string) {
    if (this.isCloudinaryStoragePath(storagePath)) {
      this.configureCloudinary();
      const { publicId, resourceType } =
        this.parseCloudinaryStoragePath(storagePath);

      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true,
        });
      } catch (error) {
        if (!this.isCloudinaryNotFoundError(error)) {
          throw error;
        }
      }

      return;
    }

    await rm(this.resolveAbsolutePath(storagePath), { force: true });
  }

  resolveAbsolutePath(storagePath: string) {
    if (this.isCloudinaryStoragePath(storagePath)) {
      throw new Error(
        'Cloudinary-backed files do not have a local absolute path',
      );
    }

    return path.isAbsolute(storagePath)
      ? storagePath
      : path.join(process.cwd(), storagePath);
  }

  private async saveUploadedFileToLocal(
    userId: number,
    file: UploadedDocumentFile,
  ) {
    const storageRoot = this.configService.get<string>(
      'STORAGE_LOCAL_PATH',
      'storage',
    );
    const now = new Date();
    const subPathParts = [
      storageRoot,
      'documents',
      String(userId),
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
    ];

    const absoluteDirectory = path.join(process.cwd(), ...subPathParts);
    await mkdir(absoluteDirectory, { recursive: true });

    const extension = this.resolveExtension(file.originalname, file.mimetype);
    const filename = `${randomUUID()}${extension}`;
    const absolutePath = path.join(absoluteDirectory, filename);
    await writeFile(absolutePath, file.buffer);

    return {
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      storagePath: [...subPathParts, filename].join('/'),
    };
  }

  private async saveUploadedFileToCloudinary(file: UploadedDocumentFile) {
    this.configureCloudinary();
    const extension = this.resolveExtension(file.originalname, file.mimetype);
    const baseName = path.basename(file.originalname, extension);
    const publicId = `${baseName || 'document'}-${randomUUID()}`;
    const folder = this.configService
      .get<string>('CLOUDINARY_FOLDER', 'gestor-financia-ai')
      .trim();

    let response: UploadApiResponse;

    try {
      response = await this.uploadBufferToCloudinary(file, {
        folder,
        publicId,
      });
    } catch {
      throw new InternalServerErrorException(
        'Error al subir el archivo a Cloudinary con la configuración actual',
      );
    }

    if (!response.public_id) {
      throw new Error('Cloudinary upload did not return a public id');
    }

    return {
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      storagePath: this.buildCloudinaryStoragePath(
        response.resource_type,
        response.public_id,
      ),
    };
  }

  private getStorageDriver() {
    return this.configService.get<'local' | 'cloudinary'>(
      'STORAGE_DRIVER',
      'local',
    );
  }

  private isCloudinaryStoragePath(storagePath: string) {
    return storagePath.startsWith('cloudinary:');
  }

  private async optimizeImageUpload(
    file: UploadedDocumentFile,
    manualRotationDegrees: number,
  ) {
    try {
      const optimizedBuffer = await sharp(file.buffer, { failOn: 'none' })
        .rotate()
        .rotate(manualRotationDegrees)
        .resize({
          width: this.configService.get<number>(
            'DOCUMENT_IMAGE_MAX_DIMENSION_PX',
            2400,
          ),
          height: this.configService.get<number>(
            'DOCUMENT_IMAGE_MAX_DIMENSION_PX',
            2400,
          ),
          fit: 'inside',
          withoutEnlargement: true,
        })
        .flatten({ background: '#ffffff' })
        .jpeg({
          quality: this.configService.get<number>(
            'DOCUMENT_IMAGE_JPEG_QUALITY',
            82,
          ),
          mozjpeg: true,
        })
        .toBuffer();

      return {
        ...file,
        mimetype: 'image/jpeg',
        size: optimizedBuffer.length,
        buffer: optimizedBuffer,
      };
    } catch (error) {
      void error;
      throw new BadRequestException(
        'No se pudo optimizar la imagen subida. Revisa el archivo e inténtalo de nuevo.',
      );
    }
  }

  private ensureRawUploadWithinLimit(fileSizeBytes: number) {
    const rawLimitBytes = this.getConfigSizeInBytes(
      'DOCUMENT_UPLOAD_RAW_MAX_FILE_SIZE_MB',
      25,
    );

    if (fileSizeBytes <= rawLimitBytes) {
      return;
    }

    throw new BadRequestException(
      `El archivo supera el tamaño máximo de subida de ${this.formatMegabytes(rawLimitBytes)} MB. Reduce su peso antes de volver a intentarlo.`,
    );
  }

  private ensurePreparedFileWithinLimit(
    fileSizeBytes: number,
    attemptedOptimization: boolean,
  ) {
    const acceptedLimitBytes = this.getConfigSizeInBytes(
      'DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB',
      12,
    );

    if (fileSizeBytes <= acceptedLimitBytes) {
      return;
    }

    const message = attemptedOptimization
      ? `La imagen sigue superando el tamaño máximo permitido de ${this.formatMegabytes(acceptedLimitBytes)} MB incluso después de optimizarla. Reduce su resolución o compresión antes de subirla.`
      : `El archivo supera el tamaño máximo permitido de ${this.formatMegabytes(acceptedLimitBytes)} MB.`;

    throw new BadRequestException(message);
  }

  private getConfigSizeInBytes(configKey: string, fallbackMegabytes: number) {
    const megabytes = this.configService.get<number>(
      configKey,
      fallbackMegabytes,
    );

    return megabytes * 1024 * 1024;
  }

  private formatMegabytes(bytes: number) {
    return Number((bytes / (1024 * 1024)).toFixed(0));
  }

  private normalizeManualRotationDegrees(value?: number | null) {
    if (value === 90 || value === 180 || value === 270) {
      return value;
    }

    return 0;
  }

  private buildCloudinaryStoragePath(resourceType: string, publicId: string) {
    return `cloudinary:${resourceType}:${publicId}`;
  }

  private parseCloudinaryStoragePath(storagePath: string) {
    const [, resourceType, ...publicIdParts] = storagePath.split(':');

    if (!resourceType || publicIdParts.length === 0) {
      throw new InternalServerErrorException(
        'El identificador de Cloudinary almacenado es inválido',
      );
    }

    return {
      resourceType,
      publicId: publicIdParts.join(':'),
    };
  }

  private configureCloudinary() {
    if (this.cloudinaryConfigured) {
      return;
    }

    cloudinary.config({
      cloud_name: this.getRequiredConfig('CLOUDINARY_CLOUD_NAME'),
      api_key: this.getRequiredConfig('CLOUDINARY_API_KEY'),
      api_secret: this.getRequiredConfig('CLOUDINARY_API_SECRET'),
      secure: true,
    });

    this.cloudinaryConfigured = true;
  }

  private async uploadBufferToCloudinary(
    file: UploadedDocumentFile,
    params: { folder: string; publicId: string },
  ) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: params.folder,
          public_id: params.publicId,
          resource_type: 'auto',
          use_filename: false,
          unique_filename: false,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              error instanceof Error
                ? error
                : new Error('Cloudinary upload failed'),
            );
            return;
          }

          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  private async getCloudinaryAsset(storagePath: string) {
    this.configureCloudinary();
    const { publicId, resourceType } =
      this.parseCloudinaryStoragePath(storagePath);

    try {
      return await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
        type: 'upload',
      });
    } catch {
      throw new InternalServerErrorException(
        'No se pudo resolver el recurso en Cloudinary con la configuración actual',
      );
    }
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key);

    if (!value?.trim()) {
      throw new Error(`Missing required configuration value: ${key}`);
    }

    return value.trim();
  }

  private isCloudinaryNotFoundError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const errorWithStatus = error as {
      status?: number;
      code?: number;
      http_code?: number;
      error?: { http_code?: number };
    };

    return (
      errorWithStatus.status === 404 ||
      errorWithStatus.code === 404 ||
      errorWithStatus.http_code === 404 ||
      errorWithStatus.error?.http_code === 404
    );
  }

  private resolveExtension(originalFilename: string, mimeType: string) {
    const explicitExtension = path.extname(originalFilename);

    if (explicitExtension) {
      return explicitExtension;
    }

    const mimeMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'text/plain': '.txt',
      'application/json': '.json',
    };

    return mimeMap[mimeType] ?? '';
  }
}
