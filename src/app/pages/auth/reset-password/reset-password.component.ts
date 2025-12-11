import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../services/api/auth-api.service';
import { NotificationService } from '../../../services/notification.service';
import { getRippleColorAuto } from '../../../utils/ripple.util';
import { GsapScrollService } from '../../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../../services/page-loader-inline.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('resetParallax', { static: false }) resetParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();

  token = '';
  password = '';
  confirmPassword = '';
  loading = false;

  // Validation du mot de passe
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

  get passwordStrengthColor(): string {
    const strength = this.passwordStrength;
    if (strength <= 40) return 'bg-red-500';
    if (strength <= 60) return 'bg-orange-500';
    if (strength < 100) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  private authService = inject(AuthApiService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private gsapScroll = inject(GsapScrollService);
  private pageLoaderInline = inject(PageLoaderInlineService);

  get rippleColor(): string {
    return getRippleColorAuto();
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.resetParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.resetParallax.nativeElement,
              -0.25,
              'top top',
              'bottom top'
            );
          }, 50);
        }
      });
  }

  ngOnDestroy(): void {
    this.heroParallaxTween?.scrollTrigger?.kill();
    this.heroParallaxTween?.kill();
    this.heroParallaxTween = undefined;
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loading) return;
    if (!this.token) {
      this.notification.error('Erreur', 'Token manquant ou invalide.');
      return;
    }
    if (!this.isPasswordValid) {
      this.notification.error('Erreur', 'Le mot de passe ne respecte pas tous les critères de sécurité.');
      return;
    }
    if (!this.passwordValidation.passwordsMatch) {
      this.notification.error('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    this.loading = true;
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success('Succès', 'Mot de passe réinitialisé. Vous pouvez vous connecter.');
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.notification.error('Erreur', err.message || 'Erreur lors de la réinitialisation.');
      },
    });
  }
}

