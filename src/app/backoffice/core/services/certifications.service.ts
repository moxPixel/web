import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { Certification, CertificationType } from '../models/certification.model';
import { CertificationsApiService } from '../../../services/api/certifications-api.service';
import { CreateCertificationDto, UpdateCertificationDto, CertificationQueryParams } from '../../../interfaces/certification-api.interface';

/**
 * Service backoffice pour les certifications
 * Utilise le service API pour communiquer avec le backend
 */
@Injectable({ providedIn: 'root' })
export class CertificationsService {
  private apiService = inject(CertificationsApiService);

  /**
   * Convertir une Certification API en Certification modèle
   */
  private mapApiToModel(apiCert: any): Certification {
    return {
      ...apiCert,
      type: this.mapTypeToCertificationType(apiCert.type),
      status: apiCert.status || 'active',
    };
  }

  /**
   * Convertir un string en CertificationType
   */
  private mapTypeToCertificationType(type: string): CertificationType {
    if (type === 'RNCP' || type === 'RS' || type === 'Other') {
      return type as CertificationType;
    }
    // Par défaut, retourner 'Other' si le type n'est pas reconnu
    return 'Other';
  }

  /**
   * Récupérer toutes les certifications
   */
  getAll(query?: CertificationQueryParams): Observable<Certification[]> {
    return this.apiService.findAll(query).pipe(
      map((response) => (response.data || []).map(cert => this.mapApiToModel(cert)))
    );
  }

  /**
   * Récupérer une certification par ID
   */
  getById(id: string): Observable<Certification | undefined> {
    return this.apiService.findById(id).pipe(
      map((certification) => this.mapApiToModel(certification)),
      catchError(() => of(undefined))
    );
  }

  /**
   * Créer une nouvelle certification
   */
  create(payload: Partial<Certification>): Observable<Certification> {
    const dto: CreateCertificationDto = {
      type: payload.type || '',
      code: payload.code || '',
      title: payload.title || '',
      level: payload.level,
      status: (payload.status as 'active' | 'inactive') || 'active',
      issuer: payload.issuer,
      description: payload.description,
    };
    return this.apiService.create(dto).pipe(
      map((certification) => this.mapApiToModel(certification))
    );
  }

  /**
   * Mettre à jour une certification
   */
  update(id: string, payload: Partial<Certification>): Observable<Certification> {
    const dto: UpdateCertificationDto = {
      type: payload.type,
      code: payload.code,
      title: payload.title,
      level: payload.level,
      status: payload.status as 'active' | 'inactive' | undefined,
      issuer: payload.issuer,
      description: payload.description,
    };
    return this.apiService.update(id, dto).pipe(
      map((certification) => this.mapApiToModel(certification))
    );
  }

  /**
   * Supprimer une certification
   */
  delete(id: string): Observable<void> {
    return this.apiService.delete(id);
  }
}

