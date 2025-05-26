import fs from 'fs';
import path from 'path';

export interface ImageStorageService {
  saveImage(base64Data: string, fileExtension: string, fileNamePrefix: string): Promise<string>;
  deleteImage(fileName: string): Promise<void>;
  getImageBuffer(fileName: string): Promise<Buffer | null>;
}

export class LocalImageStorageService implements ImageStorageService {
  private readonly DIAGNOSTIC_IMAGES_SERVER_PATH: string;

  constructor() {
    this.DIAGNOSTIC_IMAGES_SERVER_PATH = path.join(process.cwd(), 'private_uploads', 'diagnostic_images');
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.DIAGNOSTIC_IMAGES_SERVER_PATH)) {
      fs.mkdirSync(this.DIAGNOSTIC_IMAGES_SERVER_PATH, { recursive: true });
      console.log(`[ImageStorageService] Creado directorio de imágenes: ${this.DIAGNOSTIC_IMAGES_SERVER_PATH}`);
    }
  }

  async saveImage(base64Data: string, fileExtension: string, fileNamePrefix: string): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${fileNamePrefix}_${uniqueSuffix}.${fileExtension}`;
    const filePath = path.join(this.DIAGNOSTIC_IMAGES_SERVER_PATH, fileName);

    fs.writeFileSync(filePath, buffer);
    console.log(`[ImageStorageService] Imagen guardada en servidor como: ${filePath}`);
    return fileName;
  }

  async deleteImage(fileName: string): Promise<void> {
    const filePath = path.join(this.DIAGNOSTIC_IMAGES_SERVER_PATH, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[ImageStorageService] Imagen eliminada del servidor: ${filePath}`);
    } else {
      console.warn(`[ImageStorageService] Intento de eliminar imagen no existente: ${filePath}`);
    }
  }

  async getImageBuffer(fileName: string): Promise<Buffer | null> {
    const filePath = path.join(this.DIAGNOSTIC_IMAGES_SERVER_PATH, fileName);
    try {
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        return buffer;
      } else {
        console.warn(`[ImageStorageService] Archivo de imagen no encontrado: ${filePath}`);
        return null;
      }
    } catch (error: any) {
      console.error(`[ImageStorageService] Error al leer el archivo de imagen ${filePath}:`, error.message);
      return null;
    }
  }
}
