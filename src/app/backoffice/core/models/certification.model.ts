export type CertificationType = 'RNCP' | 'RS' | 'Other';

export interface Certification {
  id: string;
  type: CertificationType;
  code: string;
  title: string;
  level?: string;          // e.g., "Niveau 6"
  status?: 'active' | 'inactive';  // Aligné avec le backend
  issuer?: string;         // e.g., "France Compétences"
  description?: string;
}

