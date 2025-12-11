import { Training } from './training-api.interface';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface TrainingSession {
  id: string;
  trainingId: string;
  startDate: string;
  endDate: string;
  location?: string;
  seats?: number;
  seatsAvailable?: number;
  price?: number;
  status: SessionStatus;
  highlight: boolean;
  training?: Training;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  trainingId: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string;
  seats?: number;
  seatsAvailable?: number;
  price?: number;
  status?: SessionStatus;
  highlight?: boolean;
}

export interface UpdateSessionDto extends Partial<CreateSessionDto> {}

export interface SessionQueryParams {
  page?: number;
  limit?: number;
  trainingId?: string;
  status?: SessionStatus;
  highlight?: boolean;
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

