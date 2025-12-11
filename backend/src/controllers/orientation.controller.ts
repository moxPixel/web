import { Request, Response, NextFunction } from 'express';
import orientationService from '../services/orientation.service';
import { OrientationRequestDto } from '../types/orientation.types';
import { ApiResponse } from '../types';

class OrientationController {
  async evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload: OrientationRequestDto = req.body;
      const result = await orientationService.process(payload);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new OrientationController();
