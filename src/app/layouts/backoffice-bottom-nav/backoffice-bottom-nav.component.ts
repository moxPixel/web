import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Inject, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Observable, catchError, distinctUntilChanged, map, of, shareReplay, switchMap, timer } from 'rxjs';
import { AuthSessionService } from '../../shared/services/auth-session/auth-session.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { BackofficeBadges, BackofficeBadgesApiService } from '../../services/api/backoffice-badges-api.service';

@Component({
  selector: 'app-backoffice-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TablerIconComponent],
  templateUrl: './backoffice-bottom-nav.component.html',
  styleUrl: './backoffice-bottom-nav.component.css',
})
export class BackofficeBottomNavComponent {
  protected readonly auth = inject(AuthSessionService);
  private readonly badgesApi = inject(BackofficeBadgesApiService);

  readonly badges$: Observable<BackofficeBadges | null> = this.auth.user$.pipe(
    map((u) => (u?.role || '').toLowerCase()),
    distinctUntilChanged(),
    switchMap((role) => {
      if (role !== 'admin') return of(null);
      // Light polling: keeps badges fresh without spamming (and only for admins).
      return timer(0, 15_000).pipe(
        switchMap(() => this.badgesApi.getBadges()),
        catchError(() => of(null)),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  @ViewChild('navContainer', { static: false }) private navContainer?: ElementRef<HTMLElement>;

  private scrollRaf: number | null = null;
  private lastScroll = 0;
  private isShrunk = false;
  private scrollListener?: () => void;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly ngZone: NgZone
  ) {}

  badgeLabel(n: number | null | undefined): string {
    const v = Math.max(0, Number(n) || 0);
    if (v <= 0) return '';
    if (v >= 100) return '99+';
    return String(v);
  }

  @HostListener('window:resize')
  onResize() {
    // no-op for now; placeholder if we need to recompute later
  }

  ngAfterViewInit(): void {
    const el = this.navContainer?.nativeElement;
    if (!el) return;

    // Entry animation like header, but from bottom (inverse)
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';

    setTimeout(() => {
      el.style.transition = 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';

      setTimeout(() => this.initScrollAnimation(), 250);
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.scrollRaf !== null) cancelAnimationFrame(this.scrollRaf);
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
  }

  private initScrollAnimation(): void {
    const el = this.navContainer?.nativeElement;
    if (!el) return;

    this.lastScroll = window.scrollY || this.document.documentElement.scrollTop || 0;

    this.ngZone.runOutsideAngular(() => {
      const update = () => {
        const currentScroll = window.scrollY || this.document.documentElement.scrollTop || 0;
        const scrollingDown = currentScroll > this.lastScroll;
        const scrollingUp = currentScroll < this.lastScroll;
        const delta = Math.abs(currentScroll - this.lastScroll);

        if (delta < 2) {
          this.scrollRaf = null;
          return;
        }

        // Same thresholds as header, inverted direction (bottom nav moves DOWN a bit on scroll-down)
        if (scrollingDown && currentScroll > 50 && !this.isShrunk) {
          this.isShrunk = true;
          el.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
          el.style.transform = 'translateY(4px) scale(0.92)';
          el.style.background = 'var(--ui-glass-bg-strong)';
          el.style.backdropFilter = 'blur(var(--ui-glass-blur)) saturate(var(--ui-glass-sat))';
          el.style.setProperty('-webkit-backdrop-filter', 'blur(var(--ui-glass-blur)) saturate(var(--ui-glass-sat))');
        } else if ((scrollingUp && this.isShrunk) || (currentScroll <= 50 && this.isShrunk)) {
          this.isShrunk = false;
          el.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
          el.style.transform = 'translateY(0) scale(1)';
          el.style.background = 'var(--ui-surface)';
          el.style.backdropFilter = 'blur(var(--ui-backdrop-blur)) saturate(var(--ui-backdrop-sat, 120%))';
          el.style.setProperty('-webkit-backdrop-filter', 'blur(var(--ui-backdrop-blur)) saturate(var(--ui-backdrop-sat, 120%))');
        }

        this.lastScroll = currentScroll;
        this.scrollRaf = null;
      };

      this.scrollListener = () => {
        if (this.scrollRaf !== null) return;
        this.scrollRaf = requestAnimationFrame(update);
      };
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    });
  }
}


