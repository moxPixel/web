export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  TRAINER = 'trainer',
  CANDIDATE = 'candidate',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface IndividualProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id: string;
  userId: string;
  siret: string;
  companyName: string;
  legalForm?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  website?: string;
  numberOfEmployees?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerProfile {
  id: string;
  userId: string;
  siret?: string;
  specialties?: string[];
  certifications?: string[];
  yearsOfExperience?: number;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  educationLevel?: string;
  cv?: string;
  coverLetter?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserProfile = IndividualProfile | CompanyProfile | TrainerProfile | CandidateProfile | null;

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLogin?: string;
  profile?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole; // individual, company, trainer, candidate
  // Propriétés spécifiques Individual
  dateOfBirth?: string;
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
  user: User;
  profile?: UserProfile;
  token: string;
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

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}
