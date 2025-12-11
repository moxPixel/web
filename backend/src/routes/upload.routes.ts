import { Router } from 'express';
import uploadController from '../controllers/upload.controller';
import { upload, handleUploadError, requireFile } from '../middleware/upload.middleware';
import { param } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();

const filenameParamValidation = [
  param('filename').notEmpty().withMessage('Filename is required'),
  validate,
];

// POST /api/upload/image - Uploader une image
router.post(
  '/image',
  upload.single('image'),
  handleUploadError,
  requireFile,
  uploadController.uploadImage.bind(uploadController)
);

// DELETE /api/upload/image/:filename - Supprimer une image
router.delete(
  '/image/:filename',
  filenameParamValidation,
  uploadController.deleteImage.bind(uploadController)
);

// GET /api/upload/images - Lister toutes les images
router.get('/images', uploadController.listImages.bind(uploadController));

export default router;

