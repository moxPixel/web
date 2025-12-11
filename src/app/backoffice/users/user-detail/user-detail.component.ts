import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EmailDialogComponent, EmailDialogPayload } from '../../../shared/components/email-dialog/email-dialog.component';
import { MailApiService } from '../../../services/api/mail-api.service';
import { AuthApiService } from '../../../services/api/auth-api.service';
import { User, UserStatus, UserRole } from '../../../interfaces/auth.interface';
import { TrainingEnrollmentsApiService } from '../../../services/api/training-enrollments-api.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatRippleModule, MatIconModule, MatButtonModule, EmailDialogComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css'
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router); // Public pour le template
  private authService = inject(AuthApiService);
  private enrollmentsApi = inject(TrainingEnrollmentsApiService);
  private notify = inject(NotificationService);
  private mailApi = inject(MailApiService);

  user = signal<User | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  enrollments = signal<any[]>([]);
  enrollmentsLoading = signal(false);
  emailDialogOpen = signal(false);
  emailSending = signal(false);

  // Exposer les enums pour le template
  UserStatus = UserStatus;
  UserRole = UserRole;

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(userId);
    } else {
      this.error.set('ID utilisateur manquant');
      this.loading.set(false);
    }
  }

  loadUser(userId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.authService.getUserById(userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.loadEnrollments(user.email);
      },
      error: (err) => {
        this.error.set(err.message || 'Erreur lors du chargement de l\'utilisateur');
        this.loading.set(false);
      },
    });
  }

  loadEnrollments(email: string): void {
    if (!email) return;
    this.enrollmentsLoading.set(true);
    this.enrollmentsApi.list({ userId: this.user()?.id }).subscribe({
      next: (rows) => {
        this.enrollments.set(rows || []);
        this.enrollmentsLoading.set(false);
      },
      error: () => {
        this.enrollmentsLoading.set(false);
      }
    });
  }

  updateStatus(status: UserStatus): void {
    const user = this.user();
    if (!user) return;

    const action = status === UserStatus.ACTIVE ? 'activer' : 
                   status === UserStatus.SUSPENDED ? 'suspendre' : 
                   status === UserStatus.INACTIVE ? 'désactiver' : 'modifier';

    if (!confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
      return;
    }

    this.authService.updateUserStatus(user.id, { status }).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.notify.success('Statut mis à jour', this.getStatusLabel(status));
      },
      error: (err) => {
        this.notify.error('Erreur', err.message || 'Erreur lors de la mise à jour');
      },
    });
  }

  deleteUser(): void {
    const user = this.user();
    if (!user) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    this.authService.deleteUser(user.id).subscribe({
      next: () => {
        this.notify.success('Utilisateur supprimé', `${user.email}`);
        this.router.navigate(['/bo/users']);
      },
      error: (err) => {
        this.notify.error('Erreur', err.message || 'Erreur lors de la suppression');
      },
    });
  }

  getStatusBadgeClass(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'badge badge-green';
      case UserStatus.PENDING:
        return 'badge badge-yellow';
      case UserStatus.INACTIVE:
        return 'badge badge-gray';
      case UserStatus.SUSPENDED:
        return 'badge badge-red';
      default:
        return 'badge badge-gray';
    }
  }

  getStatusLabel(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Actif';
      case UserStatus.PENDING:
        return 'En attente';
      case UserStatus.INACTIVE:
        return 'Inactif';
      case UserStatus.SUSPENDED:
        return 'Suspendu';
      default:
        return status;
    }
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.USER]: 'Utilisateur',
      [UserRole.ADMIN]: 'Administrateur',
      [UserRole.INDIVIDUAL]: 'Particulier',
      [UserRole.COMPANY]: 'Entreprise',
      [UserRole.TRAINER]: 'Formateur',
      [UserRole.CANDIDATE]: 'Candidat',
    };
    return labels[role] || role;
  }

  getProfileData(): any {
    const user = this.user();
    return user?.profile || null;
  }

  openEmail(): void {
    if (!this.user()) return;
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
}

