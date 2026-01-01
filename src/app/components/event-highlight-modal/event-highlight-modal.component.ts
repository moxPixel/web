import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { EventApi } from '../../interfaces/event-api.interface';
import { EventsApiService } from '../../services/api/events-api.service';
import { UploadApiService } from '../../services/api/upload-api.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiButtonDirective } from '../../ui/ui-button.directive';

const CONSENT_KEY = 'cookie-consent';
const MODAL_SHOWN_KEY = 'event-highlight-modal-shown';
const STORAGE_TTL_DAYS = 365;

@Component({
  selector: 'app-event-highlight-modal',
  standalone: true,
  imports: [CommonModule, TablerIconComponent, UiButtonDirective],
  templateUrl: './event-highlight-modal.component.html',
  styleUrl: './event-highlight-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventHighlightModalComponent implements OnInit, OnDestroy {
  private readonly eventsApi = inject(EventsApiService);
  private readonly upload = inject(UploadApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Cookie-like state machine: mounted -> visible -> hiding -> unmounted.
  isMounted = false;
  isVisible = false;
  isHiding = false;
  event: EventApi | null = null;

  private showTimer: number | null = null;
  private hideTimer: number | null = null;
  private hasScheduled = false;

  ngOnInit(): void {
    if (!this.isBrowser()) return;

    const consent = this.getStoredValue(CONSENT_KEY);
    if (consent === 'accepted' || consent === 'rejected') {
      this.scheduleShowAfterLoader();
      return;
    }

    // Wait until the user interacts with cookie consent (accept OR reject), then schedule.
    const onConsent = (_ev: Event) => {
      this.scheduleShowAfterLoader();
    };
    document.addEventListener('cookieConsentChanged', onConsent as any, { once: true } as any);
    (this as any)._onConsent = onConsent;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.showTimer !== null && this.isBrowser()) window.clearTimeout(this.showTimer);
    if (this.hideTimer !== null && this.isBrowser()) window.clearTimeout(this.hideTimer);
    const onConsent = (this as any)._onConsent as ((ev: Event) => void) | undefined;
    if (onConsent) document.removeEventListener('cookieConsentChanged', onConsent as any);
  }

  close(): void {
    // Mark as shown for this event so we don't spam (even if user closes).
    // Mark as shown for this event so we don't spam.
    if (this.event?.id) this.persist(MODAL_SHOWN_KEY, this.event.id);

    this.isHiding = true;
    this.isVisible = false;
    this.cdr.markForCheck();

    if (!this.isBrowser()) return;
    this.hideTimer = window.setTimeout(() => {
      this.isMounted = false;
      this.isHiding = false;
      this.cdr.markForCheck();
    }, 520);
  }

  openRegistration(): void {
    this.close();
    // Requirement: CTA redirects to contact page
    this.router.navigateByUrl('/contact');
  }

  coverUrl(e: EventApi | null): string {
    if (!e?.coverImage) return '/assets/images/img/p1.jpg';
    return this.upload.getImageUrlFromPath(e.coverImage);
  }

  dateLabel(e: EventApi | null): string {
    if (!e?.startDate) return 'Date à venir';
    const d = new Date(e.startDate);
    if (Number.isNaN(d.getTime())) return 'Date à venir';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  timeLabel(e: EventApi | null): string {
    if (!e?.startDate) return '';
    const d = new Date(e.startDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  typeLabel(e: EventApi | null): string {
    const t = e?.eventType;
    if (t === 'portes-ouvertes') return 'Portes ouvertes';
    if (t === 'conference') return 'Conférence';
    if (t === 'meetup') return 'Meetup';
    if (t === 'atelier') return 'Atelier';
    if (t === 'webinar') return 'Webinar';
    return 'Événement';
  }

  placeLabel(e: EventApi | null): string {
    if (!e) return '';
    if (e.isOnline) return 'En ligne';
    return e.location || 'Sur place';
  }

  primaryCtaLabel(e: EventApi | null): string {
    const hasUrl = Boolean((e?.registrationUrl || '').trim());
    // Use typographic apostrophe to avoid template parsing issues.
    return hasUrl ? 'S’inscrire' : 'En savoir plus';
  }

  private scheduleShowAfterLoader(): void {
    if (!this.isBrowser() || this.hasScheduled) return;
    this.hasScheduled = true;

    const afterLoader = () => {
      // Always wait 4s after loader is gone (requirement).
      this.showTimer = window.setTimeout(() => this.tryOpen(), 4000);
    };

    // If loader already gone, schedule immediately.
    if (!document.getElementById('page-loader')) {
      afterLoader();
      return;
    }

    const onHidden = () => {
      window.removeEventListener('app-loader-hidden', onHidden as any);
      afterLoader();
    };
    window.addEventListener('app-loader-hidden', onHidden as any, { once: true } as any);
  }

  private tryOpen(): void {
    if (!this.isBrowser()) return;

    // Fetch the latest highlighted published event (source of truth).
    this.eventsApi
      // Requirement: show the latest event that is explicitly "mise en avant".
      // Also restrict to upcoming events to avoid resurfacing an old highlighted item.
      .findAll({ status: 'published', highlight: true, upcoming: true, limit: 1, sortBy: 'createdAt', sortOrder: 'DESC' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const e = (res.data || [])[0] || null;
          if (!e?.id) return;
          if (!e.highlight) return;

          const lastShownId = this.getStoredValue(MODAL_SHOWN_KEY);
          if (lastShownId && lastShownId === e.id) return;

          this.event = e;
          // Mount hidden, then show on next frame (ensures transition runs).
          this.isMounted = true;
          this.isHiding = false;
          this.isVisible = false;
          this.cdr.markForCheck();

          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              this.isVisible = true;
              this.cdr.markForCheck();
            });
          });
        },
        error: () => {
          // do nothing; never block the app
        },
      });
  }

  private persist(key: string, value: string): void {
    if (!this.isBrowser()) return;
    try {
      const payload = {
        value,
        expires: Date.now() + STORAGE_TTL_DAYS * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  private getStoredValue(key: string): string | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (!payload?.expires || payload.expires < Date.now()) {
        localStorage.removeItem(key);
        return null;
      }
      return payload.value;
    } catch {
      return null;
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
}


