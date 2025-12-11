import { Request, Response, NextFunction } from 'express';
import enrollmentsService from '../services/enrollments.service';
import { CreateEnrollmentDto, EnrollmentQueryParams, UpdateEnrollmentStatusDto } from '../types/enrollment.types';
import { ApiResponse, PaginatedResponse } from '../types';
import { createError } from '../middleware/error.middleware';

export class EnrollmentsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateEnrollmentDto = req.body;
      const enrollment = await enrollmentsService.create(data);
      const existingUser = (enrollment as any).existingUser === true;
      const response: ApiResponse = {
        success: true,
        data: enrollment,
        message: existingUser
          ? 'Demande enregistrée et associée à votre compte existant.'
          : 'Demande d’inscription enregistrée',
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as EnrollmentQueryParams;
      const result = await enrollmentsService.findAll(query);
      const response: PaginatedResponse<any> = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        return next(createError('Non authentifié', 401));
      }
      const result = await enrollmentsService.findAll({
        userId: req.user.id,
        page: 1,
        limit: 200,
      });
      const response: PaginatedResponse<any> = {
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
      const enrollment = await enrollmentsService.findById(id);
      const response: ApiResponse = {
        success: true,
        data: enrollment,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateEnrollmentStatusDto = req.body;
      const enrollment = await enrollmentsService.updateStatus(id, data);
      const response: ApiResponse = {
        success: true,
        data: enrollment,
        message: 'Statut mis à jour',
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new EnrollmentsController();

