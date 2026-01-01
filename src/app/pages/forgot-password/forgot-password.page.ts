import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { AuthApiService } from '../../services/api/auth-api.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';
import { NotificationService } from '../../shared/services/notifications/notification.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TablerIconComponent, UiButtonDirective, UiInputDirective],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.css'
})
export class ForgotPasswordPage implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly notifications = inject(NotificationService);

  email = '';
  loading = false;

  ngOnInit(): void {
    // TODO: Add SEO service when available
    // TODO: Add auth service when available
  }

  onSubmit(): void {
    if (this.loading) return;
    if (!this.email) {
      this.notifications.warning('Email requis', 'Veuillez renseigner votre email.');
      return;
    }

    this.loading = true;

    this.authApi.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.exists) {
          this.notifications.error('Compte introuvable', "Aucun compte n'existe avec cet email.");
          return;
        }
        this.notifications.success('Lien envoyé', 'Un lien de réinitialisation a été envoyé par email.');
      },
      error: (err: Error) => {
        this.loading = false;
        this.notifications.error('Erreur', err.message || 'Erreur lors de la demande.');
      },
    });
  }
}

