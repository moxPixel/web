import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SessionsService } from '../../core/services/sessions.service';
import { TrainingsService } from '../../core/services/trainings.service';
import { TrainingSession } from '../../core/models/session.model';
import { Training } from '../../core/models/training.model';
import { SessionStatus } from '../../../interfaces/session-api.interface';

type StatusFilter = 'all' | SessionStatus;

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatRippleModule, MatIconModule, MatButtonModule],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.css']
})
export class SessionListComponent implements OnInit {
  private sessionsService = inject(SessionsService);
  private trainingsService = inject(TrainingsService);
  private router = inject(Router);

  sessions = signal<TrainingSession[]>([]);
  trainings = signal<Training[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedTrainingId: string | 'all' = 'all';
  selectedStatus: StatusFilter = 'all';

  // Structures de données pour les filtres
  statusFilters = [
    { value: 'all' as StatusFilter, label: 'Toutes' },
    { value: SessionStatus.SCHEDULED, label: 'Programmées' },
    { value: SessionStatus.IN_PROGRESS, label: 'En cours' },
    { value: SessionStatus.COMPLETED, label: 'Terminées' },
    { value: SessionStatus.CANCELLED, label: 'Annulées' },
  ];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.sessions().filter(s => {
      const training = this.trainings().find(t => t.id === s.trainingId);
      const matchesSearch =
        !term ||
        training?.title.toLowerCase().includes(term) ||
        training?.slug.toLowerCase().includes(term) ||
        s.locationLabel?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (this.selectedTrainingId !== 'all' && s.trainingId !== this.selectedTrainingId) return false;
      // Note: Le statut dans le modèle frontend est différent du statut API
      // On filtre par trainingId principalement
      return true;
    });
  });

  ngOnInit(): void {
    this.loadTrainings();
    this.loadSessions();
  }

  loadTrainings(): void {
    this.trainingsService.getAll().subscribe({
      next: (data) => {
        this.trainings.set(data);
      },
      error: (error) => {
        console.error('Error loading trainings:', error);
      },
    });
  }

  loadSessions(): void {
    this.loading.set(true);
    const query: any = {};
    if (this.selectedTrainingId !== 'all') {
      query.trainingId = this.selectedTrainingId;
    }
    if (this.selectedStatus !== 'all') {
      query.status = this.selectedStatus;
    }

    this.sessionsService.getAll(query).subscribe({
      next: (data) => {
        this.sessions.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.loading.set(false);
        alert('Erreur lors du chargement des sessions');
      },
    });
  }

  create(): void {
    this.router.navigate(['/bo/sessions/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/bo/sessions', id, 'edit']);
  }

  delete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      this.loading.set(true);
      this.sessionsService.delete(id).subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (error) => {
          console.error('Error deleting session:', error);
          this.loading.set(false);
          alert('Erreur lors de la suppression de la session');
        },
      });
    }
  }

  setTrainingFilter(value: string | 'all'): void {
    this.selectedTrainingId = value;
    this.loadSessions();
  }

  setStatusFilter(value: StatusFilter): void {
    this.selectedStatus = value;
    this.loadSessions();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedTrainingId = 'all';
    this.selectedStatus = 'all';
    this.loadSessions();
  }

  getTrainingTitle(trainingId: string): string {
    const training = this.trainings().find(t => t.id === trainingId);
    return training?.title || trainingId;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusBadgeClass(status?: string): string {
    // Mapper le statut API vers les classes de badge
    switch (status) {
      case 'scheduled':
      case 'upcoming':
        return 'badge badge-green';
      case 'in_progress':
      case 'open':
        return 'badge badge-yellow';
      case 'completed':
      case 'closed':
        return 'badge badge-gray';
      case 'cancelled':
        return 'badge badge-red';
      default:
        return 'badge badge-gray';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'scheduled':
      case 'upcoming':
        return 'Programmée';
      case 'in_progress':
      case 'open':
        return 'En cours';
      case 'completed':
      case 'closed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Inconnu';
    }
  }
}
