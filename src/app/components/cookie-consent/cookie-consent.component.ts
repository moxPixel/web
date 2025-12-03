import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { NotificationService } from '../../services/notification.service';
import { getRippleColorAuto } from '../../utils/ripple.util';

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
export class CookieConsentComponent implements OnInit {
  isVisible = false;
  isHiding = false;

  get rippleColor(): string {
    return getRippleColorAuto();
  }

  constructor(
    private notificationService: NotificationService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const consent = this.getStoredValue(CONSENT_KEY);
    if (!consent) {
      // Attendre que le loader soit complètement disparu avant d'afficher le cookie consent
      this.waitForLoaderToHide().then(() => {
        setTimeout(() => {
          this.isVisible = true;
        }, 600);
      });
    } else {
      this.showWelcomeNotification();
    }
  }

  /**
   * Attendre que le page loader soit complètement caché
   */
  private waitForLoaderToHide(): Promise<void> {
    return new Promise((resolve) => {
      // Vérifier si le loader est déjà caché
      const checkLoader = () => {
        const loader = this.document.getElementById('page-loader');
        const isLoaderHidden = this.document.body.classList.contains('loader-hidden');

        if (!loader || isLoaderHidden) {
          resolve();
          return;
        }

        // Observer les changements sur le body pour détecter l'ajout de la classe loader-hidden
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const target = mutation.target as HTMLElement;
              if (target.classList.contains('loader-hidden')) {
                observer.disconnect();
                resolve();
              }
            }
          });
        });

        observer.observe(this.document.body, {
          attributes: true,
          attributeFilter: ['class']
        });

        // Timeout de sécurité au cas où le loader ne disparaîtrait pas
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 5000);
      };

      // Attendre que le DOM soit prêt
      if (this.document.readyState === 'loading') {
        this.document.addEventListener('DOMContentLoaded', checkLoader, { once: true });
      } else {
        checkLoader();
      }
    });
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


