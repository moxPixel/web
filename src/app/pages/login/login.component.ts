import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../services/api/auth-api.service';
import { getRippleColorAuto } from '../../utils/ripple.util';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { SeoService } from '../../services/seo.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('loginParallax', { static: false }) loginParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();

  email = '';
  password = '';
  rememberMe = false;
  loading = false;
  error: string | null = null;
  returnUrl = '/account/enrollments';

  private router = inject(Router);
  route = inject(ActivatedRoute); // Public pour accès dans le template
  private authService = inject(AuthApiService);
  private gsapScroll = inject(GsapScrollService);
  private pageLoaderInline = inject(PageLoaderInlineService);
  private readonly seoService = inject(SeoService);

  get rippleColor(): string {
    return getRippleColorAuto();
  }

  ngOnInit(): void {
    // Configuration SEO pour la page Login
    this.seoService.updateSeoData({
      title: 'Connexion | Unlock Formation',
      description: 'Connectez-vous à votre espace personnel Unlock Formation pour accéder à vos formations, suivre votre progression et gérer vos inscriptions.',
      url: '/login',
      noindex: true, // Page de connexion ne doit pas être indexée
      type: 'website'
    });

    // URL de retour par défaut = page de suivi des demandes utilisateur
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/account/enrollments';

    // Si déjà connecté, rediriger selon le rôle
    if (this.authService.isAuthenticated()) {
      this.authService.currentUser.subscribe(user => {
        if (!user) return;
        if (user.role === 'admin') {
          this.router.navigate(['/bo/trainings']);
        } else {
          this.router.navigate(['/account/enrollments']);
        }
      }).unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.loginParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.loginParallax.nativeElement,
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

    this.error = null;
    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        // Rediriger selon le rôle
        const target = response.user.role === 'admin' ? '/bo/trainings' : '/account/enrollments';
        this.router.navigate([target]);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Erreur lors de la connexion';
      },
    });
  }
}

