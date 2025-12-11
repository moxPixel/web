import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TrainingEnrollmentsApiService } from '../../../services/api/training-enrollments-api.service';
import { Router } from '@angular/router';

interface EnrollmentView {
  id: string;
  email: string;
  name: string;
  role: string;
  training: string;
  session?: string;
  status: string;
  createdAt?: string;
}

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule],
  templateUrl: './enrollment-list.component.html',
  styleUrls: ['./enrollment-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentListComponent implements OnInit {
  private api = inject(TrainingEnrollmentsApiService);
  private router = inject(Router);

  enrollments = signal<EnrollmentView[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (rows: any[]) => {
        const mapped = (rows || []).map((r) => ({
          id: r.id,
          email: r.email,
          name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
          role: r.role,
          training: r.training?.shortTitle || r.training?.title || '',
          session: r.session?.startDate,
          status: r.status,
          createdAt: r.createdAt,
        }));
        this.enrollments.set(mapped);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Erreur lors du chargement des demandes');
        this.loading.set(false);
      }
    });
  }

  open(id: string): void {
    this.router.navigate(['/bo/enrollments', id]);
  }
}

