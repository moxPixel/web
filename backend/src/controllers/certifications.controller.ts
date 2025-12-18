import { Request, Response, NextFunction } from 'express';
import certificationsService from '../services/certifications.service';
import { CreateCertificationDto, UpdateCertificationDto, CertificationQueryParams } from '../types/certification.types';
import { ApiResponse, PaginatedResponse } from '../types';

export class CertificationsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateCertificationDto = req.body;
      const certification = await certificationsService.create(data);

      const response: ApiResponse = {
        success: true,
        data: certification,
        message: 'Certification created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as CertificationQueryParams;
      const result = await certificationsService.findAll(query);

      const response: PaginatedResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const certification = await certificationsService.findById(id);

      const response: ApiResponse = {
        success: true,
        data: certification,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCertificationDto = req.body;
      const certification = await certificationsService.update(id, data);

      const response: ApiResponse = {
        success: true,
        data: certification,
        message: 'Certification updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await certificationsService.delete(id);

      const response: ApiResponse = {
        success: true,
        message: 'Certification deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new CertificationsController();

