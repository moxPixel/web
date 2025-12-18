import { Request, Response, NextFunction } from 'express';
import { getImageUrl, deleteImage } from '../middleware/upload.middleware';
import { ApiResponse } from '../types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import path from 'path';
import fs from 'fs';

export class UploadController {
  /**
   * POST /api/upload/image
   * Uploader une image
   */
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw createError('Aucun fichier fourni', 400);
      }

      const imageUrl = getImageUrl(req.file.filename);

      const response: ApiResponse<{ url: string; filename: string }> = {
        success: true,
        data: {
          url: imageUrl,
          filename: req.file.filename,
        },
        message: 'Image uploadée avec succès',
      };

      logger.info(`Image uploaded: ${req.file.filename}`);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/upload/image/:filename
   * Supprimer une image
   */
  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename } = req.params;

      // Sécuriser le nom de fichier (empêcher les path traversal)
      const safeFilename = path.basename(filename);
      
      deleteImage(safeFilename);

      const response: ApiResponse = {
        success: true,
        message: 'Image supprimée avec succès',
      };

      logger.info(`Image deleted: ${safeFilename}`);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/upload/images
   * Lister toutes les images uploadées
   */
  async listImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const imagesDir = path.join(process.cwd(), 'uploads', 'images');
      
      if (!fs.existsSync(imagesDir)) {
        const response: ApiResponse<string[]> = {
          success: true,
          data: [],
        };
        res.status(200).json(response);
        return;
      }

      const files = fs.readdirSync(imagesDir).filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      });

      const images = files.map((file) => getImageUrl(file));

      const response: ApiResponse<string[]> = {
        success: true,
        data: images,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();

