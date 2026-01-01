import { Request, Response, NextFunction } from 'express';
import eventsService from '../services/events.service';
import { CreateEventDto, UpdateEventDto, EventQueryParams } from '../types/event.types';
import { ApiResponse, PaginatedResponse } from '../types';

export class EventsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateEventDto = req.body;
      const created = await eventsService.create(data);
      const response: ApiResponse = { success: true, data: created, message: 'Event created successfully' };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as EventQueryParams;
      const result = await eventsService.findAll(query);
      const response: PaginatedResponse<any> = { success: true, data: result.data, pagination: result.pagination };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await eventsService.findById(id);
      const response: ApiResponse = { success: true, data: event };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const event = await eventsService.findBySlug(slug);
      const response: ApiResponse = { success: true, data: event };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateEventDto = req.body;
      const updated = await eventsService.update(id, data);
      const response: ApiResponse = { success: true, data: updated, message: 'Event updated successfully' };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await eventsService.delete(id);
      const response: ApiResponse = { success: true, message: 'Event deleted successfully' };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new EventsController();


