import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { AuthApiService } from '../../services/api/auth-api.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';
import { NotificationService } from '../../shared/services/notifications/notification.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TablerIconComponent, UiButtonDirective, UiInputDirective],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.css'
})
export class ResetPasswordPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);
  private readonly notifications = inject(NotificationService);

  token = '';
  password = '';
  confirmPassword = '';
  loading = false;

  // Password validation
  get passwordValidation() {
    return {
      minLength: this.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(this.password),
      hasLowerCase: /[a-z]/.test(this.password),
      hasNumber: /[0-9]/.test(this.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(this.password),
      passwordsMatch: this.password === this.confirmPassword && this.confirmPassword.length > 0,
    };
  }

  get isPasswordValid(): boolean {
    const val = this.passwordValidation;
    return val.minLength && val.hasUpperCase && val.hasLowerCase && val.hasNumber && val.hasSpecialChar;
  }

  get passwordStrength(): number {
    const val = this.passwordValidation;
    let strength = 0;
    if (val.minLength) strength += 20;
    if (val.hasUpperCase) strength += 20;
    if (val.hasLowerCase) strength += 20;
    if (val.hasNumber) strength += 20;
    if (val.hasSpecialChar) strength += 20;
    return strength;
  }

  get passwordStrengthLabel(): string {
    const strength = this.passwordStrength;
    if (strength === 0) return '';
    if (strength <= 40) return 'Faible';
    if (strength <= 60) return 'Moyen';
    if (strength < 100) return 'Bon';
    return 'Excellent';
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    // TODO: Add SEO service when available
    // TODO: Add auth service when available
  }

  onSubmit(): void {
    if (this.loading) return;
    if (!this.token) {
      this.notifications.error('Lien invalide', 'Token manquant ou invalide.');
      return;
    }
    if (!this.isPasswordValid) {
      this.notifications.warning('Mot de passe faible', 'Le mot de passe ne respecte pas tous les critères de sécurité.');
      return;
    }
    if (!this.passwordValidation.passwordsMatch) {
      this.notifications.warning('Vérification', 'Les mots de passe ne correspondent pas.');
      return;
    }

    this.loading = true;

    this.authApi.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.notifications.success('Mot de passe mis à jour', 'Vous pouvez vous connecter avec votre nouveau mot de passe.');
        window.setTimeout(() => this.router.navigate(['/login']), 900);
      },
      error: (err: Error) => {
        this.loading = false;
        this.notifications.error('Échec', err.message || 'Erreur lors de la réinitialisation.');
      },
    });
  }
}

