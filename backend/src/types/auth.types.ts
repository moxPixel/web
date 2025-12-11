import { UserRole, UserStatus } from '../models/User';

export interface RegisterDto {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole; // individual, company, trainer, candidate
  // Propriétés spécifiques Individual
  dateOfBirth?: string; // ISO date string
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  // Propriétés spécifiques Company
  siret?: string;
  companyName?: string;
  legalForm?: string;
  website?: string;
  numberOfEmployees?: number;
  // Propriétés spécifiques Trainer
  trainerSiret?: string;
  specialties?: string[];
  certifications?: string[];
  yearsOfExperience?: number;
  bio?: string;
  // Propriétés spécifiques Candidate
  educationLevel?: string;
  cv?: string;
  coverLetter?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    status: UserStatus;
    profile?: Record<string, unknown>; // Profile data (individual, company, trainer, candidate)
  };
  token: string;
  refreshToken?: string;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  // Pour Individual
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  // Pour Company
  siret?: string;
  companyName?: string;
  legalForm?: string;
  website?: string;
  numberOfEmployees?: number;
  // Pour Trainer
  trainerSiret?: string;
  specialties?: string[];
  certifications?: string[];
  yearsOfExperience?: number;
  bio?: string;
  // Pour Candidate
  educationLevel?: string;
  cv?: string;
  coverLetter?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
