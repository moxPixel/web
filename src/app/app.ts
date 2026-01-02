import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostBinding, inject, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { FooterComponent } from './layouts/footer/footer.component';
import { HeaderComponent } from './layouts/header/header.component';
import { DynamicPaletteService } from './shared/services/dynamic-palette/dynamic-palette.service';
import { ScrollPaletteService } from './shared/services/scroll-palette/scroll-palette.service';
import { EvaHelpButtonComponent } from './components/eva-help-button/eva-help-button.component';
import { BackofficeBottomNavComponent } from './layouts/backoffice-bottom-nav/backoffice-bottom-nav.component';
import { TrainingsService } from './services/trainings/trainings.service';
import { take } from 'rxjs';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';
import { EventHighlightModalComponent } from './components/event-highlight-modal/event-highlight-modal.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { routeFadeIn } from './shared/animations/route-fade.animation';
import { SeoService } from './shared/services/seo/seo.service';
import { AnalyticsService } from './shared/services/analytics/analytics.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    CookieConsentComponent,
    EventHighlightModalComponent,
    NotificationsComponent,
    EvaHelpButtonComponent,
    BackofficeBottomNavComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeFadeIn]
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('wrapper1') wrapper1!: ElementRef<HTMLElement>;
  @ViewChild('wrapper2') wrapper2!: ElementRef<HTMLElement>;
  @ViewChild('wrapper3') wrapper3!: ElementRef<HTMLElement>;
  @ViewChild('wrapper4') wrapper4!: ElementRef<HTMLElement>;

  private readonly dynamicPalette = inject(DynamicPaletteService);
  private readonly scrollPalette = inject(ScrollPaletteService);
  private readonly trainings = inject(TrainingsService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private routeSub?: Subscription;

  isBackofficeRoute = false;
  // Incremented on each navigation to trigger the fade-in animation.
  routeTransitionId = 0;

  @HostBinding('class.is-backoffice')
  get isBackofficeHostClass(): boolean {
    return this.isBackofficeRoute;
  }
  
  private mouseX = 0;
  private mouseY = 0;
  private rafId: number | null = null;

  ngOnInit(): void {
    // SEO (metas/canonical/OG/JSON-LD) — driven by route `data.seo`
    this.seo.init();

    // Initialize with base palette (hero)
    this.dynamicPalette.setPalette(null);

    // Warm up trainings cache early so client pages feel instant on first navigation.
    this.trainings
      .getTrainings()
      .pipe(take(1))
      .subscribe({ next: () => {}, error: () => {} });

    this.updateBackofficeRoute(this.router.url);
    // Enable palette scroll only on home (keeps other pages stable/consistent)
    this.updatePaletteMode(this.router.url);

    // Simple scroll to top on route change
    this.routeSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Trigger page fade-in (Angular animations) on each navigation end.
        this.routeTransitionId++;
        window.scrollTo({ top: 0, behavior: 'auto' });
        this.updateBackofficeRoute(this.router.url);
        this.updatePaletteMode(this.router.url);
        
        // Track page view pour analytics (seulement si consentement donné)
        this.analytics.trackPageView(this.router.url);
      });
  }

  ngAfterViewInit(): void {
    this.initMouseFollow();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.scrollPalette.disable();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.onMouseMove);
    }
  }

  private onMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  };

  private initMouseFollow(): void {
    if (typeof window === 'undefined') return;
    
    // Wait for elements to be available
    const checkElements = () => {
      if (!this.wrapper1?.nativeElement || !this.wrapper2?.nativeElement || 
          !this.wrapper3?.nativeElement || !this.wrapper4?.nativeElement) {
        setTimeout(checkElements, 50);
        return;
      }
      this.startMouseFollow();
    };
    
    checkElements();
  }

  private updatePaletteMode(url: string): void {
    // Only home uses multi-section palettes; other routes keep the base palette.
    const isHome = url === '/' || url.startsWith('/#') || url.startsWith('/?');
    if (isHome && !this.isBackofficeRoute) {
      this.scrollPalette.enable();
    } else {
      this.scrollPalette.disable();
    }
  }

  private updateBackofficeRoute(url: string): void {
    const path = (url || '').split('?')[0].split('#')[0];
    this.isBackofficeRoute = path === '/backoffice' || path.startsWith('/backoffice/');
  }

  private startMouseFollow(): void {
    window.addEventListener('mousemove', this.onMouseMove);
    
    // Initialize mouse position to center
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;

    const animate = () => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Augmenter l'amplitude (de 30 à 80)
      const offsetX = (this.mouseX - centerX) / centerX * 80;
      const offsetY = (this.mouseY - centerY) / centerY * 80;

      // Multiplicateurs plus élevés pour des mouvements plus prononcés
      this.wrapper1.nativeElement.style.transform = `translate(${offsetX * 0.35}px, ${offsetY * 0.28}px)`;
      this.wrapper2.nativeElement.style.transform = `translate(${offsetX * 0.45}px, ${offsetY * 0.38}px)`;
      this.wrapper3.nativeElement.style.transform = `translate(${offsetX * 0.40}px, ${offsetY * 0.32}px)`;
      this.wrapper4.nativeElement.style.transform = `translate(${offsetX * 0.30}px, ${offsetY * 0.25}px)`;

      this.rafId = requestAnimationFrame(animate);
    };

    animate();
  }
}
