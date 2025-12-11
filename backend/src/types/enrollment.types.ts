import { EnrollmentStatus, EnrollmentRole } from '../models/TrainingEnrollment';

export interface CreateEnrollmentDto {
  trainingId: string;
  sessionId?: string | null;
  role: EnrollmentRole;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  siret?: string;
  teamSize?: string;
  message?: string;
  preferredFormat?: string;
  desiredDate?: string | null;
  objectives?: string;
}

export interface UpdateEnrollmentStatusDto {
  status: EnrollmentStatus;
  adminNote?: string;
}

export interface EnrollmentQueryParams {
  status?: EnrollmentStatus;
  trainingId?: string;
  sessionId?: string;
  role?: EnrollmentRole;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

