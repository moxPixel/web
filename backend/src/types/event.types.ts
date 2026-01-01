export interface CreateEventDto {
  title: string;
  slug: string;
  excerpt?: string;
  description?: string;
  eventType?: 'webinar' | 'atelier' | 'conference' | 'meetup' | 'portes-ouvertes' | 'autre';
  startDate: string; // ISO
  endDate?: string; // ISO
  location?: string;
  isOnline?: boolean;
  registrationUrl?: string;
  coverImage?: string; // "/uploads/images/..."
  highlight?: boolean;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  eventType?: string;
  upcoming?: 'true' | 'false';
  highlight?: 'true' | 'false';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}


