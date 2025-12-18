import { Request, Response, NextFunction } from 'express';
import trainingsService from '../services/trainings.service';
import { CreateTrainingDto, UpdateTrainingDto, TrainingQueryParams } from '../types/training.types';
import { ApiResponse, PaginatedResponse } from '../types';

export class TrainingsController {
  /**
   * POST /api/trainings
   * Créer une nouvelle formation
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateTrainingDto = req.body;
      const training = await trainingsService.create(data);

      const response: ApiResponse = {
        success: true,
        data: training,
        message: 'Training created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/trainings
   * Récupérer toutes les formations
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as TrainingQueryParams;
      const result = await trainingsService.findAll(query);

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

  /**
   * GET /api/trainings/:id
   * Récupérer une formation par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const training = await trainingsService.findById(id);

      const response: ApiResponse = {
        success: true,
        data: training,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/trainings/slug/:slug
   * Récupérer une formation par slug
   */
  async findBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const training = await trainingsService.findBySlug(slug);

      const response: ApiResponse = {
        success: true,
        data: training,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/trainings/:id
   * Mettre à jour une formation
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateTrainingDto = req.body;
      const training = await trainingsService.update(id, data);

      const response: ApiResponse = {
        success: true,
        data: training,
        message: 'Training updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/trainings/:id
   * Supprimer une formation
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await trainingsService.delete(id);

      const response: ApiResponse = {
        success: true,
        message: 'Training deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new TrainingsController();

