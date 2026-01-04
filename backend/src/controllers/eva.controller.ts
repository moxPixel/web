import { Request, Response, NextFunction } from 'express';
import evaChatService from '../services/eva-chat.service';
import { ApiResponse } from '../types';

class EvaController {
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, history } = req.body || {};
      const result = await evaChatService.chat({ message, history });
      const response: ApiResponse = { success: true, data: result };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new EvaController();


