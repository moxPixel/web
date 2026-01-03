import { Request, Response, NextFunction } from 'express';
import eventsService from '../services/events.service';
import { CreateEventDto, UpdateEventDto, EventQueryParams } from '../types/event.types';
import { ApiResponse, PaginatedResponse } from '../types';
import { buildIcsEvent } from '../utils/ics.util';

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

  /**
   * Public calendar export (published only) as iCalendar (.ics)
   * Scannable via QR code for "Add to calendar" flows on mobile.
   */
  async downloadIcsBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const event = await eventsService.findBySlug(slug);

      const start = new Date(event.startDate);
      const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 60 * 60 * 1000); // default 1h

      const uid = `${event.id}@unlock`;
      const location = event.isOnline ? 'En ligne' : (event.location || '');
      const url = event.registrationUrl || '';

      const ics = buildIcsEvent({
        uid,
        dtstamp: new Date(),
        start,
        end,
        summary: event.title,
        description: event.description || event.excerpt || '',
        location,
        url,
      });

      const safeSlug = String(event.slug || 'event').replace(/[^a-z0-9-_]+/gi, '-');
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="unlock-${safeSlug}.ics"`);
      res.status(200).send(ics);
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


