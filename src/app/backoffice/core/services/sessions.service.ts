import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { TrainingSession, SessionLocationType, SessionStatus } from '../models/session.model';
import { SessionsApiService } from '../../../services/api/sessions-api.service';
import { CreateSessionDto, UpdateSessionDto, TrainingSession as ApiTrainingSession, SessionQueryParams } from '../../../interfaces/session-api.interface';

/**
 * Service backoffice pour les sessions
 * Utilise le service API pour communiquer avec le backend
 */
@Injectable({ providedIn: 'root' })
export class SessionsService {
  private apiService = inject(SessionsApiService);

  /**
   * Convertir une Session API en Session modèle
   */
  private mapApiToModel(apiSession: ApiTrainingSession): TrainingSession {
    // Déterminer locationType à partir de location
    const getLocationType = (location?: string): SessionLocationType => {
      if (!location) return 'distanciel';
      // Si location contient des indices de présentiel/hybride
      if (location.toLowerCase().includes('hybride')) return 'hybride';
      if (location.toLowerCase().includes('présentiel') || location.toLowerCase().includes('presentiel')) return 'presentiel';
      // Par défaut, si location existe, considérer comme présentiel
      return 'presentiel';
    };

    // Convertir le status de l'API vers le status du modèle
    const mapStatus = (apiStatus: string): SessionStatus | undefined => {
      switch (apiStatus) {
        case 'scheduled':
          return 'upcoming';
        case 'in_progress':
          return 'open';
        case 'completed':
        case 'cancelled':
          return 'closed';
        default:
          return undefined;
      }
    };

    return {
      id: apiSession.id,
      trainingId: apiSession.trainingId,
      startDate: apiSession.startDate,
      endDate: apiSession.endDate,
      locationType: getLocationType(apiSession.location),
      locationLabel: apiSession.location,
      seats: apiSession.seats,
      price: apiSession.price,
      currency: 'EUR', // Par défaut, peut être ajusté selon les besoins
      status: mapStatus(apiSession.status),
      highlight: apiSession.highlight ? 'Oui' : undefined,
    };
  }

  /**
   * Récupérer toutes les sessions
   */
  getAll(query?: SessionQueryParams): Observable<TrainingSession[]> {
    return this.apiService.findAll(query).pipe(
      map((response) => (response.data || []).map(session => this.mapApiToModel(session)))
    );
  }

  /**
   * Récupérer une session par ID
   */
  getById(id: string): Observable<TrainingSession | undefined> {
    return this.apiService.findById(id).pipe(
      map((session) => this.mapApiToModel(session)),
      catchError(() => of(undefined))
    );
  }

  /**
   * Créer une nouvelle session
   */
  create(payload: Partial<TrainingSession>): Observable<TrainingSession> {
    // Convertir locationType en location string
    const getLocationFromType = (locationType?: SessionLocationType, locationLabel?: string): string | undefined => {
      if (!locationType) return undefined;
      if (locationType === 'distanciel') return undefined;
      return locationLabel || (locationType === 'presentiel' ? 'Présentiel' : 'Hybride');
    };

    // Convertir le status du modèle vers le status de l'API
    const mapStatusToApi = (status?: SessionStatus): string | undefined => {
      switch (status) {
        case 'upcoming':
          return 'scheduled';
        case 'open':
          return 'in_progress';
        case 'closed':
        case 'full':
          return 'completed';
        default:
          return undefined;
      }
    };

    const dto: CreateSessionDto = {
      trainingId: payload.trainingId || '',
      startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
      endDate: payload.endDate ? new Date(payload.endDate) : new Date(),
      location: getLocationFromType(payload.locationType, payload.locationLabel),
      seats: payload.seats,
      seatsAvailable: payload.seats,
      price: payload.price,
      status: mapStatusToApi(payload.status) as any,
      highlight: !!payload.highlight,
    };
    return this.apiService.create(dto).pipe(
      map((session) => this.mapApiToModel(session))
    );
  }

  /**
   * Mettre à jour une session
   */
  update(id: string, payload: Partial<TrainingSession>): Observable<TrainingSession> {
    // Convertir locationType en location string
    const getLocationFromType = (locationType?: SessionLocationType, locationLabel?: string): string | undefined => {
      if (!locationType) return undefined;
      if (locationType === 'distanciel') return undefined;
      return locationLabel || (locationType === 'presentiel' ? 'Présentiel' : 'Hybride');
    };

    // Convertir le status du modèle vers le status de l'API
    const mapStatusToApi = (status?: SessionStatus): string | undefined => {
      switch (status) {
        case 'upcoming':
          return 'scheduled';
        case 'open':
          return 'in_progress';
        case 'closed':
        case 'full':
          return 'completed';
        default:
          return undefined;
      }
    };

    const dto: UpdateSessionDto = {
      trainingId: payload.trainingId,
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      location: getLocationFromType(payload.locationType, payload.locationLabel),
      seats: payload.seats,
      seatsAvailable: payload.seats,
      price: payload.price,
      status: mapStatusToApi(payload.status) as any,
      highlight: payload.highlight ? true : undefined,
    };
    return this.apiService.update(id, dto).pipe(
      map((session) => this.mapApiToModel(session))
    );
  }

  /**
   * Supprimer une session
   */
  delete(id: string): Observable<void> {
    return this.apiService.delete(id);
  }
}

