import { TrainingSessionApi } from './training-api.interface';

export type SessionStatus = TrainingSessionApi['status'];

export type SessionQueryParams = {
  page?: number;
  limit?: number;
  trainingId?: string;
  status?: SessionStatus;
  highlight?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
};

export type CreateSessionDto = {
  trainingId: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string;
  seats?: number;
  seatsAvailable?: number;
  price?: number;
  status?: SessionStatus;
  highlight?: boolean;
};

export type UpdateSessionDto = Partial<CreateSessionDto>;


