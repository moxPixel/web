import { ApiResponse, PaginatedResponse } from './api.interface';

export type EventStatus = 'draft' | 'published' | 'archived';
export type EventType = 'webinar' | 'atelier' | 'conference' | 'meetup' | 'portes-ouvertes' | 'autre';

export interface EventApi {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  description?: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline: boolean;
  registrationUrl?: string;
  coverImage?: string;
  highlight: boolean;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: EventStatus;
  eventType?: EventType;
  upcoming?: boolean;
  highlight?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateEventDto {
  title: string;
  slug: string;
  excerpt?: string;
  description?: string;
  eventType?: EventType;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  registrationUrl?: string;
  coverImage?: string;
  highlight?: boolean;
  status?: EventStatus;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export type EventApiResponse = ApiResponse<EventApi>;
export type EventListResponse = PaginatedResponse<EventApi>;


