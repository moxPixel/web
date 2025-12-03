import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

const CONSENT_KEY = 'cookie-consent';
const WELCOME_KEY = 'welcome-shown';
const STORAGE_TTL_DAYS = 365;

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.css'
})
export class CookieConsentComponent implements OnInit {
  isVisible = false;
  isHiding = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    const consent = this.getStoredValue(CONSENT_KEY);
    if (!consent) {
      setTimeout(() => {
        this.isVisible = true;
      }, 600);
    } else {
      this.showWelcomeNotification();
    }
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


