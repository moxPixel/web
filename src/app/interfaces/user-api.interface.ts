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

export type UserApi = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole | string;
  status: UserStatus | string;
  emailVerified?: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: unknown;
};

export type UserQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
};

export type CreateUserDto = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
};

export type UpdateUserStatusDto = {
  status: string;
};


