import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TrainingEnrollmentsApiService } from '../../../services/api/training-enrollments-api.service';
import { EmailDialogComponent, EmailDialogPayload } from '../../../shared/components/email-dialog/email-dialog.component';
import { MailApiService } from '../../../services/api/mail-api.service';
import { NotificationService } from '../../../services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-enrollment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule, FormsModule, EmailDialogComponent],
  templateUrl: './enrollment-detail.component.html',
  styleUrls: ['./enrollment-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(TrainingEnrollmentsApiService);
  private mailApi = inject(MailApiService);
  private notify = inject(NotificationService);

  loading = signal(false);
  error = signal<string | null>(null);
  enrollment = signal<any | null>(null);
  statusUpdating = signal(false);
  statusValue = signal<string>('submitted');
  readonly statusSteps = [
    { value: 'submitted', label: 'Soumise', icon: 'outgoing_mail' },
    { value: 'in_review', label: 'En revue', icon: 'search' },
    { value: 'accepted', label: 'Acceptée', icon: 'check_circle' }
  ];
  readonly terminalStatuses = ['rejected', 'cancelled'] as const;
  emailDialogOpen = signal(false);
  emailSending = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID manquant');
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getById(id).subscribe({
      next: (data) => {
        this.enrollment.set(data);
        this.statusValue.set(data.status);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Erreur lors du chargement');
        this.loading.set(false);
      },
    });
  }

  getStepState(stepValue: string): 'done' | 'current' | 'pending' | 'stopped' {
    const current = this.statusValue();
    const stepIndex = this.statusSteps.findIndex(s => s.value === stepValue);
    const currentIndex = this.statusSteps.findIndex(s => s.value === current);

    if (this.terminalStatuses.includes(current as any)) {
      // Arrêté en cours de route
      return stepIndex <= 1 ? 'done' : 'stopped';
    }

    if (currentIndex === -1) return 'pending';
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }

  isTerminal(status: string): boolean {
    return this.terminalStatuses.includes(status as any);
  }

  setStatus(value: string): void {
    this.statusValue.set(value);
  }

  openEmail(): void {
    if (!this.enrollment()) return;
    this.emailDialogOpen.set(true);
  }

  onSendEmail(payload: EmailDialogPayload): void {
    this.emailSending.set(true);
    this.mailApi
      .send({
        to: payload.to,
        cc: payload.cc,
        subject: payload.subject,
        message: payload.message,
      })
      .subscribe({
        next: () => {
          this.emailSending.set(false);
          this.emailDialogOpen.set(false);
          this.notify.success('Email envoyé', `À ${payload.to}`);
        },
        error: (err) => {
          this.emailSending.set(false);
          this.notify.error('Erreur', err?.message || 'Erreur lors de l’envoi du mail');
        }
      });
  }

  updateStatus(): void {
    const e = this.enrollment();
    if (!e) return;
    this.statusUpdating.set(true);
    this.api.updateStatus(e.id, this.statusValue()).subscribe({
      next: () => {
        this.load(e.id);
        this.statusUpdating.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Erreur lors de la mise à jour');
        this.statusUpdating.set(false);
      }
    });
  }
}

