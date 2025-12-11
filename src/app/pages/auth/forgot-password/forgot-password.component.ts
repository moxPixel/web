import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('forgotParallax', { static: false }) forgotParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();

  email = '';
  loading = false;
  success = false;

  private authService = inject(AuthApiService);
  private notification = inject(NotificationService);
  private gsapScroll = inject(GsapScrollService);
  private pageLoaderInline = inject(PageLoaderInlineService);

  get rippleColor(): string {
    return getRippleColorAuto();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.forgotParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.forgotParallax.nativeElement,
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
    if (this.loading || !this.email) return;
    this.loading = true;
    this.success = false;

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.notification.success('Email envoyé', 'Si un compte existe, un email a été envoyé.');
      },
      error: (err) => {
        this.loading = false;
        this.notification.error('Erreur', err.message || 'Erreur lors de la demande.');
      },
    });
  }
}

