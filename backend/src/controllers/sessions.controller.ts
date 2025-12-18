import { Request, Response, NextFunction } from 'express';
import sessionsService from '../services/sessions.service';
import { CreateSessionDto, UpdateSessionDto, SessionQueryParams } from '../types/session.types';
import { ApiResponse, PaginatedResponse } from '../types';

export class SessionsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateSessionDto = req.body;
      const session = await sessionsService.create(data);

      const response: ApiResponse = {
        success: true,
        data: session,
        message: 'Session created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as SessionQueryParams;
      const result = await sessionsService.findAll(query);

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
      const session = await sessionsService.findById(id);

      const response: ApiResponse = {
        success: true,
        data: session,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateSessionDto = req.body;
      const session = await sessionsService.update(id, data);

      const response: ApiResponse = {
        success: true,
        data: session,
        message: 'Session updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await sessionsService.delete(id);

      const response: ApiResponse = {
        success: true,
        message: 'Session deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new SessionsController();

