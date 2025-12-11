export enum ContactType {
  PARTICULIER = 'particulier',
  ENTREPRISE = 'entreprise',
  AUTRE = 'autre',
}

export enum RequestType {
  FORMATION = 'formation',
  DEVIS = 'devis',
  INFORMATION = 'information',
  AUTRE = 'autre',
}

export enum SubjectCategory {
  TECHNIQUE = 'technique',
  COMMERCIAL = 'commercial',
  PEDAGOGIQUE = 'pedagogique',
  AUTRE = 'autre',
}

export enum ContactStatus {
  PENDING = 'pending', // Demande en attente
  IN_PROGRESS = 'in_progress', // En cours de traitement
  RESPONDED = 'responded', // Répondu
  ARCHIVED = 'archived', // Archivé
}

export interface Contact {
  id: string;
  contactType: ContactType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  requestType: RequestType;
  subjectCategory: SubjectCategory;
  message: string;
  consent: boolean;
  status: ContactStatus;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  responder?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactDto {
  contactType: ContactType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  requestType: RequestType;
  subjectCategory: SubjectCategory;
  message: string;
  consent: boolean;
}

export interface UpdateContactDto {
  status?: ContactStatus;
  response?: string;
}

export interface ContactQueryParams {
  page?: number;
  limit?: number;
  status?: ContactStatus;
  contactType?: ContactType;
  requestType?: RequestType;
  search?: string;
}

