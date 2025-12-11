import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { TrainingEnrollmentsApiService } from '../../../services/api/training-enrollments-api.service';
import { NotificationService } from '../../../services/notification.service';

interface EnrollmentItem {
  id: string;
  training?: { title?: string; shortTitle?: string; slug?: string };
  session?: { startDate?: string; endDate?: string };
  status: string;
  createdAt?: string;
  role?: string;
}

@Component({
  selector: 'app-user-enrollments',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule, MatButtonModule],
  templateUrl: './user-enrollments.component.html'
})
export class UserEnrollmentsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  enrollments: EnrollmentItem[] = [];

  statusLabels: Record<string, string> = {
    submitted: 'Soumise',
    in_review: 'En revue',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    cancelled: 'Annulée',
  };

  readonly statusSteps = [
    { value: 'submitted', label: 'Soumise', icon: 'outgoing_mail' },
    { value: 'in_review', label: 'En revue', icon: 'search' },
    { value: 'accepted', label: 'Acceptée', icon: 'check_circle' }
  ];

  readonly terminalStatuses = ['rejected', 'cancelled'] as const;

  constructor(
    private enrollmentsApi: TrainingEnrollmentsApiService,
    private notify: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetch();
  }

  viewTraining(slug?: string): void {
    if (slug) {
      this.router.navigate(['/trainings', slug]);
    }
  }

  fetch(): void {
    this.loading = true;
    this.error = null;
    this.enrollmentsApi.listMine().subscribe({
      next: (data) => {
        this.enrollments = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const message = err?.message || 'Erreur lors du chargement des demandes';
        this.error = message;
        this.notify.error('Erreur', message);
      }
    });
  }

  formatDate(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700';
      case 'in_review':
        return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700';
    }
  }

  getStepState(stepValue: string, currentStatus: string): 'done' | 'current' | 'pending' | 'stopped' {
    const stepIndex = this.statusSteps.findIndex(s => s.value === stepValue);
    const currentIndex = this.statusSteps.findIndex(s => s.value === currentStatus);

    if (this.terminalStatuses.includes(currentStatus as any)) {
      // Arrêté en cours de route
      return stepIndex <= 1 ? 'done' : 'stopped';
    }

    if (currentIndex === -1) return 'pending';
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }
}

