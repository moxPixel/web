import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Training } from '../models/training.model';
import { TrainingModule } from '../models/training-module.model';
import { TrainingsApiService } from '../../../services/api/trainings-api.service';
import { Training as ApiTraining, CreateTrainingDto, UpdateTrainingDto, TrainingQueryParams, TrainingModule as ApiTrainingModule } from '../../../interfaces/training-api.interface';

/**
 * Service backoffice pour les formations
 * Utilise le service API pour communiquer avec le backend
 */
@Injectable({ providedIn: 'root' })
export class TrainingsService {
  private apiService = inject(TrainingsApiService);

  /**
   * Convertir une Training API en Training modèle
   */
  private mapApiToModel(apiTraining: ApiTraining): Training {
    return {
      id: apiTraining.id,
      slug: apiTraining.slug,
      title: apiTraining.title,
      shortTitle: apiTraining.shortTitle,
      tagline: apiTraining.tagline || '',
      description: apiTraining.description, // Ajouté
      category: apiTraining.category || '',
      certificationId: undefined, // Non fourni par l'API pour l'instant
      level: apiTraining.level as Training['level'],
      format: apiTraining.format || '',
      trainingType: apiTraining.trainingType as Training['trainingType'],
      audienceType: apiTraining.audienceType as Training['audienceType'],
      priceFrom: apiTraining.priceFrom || 0,
      currency: apiTraining.currency || 'EUR',
      locationTypes: apiTraining.locationTypes?.map(l => l as string) || [],
      pace: apiTraining.pace,
      durationDays: apiTraining.durationDays, // Ajouté
      durationHours: apiTraining.durationHours, // Ajouté
      durationLabel: apiTraining.durationLabel,
      nextSessionHighlight: apiTraining.nextSessionHighlight,
      objectives: apiTraining.objectives || [],
      targetAudience: apiTraining.targetAudience || [],
      prerequisites: apiTraining.prerequisites || [],
      outcomes: apiTraining.outcomes || [],
      fundingOptions: [], // Non fourni par l'API pour l'instant
      program: this.mapModulesToProgram(apiTraining.modules || []),
      heroImage: apiTraining.heroImage,
      watermarkLogo: apiTraining.watermarkLogo,
      status: apiTraining.status, // CORRIGÉ : maintenant mappé depuis l'API
    };
  }

  /**
   * Convertir les modules API en program (TrainingModule[])
   */
  private mapModulesToProgram(apiModules: ApiTrainingModule[]): TrainingModule[] {
    return apiModules.map(module => ({
      id: module.id,
      title: module.title,
      durationHours: module.durationHours,
      topics: module.topics || [],
    }));
  }

  /**
   * Récupérer toutes les formations
   */
  getAll(query?: TrainingQueryParams): Observable<Training[]> {
    return this.apiService.findAll(query).pipe(
      map((response) => (response.data || []).map(training => this.mapApiToModel(training)))
    );
  }

  /**
   * Récupérer une formation par ID
   */
  getById(id: string): Observable<Training | undefined> {
    return this.apiService.findById(id).pipe(
      map((training) => this.mapApiToModel(training))
    );
  }

  /**
   * Créer une nouvelle formation
   */
  create(payload: Partial<Training>): Observable<Training> {
    const dto: CreateTrainingDto = this.mapToCreateDto(payload);
    return this.apiService.create(dto).pipe(
      map((training) => this.mapApiToModel(training))
    );
  }

  /**
   * Mettre à jour une formation
   */
  update(id: string, payload: Partial<Training>): Observable<Training> {
    const dto: UpdateTrainingDto = this.mapToUpdateDto(payload);
    return this.apiService.update(id, dto).pipe(
      map((training) => this.mapApiToModel(training))
    );
  }

  /**
   * Supprimer une formation
   */
  delete(id: string): Observable<void> {
    return this.apiService.delete(id);
  }

  /**
   * Mapper Training vers CreateTrainingDto
   */
  private mapToCreateDto(training: Partial<Training>): CreateTrainingDto {
    // Convertir program (TrainingModule[]) en modules pour l'API
    const modules = training.program?.map((module, index) => ({
      title: module.title,
      durationHours: module.durationHours,
      topics: module.topics,
      order: index,
    }));

    return {
      title: training.title || '',
      shortTitle: training.shortTitle || '',
      slug: training.slug || '',
      category: training.category,
      level: training.level as any,
      trainingType: training.trainingType as any,
      audienceType: training.audienceType as any,
      tagline: training.tagline,
      description: training.description, // Ajouté
      objectives: training.objectives,
      targetAudience: training.targetAudience,
      prerequisites: training.prerequisites,
      outcomes: training.outcomes,
      format: training.format,
      durationDays: training.durationDays, // Ajouté
      durationHours: training.durationHours, // Ajouté
      durationLabel: training.durationLabel,
      pace: training.pace,
      locationTypes: training.locationTypes as any,
      priceFrom: training.priceFrom,
      currency: training.currency,
      nextSessionHighlight: training.nextSessionHighlight,
      heroImage: training.heroImage,
      watermarkLogo: training.watermarkLogo,
      status: training.status || 'draft', // CORRIGÉ : utilise la valeur du formulaire au lieu de forcer 'published'
      modules, // Inclure les modules convertis
    };
  }

  /**
   * Mapper Training vers UpdateTrainingDto
   */
  private mapToUpdateDto(training: Partial<Training>): UpdateTrainingDto {
    return this.mapToCreateDto(training);
  }
}

