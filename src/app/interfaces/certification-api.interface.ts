export interface Certification {
  id: string;
  type: string;
  code: string;
  title: string;
  level?: string;
  status: 'active' | 'inactive';
  issuer?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificationDto {
  type: string;
  code: string;
  title: string;
  level?: string;
  status?: 'active' | 'inactive';
  issuer?: string;
  description?: string;
}

export interface UpdateCertificationDto extends Partial<CreateCertificationDto> {}

export interface CertificationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

