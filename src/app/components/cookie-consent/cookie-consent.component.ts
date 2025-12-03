import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { NotificationService } from '../../services/notification.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { getRippleColorAuto } from '../../utils/ripple.util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const CONSENT_KEY = 'cookie-consent';
const WELCOME_KEY = 'welcome-shown';
const STORAGE_TTL_DAYS = 365;

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, MatRippleModule],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.css'
})
export class CookieConsentComponent implements OnInit, OnDestroy {
  isVisible = false;
  isHiding = false;
  private destroy$ = new Subject<void>();

  get rippleColor(): string {
    return getRippleColorAuto();
  }

  constructor(
    private notificationService: NotificationService,
    private pageLoaderInline: PageLoaderInlineService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const consent = this.getStoredValue(CONSENT_KEY);
    if (!consent) {
      // Attendre que le loader soit complètement disparu avant d'afficher le cookie consent
      // Utiliser le service centralisé pour une détection fiable à 100%
      this.pageLoaderInline.loaderHidden$.pipe(
        takeUntil(this.destroy$)
      ).subscribe((isHidden) => {
        if (isHidden) {
          // Attendre un délai supplémentaire après la disparition du loader pour une transition fluide
          setTimeout(() => {
            this.isVisible = true;
          }, 600);
        }
      });
    } else {
      this.showWelcomeNotification();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  accept(): void {
    this.persist(CONSENT_KEY, 'accepted');
    this.dispatchConsentChange('accepted');
    this.hidePopup();
    this.showWelcomeNotification();
  }

  reject(): void {
    this.persist(CONSENT_KEY, 'rejected');
    this.dispatchConsentChange('rejected');
    this.hidePopup();
    this.showWelcomeNotification();
  }

  private hidePopup(): void {
    this.isHiding = true;
    setTimeout(() => {
      this.isVisible = false;
      this.isHiding = false;
    }, 500);
  }

  private showWelcomeNotification(): void {
    const alreadyShown = this.getStoredValue(WELCOME_KEY);
    if (alreadyShown || !this.isBrowser()) {
      return;
    }

    setTimeout(() => {
      this.notificationService.info(
        'Bienvenue sur Unlock',
        'Nous utilisons des cookies pour offrir une expérience immersive digne des meilleurs SaaS.'
      );
      this.persist(WELCOME_KEY, 'true');
    }, 800);
  }

  private dispatchConsentChange(status: 'accepted' | 'rejected'): void {
    if (!this.isBrowser()) {
      return;
    }

    const event = new CustomEvent('cookieConsentChanged', {
      detail: { status }
    });
    document.dispatchEvent(event);
  }

  private persist(key: string, value: string): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const payload = {
        value,
        expires: Date.now() + STORAGE_TTL_DAYS * 24 * 60 * 60 * 1000
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      console.warn('Impossible de stocker la préférence cookie', error);
    }
  }

  private getStoredValue(key: string): string | null {
    if (!this.isBrowser()) {
      return null;
    }

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


