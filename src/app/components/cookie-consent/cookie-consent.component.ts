import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

const CONSENT_KEY = 'cookie-consent';
const WELCOME_KEY = 'welcome-shown';
const STORAGE_TTL_DAYS = 365;

type ConsentStatus = 'accepted' | 'rejected';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.css'
})
export class CookieConsentComponent implements OnInit, OnDestroy {
  isVisible = false;
  isHiding = false;

  private showTimerId: number | null = null;
  private hideTimerId: number | null = null;

  constructor(private notifications: NotificationService) {}

  ngOnInit(): void {
    if (!this.isBrowser()) return;
    
    const consent = this.getStoredValue(CONSENT_KEY);
    if (!consent) {
      // Wait for loader to be hidden before showing cookie consent
      this.waitForLoaderThenShow();
    } else {
      this.showWelcomeNotificationOnce();
    }
  }

  private waitForLoaderThenShow(): void {
    if (!this.isBrowser()) return;

    const checkLoader = () => {
      const loader = document.getElementById('page-loader');
      if (!loader) {
        // Loader already gone, show after a short delay
        this.showTimerId = window.setTimeout(() => {
          this.isVisible = true;
        }, 700);
        return;
      }

      // Wait for loader-hidden event
      const onLoaderHidden = () => {
        window.removeEventListener('app-loader-hidden', onLoaderHidden as any);
        this.showTimerId = window.setTimeout(() => {
          this.isVisible = true;
        }, 700);
      };
      window.addEventListener('app-loader-hidden', onLoaderHidden as any, { once: true } as any);
    };

    checkLoader();
  }

  ngOnDestroy(): void {
    if (this.showTimerId !== null && this.isBrowser()) window.clearTimeout(this.showTimerId);
    if (this.hideTimerId !== null && this.isBrowser()) window.clearTimeout(this.hideTimerId);
  }

  accept(): void {
    this.persist(CONSENT_KEY, 'accepted');
    this.dispatchConsentChange('accepted');
    this.hidePopup();
    this.showWelcomeNotificationOnce();
  }

  reject(): void {
    this.persist(CONSENT_KEY, 'rejected');
    this.dispatchConsentChange('rejected');
    this.hidePopup();
    this.showWelcomeNotificationOnce();
  }

  private showWelcomeNotificationOnce(): void {
    if (!this.isBrowser()) return;
    const alreadyShown = this.getStoredValue(WELCOME_KEY);
    if (alreadyShown) return;

    window.setTimeout(() => {
      this.notifications.info(
        'Bienvenue sur Unlock',
        'Nous utilisons des cookies pour améliorer l’expérience et mesurer l’audience.'
      );
      this.persist(WELCOME_KEY, 'true');
    }, 650);
  }

  private hidePopup(): void {
    this.isHiding = true;
    if (!this.isBrowser()) return;

    this.hideTimerId = window.setTimeout(() => {
      this.isVisible = false;
      this.isHiding = false;
    }, 380);
  }

  private dispatchConsentChange(status: ConsentStatus): void {
    if (!this.isBrowser()) return;
    const event = new CustomEvent('cookieConsentChanged', { detail: { status } });
    document.dispatchEvent(event);
  }

  private persist(key: string, value: string): void {
    if (!this.isBrowser()) return;
    try {
      const payload = {
        value,
        expires: Date.now() + STORAGE_TTL_DAYS * 24 * 60 * 60 * 1000
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


