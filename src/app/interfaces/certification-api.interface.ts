export type CertificationStatus = 'active' | 'inactive';
export type CertificationType = 'RNCP' | 'RS' | 'Other' | (string & {});

export interface CertificationApi {
  id: string;
  type: CertificationType;
  code: string;
  title: string;
  level?: string;
  status: CertificationStatus;
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
  status?: CertificationStatus;
  issuer?: string;
  description?: string;
}

export interface UpdateCertificationDto extends Partial<CreateCertificationDto> {}

export interface CertificationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CertificationStatus;
  type?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}


