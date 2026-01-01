import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';
import { AuthSessionService } from '../../shared/services/auth-session/auth-session.service';
import { NotificationService } from '../../shared/services/notifications/notification.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TablerIconComponent, UiButtonDirective, UiInputDirective],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthSessionService);
  private readonly notifications = inject(NotificationService);

  email = '';
  password = '';
  rememberMe = false;
  loading = false;

  ngOnInit(): void {
    // TODO: Add SEO service when available
    if (this.auth.isAuthenticated) {
      this.router.navigate(['/profile']);
    }
  }

  onSubmit(): void {
    if (this.loading) return;

    this.loading = true;
    if (!this.email || !this.password) {
      this.loading = false;
      this.notifications.warning('Champs manquants', 'Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    this.auth
      .login({ email: this.email, password: this.password }, this.rememberMe)
      .subscribe({
        next: () => {
          this.loading = false;
          this.notifications.success('Connexion réussie', 'Vous êtes connecté.');
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          this.router.navigate([returnUrl || '/profile']);
        },
        error: (err: Error) => {
          this.loading = false;
          this.notifications.error('Connexion impossible', err.message || 'Erreur lors de la connexion.');
        },
      });
  }
}
