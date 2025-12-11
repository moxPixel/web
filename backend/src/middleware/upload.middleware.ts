import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/logger';
import { createError } from './error.middleware';

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, imagesDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Générer un nom de fichier unique : uuid-originalname.ext
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const uniqueFilename = `${uuidv4()}-${sanitizedName}${ext}`;
    cb(null, uniqueFilename);
  },
});

// Filtre pour accepter uniquement les images
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(`Type de fichier non autorisé. Types acceptés: ${allowedMimes.join(', ')}`, 400));
  }
};

// Configuration multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware pour gérer les erreurs multer
export const handleUploadError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(createError('Fichier trop volumineux. Taille maximale: 5MB', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(createError('Champ de fichier inattendu', 400));
    }
    return next(createError(`Erreur d'upload: ${err.message}`, 400));
  }
  next(err);
};

// Helper pour obtenir l'URL publique d'une image
export const getImageUrl = (filename: string): string => {
  return `/uploads/images/${filename}`;
};

// Helper pour supprimer un fichier
export const deleteImage = (filename: string): void => {
  const filePath = path.join(imagesDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logger.info(`Image deleted: ${filename}`);
  }
};

// Middleware pour valider qu'un fichier a été uploadé
export const requireFile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    return next(createError('Aucun fichier fourni', 400));
  }
  next();
};

