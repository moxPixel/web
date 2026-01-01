import { Op } from 'sequelize';
import Event from '../models/Event';
import { CreateEventDto, UpdateEventDto, EventQueryParams } from '../types/event.types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import { deleteImage } from '../middleware/upload.middleware';

export class EventsService {
  async create(data: CreateEventDto): Promise<Event> {
    try {
      const existing = await Event.findOne({ where: { slug: data.slug } });
      if (existing) {
        throw createError(`Event with slug "${data.slug}" already exists`, 409);
      }
      const created = await Event.create(data as any);
      logger.info(`Event created: ${created.id}`);
      return created;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  async findAll(query: EventQueryParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        eventType,
        upcoming,
        highlight,
        sortBy = 'startDate',
        sortOrder = 'ASC',
      } = query;

      const safeLimit = Math.max(1, Math.min(500, Number(limit) || 10));
      const safePage = Math.max(1, Number(page) || 1);
      const offset = (safePage - 1) * safeLimit;
      const where: Record<string, unknown> = {};

      if (search) {
        where[Op.or as unknown as string] = [
          { title: { [Op.like as unknown as string]: `%${search}%` } },
          { slug: { [Op.like as unknown as string]: `%${search}%` } },
          { excerpt: { [Op.like as unknown as string]: `%${search}%` } },
        ];
      }
      if (status) where.status = status;
      if (eventType) where.eventType = eventType;
      if (upcoming === 'true') {
        where.startDate = { [Op.gte as unknown as string]: new Date() };
      }
      if (highlight === 'true') where.highlight = true;
      if (highlight === 'false') where.highlight = false;

      const allowedSort = new Set<string>(['createdAt', 'updatedAt', 'title', 'status', 'startDate']);
      const sortField = allowedSort.has(String(sortBy)) ? String(sortBy) : 'startDate';
      const orderDir = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const { count, rows } = await Event.findAndCountAll({
        where,
        limit: safeLimit,
        offset,
        order: [[sortField, orderDir]],
      });

      return {
        data: rows,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: count,
          totalPages: Math.ceil(count / safeLimit),
        },
      };
    } catch (error) {
      logger.error('Error finding events:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Event> {
    const event = await Event.findByPk(id);
    if (!event) throw createError(`Event with id "${id}" not found`, 404);
    return event;
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await Event.findOne({ where: { slug, status: 'published' } });
    if (!event) throw createError(`Event with slug "${slug}" not found`, 404);
    return event;
  }

  async update(id: string, data: UpdateEventDto): Promise<Event> {
    const event = await Event.findByPk(id);
    if (!event) throw createError(`Event with id "${id}" not found`, 404);

    const oldCover = event.coverImage;

    // slug uniqueness
    if (data.slug && data.slug !== event.slug) {
      const existing = await Event.findOne({ where: { slug: data.slug } });
      if (existing && existing.id !== id) throw createError(`Event with slug "${data.slug}" already exists`, 409);
    }

    await event.update(data as any);

    // delete old cover image if replaced/removed
    if (data.coverImage !== undefined) {
      if (data.coverImage !== oldCover && oldCover) {
        const oldFilename = this.extractFilenameFromUrl(oldCover);
        if (oldFilename) {
          try {
            deleteImage(oldFilename);
          } catch (e) {
            logger.warn(`Failed to delete old cover image ${oldFilename}`);
          }
        }
      }
    }

    return event;
  }

  async delete(id: string): Promise<void> {
    const event = await Event.findByPk(id);
    if (!event) throw createError(`Event with id "${id}" not found`, 404);

    if (event.coverImage) {
      const filename = this.extractFilenameFromUrl(event.coverImage);
      if (filename) {
        try {
          deleteImage(filename);
        } catch (e) {
          logger.warn(`Failed to delete cover image ${filename}`);
        }
      }
    }

    await event.destroy();
  }

  private extractFilenameFromUrl(url: string): string | null {
    if (!url) return null;
    // Accept "/uploads/images/<filename>"
    const match = url.match(/\/uploads\/images\/([^/?#]+)$/);
    if (match?.[1]) return match[1];
    // If only filename stored
    if (!url.includes('/') && url.length > 3) return url;
    return null;
  }
}

export default new EventsService();


