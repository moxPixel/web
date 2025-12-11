import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TrainingsService } from '../../core/services/trainings.service';
import { Training, TrainingLevel, TrainingType, AudienceType } from '../../core/models/training.model';
import { UploadApiService } from '../../../services/api/upload-api.service';

type TrainingLevelFilter = 'all' | TrainingLevel;
type TrainingTypeFilter = 'all' | TrainingType;
type AudienceTypeFilter = 'all' | AudienceType;

@Component({
  selector: 'app-training-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatRippleModule, MatIconModule, MatButtonModule],
  templateUrl: './training-list.component.html',
  styleUrls: ['./training-list.component.css']
})
export class TrainingListComponent implements OnInit {
  private trainingsService = inject(TrainingsService);
  private router = inject(Router);
  private uploadService = inject(UploadApiService);

  trainings = signal<Training[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedLevel: TrainingLevelFilter = 'all';
  selectedTrainingType: TrainingTypeFilter = 'all';
  selectedAudienceType: AudienceTypeFilter = 'all';

  // Structures de données pour les filtres
  levelFilters = [
    { value: 'initiation' as TrainingLevelFilter, label: '#Init.' },
    { value: 'intermediaire' as TrainingLevelFilter, label: '#Inter.' },
    { value: 'avance' as TrainingLevelFilter, label: '#Avancé' },
    { value: 'expert' as TrainingLevelFilter, label: '#Expert' }
  ];

  trainingTypeFilters = [
    { value: 'bootcamp' as TrainingTypeFilter, label: '#Bootcamp' },
    { value: 'alternance' as TrainingTypeFilter, label: '#Alternance' },
    { value: 'diplomante' as TrainingTypeFilter, label: '#Dipl.' },
    { value: 'certifiante' as TrainingTypeFilter, label: '#Cert.' }
  ];

  audienceTypeFilters = [
    { value: 'entreprise' as AudienceTypeFilter, label: '#Entreprise' },
    { value: 'monter-en-competence' as AudienceTypeFilter, label: '#Compétence' },
    { value: 'reconversion' as AudienceTypeFilter, label: '#Reconversion' }
  ];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.trainings().filter(t => {
      const matchesSearch =
        !term ||
        t.title.toLowerCase().includes(term) ||
        t.slug.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (this.selectedLevel !== 'all' && t.level !== this.selectedLevel) return false;
      if (this.selectedTrainingType !== 'all' && t.trainingType !== this.selectedTrainingType) return false;
      if (this.selectedAudienceType !== 'all' && t.audienceType !== this.selectedAudienceType) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.loadTrainings();
  }

  loadTrainings(): void {
    this.loading.set(true);
    this.trainingsService.getAll().subscribe({
      next: (data) => {
        this.trainings.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading trainings:', error);
        this.loading.set(false);
        alert('Erreur lors du chargement des formations');
      },
    });
  }

  create(): void {
    this.router.navigate(['/bo/trainings/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/bo/trainings', id, 'edit']);
  }

  delete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      this.loading.set(true);
      this.trainingsService.delete(id).subscribe({
        next: () => {
          // Recharger la liste après suppression
          this.loadTrainings();
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error deleting training:', error);
          const message = error.message || 'Erreur lors de la suppression de la formation';
          alert(message);
        },
      });
    }
  }

  setLevelFilter(value: TrainingLevelFilter): void {
    this.selectedLevel = this.selectedLevel === value ? 'all' : value;
  }

  setTrainingTypeFilter(value: TrainingTypeFilter): void {
    this.selectedTrainingType = this.selectedTrainingType === value ? 'all' : value;
  }

  setAudienceTypeFilter(value: AudienceTypeFilter): void {
    this.selectedAudienceType = this.selectedAudienceType === value ? 'all' : value;
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedLevel = 'all';
    this.selectedTrainingType = 'all';
    this.selectedAudienceType = 'all';
  }

  /**
   * Obtenir l'URL complète de l'image pour l'affichage
   * Convertit les chemins relatifs en URLs absolues pointant vers le backend
   */
  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return '/assets/images/img/p1.jpg'; // Image par défaut
    }
    return this.uploadService.getImageUrlFromPath(imagePath);
  }
}
