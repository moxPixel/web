import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, NgZone, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthSessionService } from '../../shared/services/auth-session/auth-session.service';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { Training } from '../../interfaces/training.interface';

import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TablerIconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  protected readonly auth = inject(AuthSessionService);
  private readonly trainingsService = inject(TrainingsService);
  isMobileMenuOpen = false;
  showMegaMenu = false;
  showMobileTrainings = false;
  trainingsGrouped: { category: string; items: Training[] }[] = [];
  private megaMenuTimer?: ReturnType<typeof setTimeout>;
  @ViewChild('trainingsNavItem', { static: false }) private trainingsNavItem?: ElementRef<HTMLElement>;
  @ViewChild('headerContainer', { static: false }) private headerContainer?: ElementRef<HTMLElement>;
  @ViewChild('megaMenuEl', { static: false }) private megaMenuEl?: ElementRef<HTMLElement>;

  // Fixed overlay positioning (so blur behaves like notifications)
  megaMenuStyle: Record<string, string> = {};
  private megaPosRaf: number | null = null;
  
  private scrollRaf: number | null = null;
  private lastScroll = 0;
  private isCompact = false;
  private scrollListener?: () => void;
  private animRaf: number | null = null;
  private headerProgress = 0; // 0..1
  private headerTarget = 0; // 0..1
  private headerFullWidth = 0; // px
  private headerCompactWidth = 0; // px
  private resizeListener?: () => void;
  private readonly destroy$ = new Subject<void>();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone
  ) {
  }

  ngOnInit(): void {
    // Charger les formations et les grouper par catégorie
    this.trainingsService.getTrainings()
      .pipe(takeUntil(this.destroy$))
      .subscribe((trainings) => {
        const groups: Record<string, Training[]> = {};
        trainings.forEach((t) => {
          const cat = t.category || 'Autres';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(t);
        });
        this.trainingsGrouped = Object.entries(groups)
          .map(([category, items]) => ({
            category,
            items: items.slice(0, 5) // Limiter à 5 formations par catégorie
          }))
          .sort((a, b) => a.category.localeCompare(b.category));
        this.cdr.markForCheck();
      });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) this.showMobileTrainings = false;
    this.syncBodyOverflow();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.showMobileTrainings = false;
    this.syncBodyOverflow();
  }

  openMegaMenu(): void {
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
      this.megaMenuTimer = undefined;
    }
    this.showMegaMenu = true;
    this.scheduleMegaMenuPosition();
    this.cdr.markForCheck();
  }

  scheduleCloseMegaMenu(delay = 180): void {
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
    }
    this.megaMenuTimer = setTimeout(() => {
      this.showMegaMenu = false;
      this.megaMenuTimer = undefined;
      this.cdr.markForCheck();
    }, delay);
  }

  closeMegaMenu(): void {
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
      this.megaMenuTimer = undefined;
    }
    this.showMegaMenu = false;
    this.cdr.markForCheck();
  }

  toggleMobileTrainings(): void {
    this.showMobileTrainings = !this.showMobileTrainings;
  }

  /*
    Fallback close: if pointerleave doesn't fire (some browser edge cases),
    close when pointer is no longer inside the trainings nav item or its mega menu.
  */
  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(ev: PointerEvent) {
    if (!this.showMegaMenu) return;
    const nav = this.trainingsNavItem?.nativeElement;
    const menu = this.megaMenuEl?.nativeElement;
    if (!nav) return;

    // Robust "is pointer inside" check across browsers:
    // - `composedPath()` is not always reliable (can be empty in some cases)
    // - fallback to DOM containment using `ev.target`
    const path = (typeof ev.composedPath === 'function' ? ev.composedPath() : []) as EventTarget[];
    const target = (ev.target || null) as unknown as Node | null;
    const isInside =
      path.includes(nav) ||
      (menu ? path.includes(menu) : false) ||
      (!!target && (nav.contains(target) || (menu ? menu.contains(target) : false)));

    if (!isInside) {
      this.scheduleCloseMegaMenu(0);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showMegaMenu) this.closeMegaMenu();
    if (this.isMobileMenuOpen) this.closeMobileMenu();
  }

  private syncBodyOverflow() {
    if (this.isMobileMenuOpen) this.document.body.classList.add('overflow-hidden');
    else this.document.body.classList.remove('overflow-hidden');
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // matches our CSS desktop breakpoint
      this.closeMobileMenu();
    }
    if (this.showMegaMenu) this.scheduleMegaMenuPosition();
  }

  private scheduleMegaMenuPosition(): void {
    if (typeof window === 'undefined') return;
    if (this.megaPosRaf !== null) return;
    this.megaPosRaf = window.requestAnimationFrame(() => {
      this.megaPosRaf = null;
      this.updateMegaMenuPosition();
    });
  }

  private updateMegaMenuPosition(): void {
    if (typeof window === 'undefined') return;
    const nav = this.trainingsNavItem?.nativeElement;
    if (!nav) return;
    const rect = nav.getBoundingClientRect();

    // Match CSS: width: min(920px, 85vw)
    const maxW = 920;
    const w = Math.min(maxW, Math.round(window.innerWidth * 0.85));
    const margin = 12;

    let cx = rect.left + rect.width / 2;
    const half = w / 2;
    cx = Math.max(margin + half, Math.min(window.innerWidth - margin - half, cx));

    const top = Math.round(rect.bottom + 8); // match previous translateY
    this.megaMenuStyle = {
      left: `${Math.round(cx)}px`,
      top: `${top}px`,
      width: `${w}px`,
    };
  }

  ngAfterViewInit(): void {
    if (!this.headerContainer?.nativeElement) return;

    // Scroll behavior is handled via class toggling (CSS), not inline styles.
    // This avoids style-priority conflicts and keeps transitions smooth.
    this.initScrollAnimation();
  }

  private initScrollAnimation(): void {
    if (!this.headerContainer?.nativeElement) return;
    
    const headerEl = this.headerContainer.nativeElement;

    this.ngZone.runOutsideAngular(() => {
      const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      const measureWidths = () => {
        // Clear width override so we can read the "full" CSS width
        headerEl.style.removeProperty('--ui-h-w');
        headerEl.style.width = '';

        // Full mode measurement
        const hadCompact = headerEl.classList.contains('is-compact');
        headerEl.classList.remove('is-compact');
        // force layout
        void headerEl.offsetWidth;
        this.headerFullWidth = Math.max(0, headerEl.getBoundingClientRect().width);

        // Compact mode measurement: shrink-to-content
        headerEl.classList.add('is-compact');
        headerEl.style.width = 'fit-content';
        void headerEl.offsetWidth;
        this.headerCompactWidth = Math.max(0, headerEl.getBoundingClientRect().width);

        // Restore
        headerEl.style.width = '';
        headerEl.style.removeProperty('--ui-h-w');
        if (!hadCompact) headerEl.classList.remove('is-compact');
        void headerEl.offsetWidth;

        // Re-apply current progress with fresh widths
        applyProgress(this.headerProgress);
      };

      const applyProgress = (p: number) => {
        // Fluid resize values (tweak here)
        const scale = 1; // do real horizontal resize instead of "fake" scaling
        const isMobile = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)')?.matches;
        // On mobile, don't "lift" the pill upward when compact; keep a minimum top margin.
        const ty = isMobile ? 0 : lerp(0, -8, p);
        const h = lerp(3.5, 3.0, p); // rem
        const py = lerp(0.35, 0.22, p); // rem
        const px = lerp(0.5, 0.35, p); // rem

        headerEl.style.setProperty('--ui-h-scale', String(scale));
        headerEl.style.setProperty('--ui-h-ty', `${ty.toFixed(2)}px`);
        headerEl.style.setProperty('--ui-h-h', `${h.toFixed(3)}rem`);
        headerEl.style.setProperty('--ui-h-py', `${py.toFixed(3)}rem`);
        headerEl.style.setProperty('--ui-h-px', `${px.toFixed(3)}rem`);

        // Icons-only mode when sufficiently compact
        const wantCompact = p >= 0.72;
        if (wantCompact && !this.isCompact) {
          this.isCompact = true;
          headerEl.classList.add('is-compact');
        } else if (!wantCompact && this.isCompact) {
          this.isCompact = false;
          headerEl.classList.remove('is-compact');
        }

        // Horizontal width shrink (the part you asked for):
        // keep full width until compact kicks in, then shrink smoothly to compact width.
        if (this.headerFullWidth > 0 && this.headerCompactWidth > 0) {
          const wT = clamp01((p - 0.72) / (1 - 0.72));
          const w = lerp(this.headerFullWidth, this.headerCompactWidth, wT);
          headerEl.style.setProperty('--ui-h-w', `${w.toFixed(1)}px`);
        } else {
          headerEl.style.removeProperty('--ui-h-w');
        }
      };

      const ensureAnim = () => {
        if (this.animRaf !== null) return;
        const step = () => {
          const next = this.headerProgress + (this.headerTarget - this.headerProgress) * 0.18;
          this.headerProgress = Math.abs(this.headerTarget - next) < 0.002 ? this.headerTarget : clamp01(next);
          applyProgress(this.headerProgress);
          if (this.headerProgress !== this.headerTarget) this.animRaf = requestAnimationFrame(step);
          else this.animRaf = null;
        };
        this.animRaf = requestAnimationFrame(step);
      };

      const updateHeader = () => {
        const scrollingEl = document.scrollingElement || document.documentElement;
        const currentScroll = (scrollingEl?.scrollTop || 0) as number;
        const delta = currentScroll - this.lastScroll;
        const absDelta = Math.abs(delta);

        // Ignore micro scroll noise
        if (absDelta < 2) {
          this.scrollRaf = null;
          return;
        }

        // If an overlay UI is open, keep header in full mode for clarity.
        if (this.isMobileMenuOpen || this.showMegaMenu) {
          this.headerTarget = 0;
          ensureAnim();
          this.lastScroll = currentScroll;
          this.scrollRaf = null;
          return;
        }

        // Behavior: scroll down -> compact (progressive), scroll up -> FULL (no matter where you are).
        const topThreshold = 24;
        const range = 180; // 0px -> normal, ~180px -> fully compact

        if (currentScroll <= topThreshold) {
          this.headerTarget = 0;
        } else if (delta < 0) {
          // user is scrolling up anywhere on the page -> restore full header
          this.headerTarget = 0;
        } else {
          // scrolling down -> progressively compact
          this.headerTarget = clamp01(currentScroll / range);
        }
        ensureAnim();

        this.lastScroll = currentScroll;
        this.scrollRaf = null;
      };
      
      this.scrollListener = () => {
        if (this.scrollRaf !== null) return;
        this.scrollRaf = requestAnimationFrame(updateHeader);
      };
      
      // Initialize state (e.g. if user reloads mid-page)
      const scrollingEl = document.scrollingElement || document.documentElement;
      const startScroll = (scrollingEl?.scrollTop || 0) as number;
      const range = 180;
      this.headerTarget = clamp01(startScroll / range);
      this.headerProgress = this.headerTarget;
      applyProgress(this.headerProgress);
      this.lastScroll = startScroll;

      // Measure widths once layout is stable (desktop nav becomes visible at >=1024px)
      requestAnimationFrame(() => {
        measureWidths();
      });

      window.addEventListener('scroll', this.scrollListener, { passive: true });
      // Some layouts scroll on document; listen there too (safe, passive).
      document.addEventListener('scroll', this.scrollListener as any, { passive: true, capture: true } as any);

      this.resizeListener = () => {
        // re-measure widths on resize and reapply current progress
        requestAnimationFrame(() => measureWidths());
      };
      window.addEventListener('resize', this.resizeListener, { passive: true });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
      this.megaMenuTimer = undefined;
    }
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      // removeEventListener only needs the capture flag (boolean) to match
      this.document.removeEventListener('scroll', this.scrollListener as any, true as any);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = undefined;
    }
    if (this.scrollRaf !== null) {
      cancelAnimationFrame(this.scrollRaf);
    }
    if (this.animRaf !== null) {
      cancelAnimationFrame(this.animRaf);
    }
    if (this.megaPosRaf !== null) {
      cancelAnimationFrame(this.megaPosRaf);
      this.megaPosRaf = null;
    }
    this.document.body.classList.remove('overflow-hidden');
  }
}


