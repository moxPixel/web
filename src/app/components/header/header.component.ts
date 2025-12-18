import { Component, HostListener, OnDestroy, Inject, AfterViewInit, ElementRef, ViewChild, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DOCUMENT, NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { GsapAnimationService } from '../../services/gsap-animation.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { gsap } from 'gsap';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { Training } from '../../interfaces/training.interface';
import { AuthApiService } from '../../services/api/auth-api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatRippleModule, MatIconModule, NgOptimizedImage],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnDestroy, AfterViewInit, OnInit {
  isMobileMenuOpen = false;
  isDarkMode = false;
  showMegaMenu = false;
  showMobileTrainings = false;
  trainingsGrouped: { category: string; items: Training[] }[] = [];
  currentRoute = '';
  @ViewChild('headerContainer', { static: false }) headerContainer!: ElementRef;
  private destroy$ = new Subject<void>();
  private megaMenuTimer?: ReturnType<typeof setTimeout>;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private cdr: ChangeDetectorRef,
    private gsapAnimation: GsapAnimationService,
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService,
    private trainingsService: TrainingsService,
    private authService: AuthApiService,
    private router: Router
  ) {
    // Vérifier le thème au chargement
    this.checkDarkMode();
  }

  get userSpaceLink(): string {
    return this.authService.isAdmin() ? '/bo/trainings' : '/account/enrollments';
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    // Suivre la route actuelle
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentRoute = event.url || '';
      });
    this.currentRoute = this.router.url || '';

    this.trainingsService.getTrainings().pipe(takeUntil(this.destroy$)).subscribe((trainings) => {
      const groups: Record<string, Training[]> = {};
      trainings.forEach((t) => {
        const cat = t.category || 'Autres';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(t);
      });
      this.trainingsGrouped = Object.entries(groups)
        .map(([category, items]) => ({
          category,
          items: items.slice(0, 5)
        }))
        .sort((a, b) => a.category.localeCompare(b.category));
    });
  }

  get buttonText(): string {
    if (!this.isAuthenticated) {
      return 'Mon espace';
    }
    // Si connecté et sur la page enrollments user, afficher "Déconnexion"
    if (this.currentRoute.startsWith('/account/enrollments')) {
      return 'Déconnexion';
    }
    // Sinon afficher "Mon espace"
    return 'Mon espace';
  }

  get buttonAction(): 'link' | 'logout' {
    if (!this.isAuthenticated) {
      return 'link';
    }
    // Si connecté et sur la page enrollments user, action logout
    if (this.currentRoute.startsWith('/account/enrollments')) {
      return 'logout';
    }
    // Sinon action link vers mon espace
    return 'link';
  }

  ngAfterViewInit() {
    if (!this.headerContainer) {
      return;
    }

    // S'assurer que le header est caché initialement tout en préservant le centrage horizontal
    if (this.headerContainer?.nativeElement) {
      gsap.set(this.headerContainer.nativeElement, {
        opacity: 0,
        y: -60,
        xPercent: -50, // Préserver le centrage horizontal (équivalent à -translate-x-1/2)
        force3D: true
      });
    }

    // Attendre que le loader soit complètement caché avant de démarrer les animations
    this.pageLoaderInline.loaderHidden$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isHidden) => {
      if (isHidden) {
        // Attendre un court délai après la disparition du loader pour garantir la transition
        setTimeout(() => {
          // Animer le header vers l'état visible en préservant le centrage horizontal
          gsap.to(this.headerContainer.nativeElement, {
            opacity: 1,
            y: 0,
            xPercent: -50, // Maintenir le centrage horizontal
            duration: 0.9,
            ease: 'power3.out',
            delay: 0.05,
            force3D: true
          });

          // Initialiser l'animation du header au scroll
          setTimeout(() => {
            this.gsapScroll.initHeaderScroll(
              this.headerContainer.nativeElement,
              () => this.isDarkMode
            );
          }, 500);
        }, 50);
      }
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.showMobileTrainings = false;
    }
    this.updateBodyOverflow();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.showMobileTrainings = false;
    this.updateBodyOverflow();
  }

  openMegaMenu(): void {
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
      this.megaMenuTimer = undefined;
    }
    this.showMegaMenu = true;
    // OnPush: garantir le refresh même si l'ouverture est déclenchée via des événements non-Angular selon le navigateur
    this.cdr.markForCheck();
  }

  closeMegaMenu(): void {
    this.showMegaMenu = false;
    this.cdr.markForCheck();
  }

  scheduleCloseMegaMenu(delay = 180): void {
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
    }
    this.megaMenuTimer = setTimeout(() => {
      this.showMegaMenu = false;
      this.megaMenuTimer = undefined;
      // OnPush + setTimeout: sans markForCheck, la vue peut ne pas refléter la fermeture (souvent visible sur Safari)
      this.cdr.markForCheck();
    }, delay);
  }

  toggleMobileTrainings(): void {
    this.showMobileTrainings = !this.showMobileTrainings;
  }

  private updateBodyOverflow() {
    if (this.isMobileMenuOpen) {
      this.document.body.classList.add('overflow-hidden');
    } else {
      this.document.body.classList.remove('overflow-hidden');
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined' && window.innerWidth >= 1280) { // xl breakpoint
      this.closeMobileMenu();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
      this.megaMenuTimer = undefined;
    }
    if (this.document?.body) {
      this.document.body.classList.remove('overflow-hidden');
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (!this.document?.documentElement || !this.document?.body) return;

    if (this.isDarkMode) {
      this.document.documentElement.classList.add('dark');
      this.document.documentElement.style.backgroundColor = '#070b10';
      this.document.body.style.backgroundColor = '#070b10';
      localStorage.setItem('theme', 'dark');
    } else {
      this.document.documentElement.classList.remove('dark');
      this.document.documentElement.style.backgroundColor = '#ffffff';
      this.document.body.style.backgroundColor = '#ffffff';
      localStorage.setItem('theme', 'light');
    }
  }

  private checkDarkMode() {
    // Vérifier que le document est disponible
    if (!this.document?.documentElement || !this.document?.body) {
      // Si le document n'est pas encore disponible, réessayer après un court délai
      setTimeout(() => this.checkDarkMode(), 0);
      return;
    }

    // Vérifier le localStorage ou la préférence système
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.isDarkMode = true;
      this.document.documentElement.classList.add('dark');
      this.document.documentElement.style.backgroundColor = '#070b10';
      this.document.body.style.backgroundColor = '#070b10';
    } else {
      this.isDarkMode = false;
      this.document.documentElement.classList.remove('dark');
      this.document.documentElement.style.backgroundColor = '#ffffff';
      this.document.body.style.backgroundColor = '#ffffff';
    }
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}

