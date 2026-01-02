import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

/**
 * Service Analytics avec consentement RGPD
 * 
 * Usage:
 * - Injecter AnalyticsService dans votre composant/service
 * - Le service écoute automatiquement les événements de consentement
 * - Appeler trackPageView(), trackEvent() uniquement après consentement
 * 
 * Configuration:
 * - GA4: Définir GA4_MEASUREMENT_ID dans environment.ts
 * - Facebook Pixel: Définir FACEBOOK_PIXEL_ID dans environment.ts
 * - Matomo: Définir MATOMO_URL et MATOMO_SITE_ID dans environment.ts
 */

// Type pour Facebook Pixel fbq (fonction avec propriétés)
interface FacebookPixelFunction {
  (...args: any[]): void;
  q?: any[][];
  l?: number;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: FacebookPixelFunction;
    _paq?: any[];
  }
}

type ConsentType = 'analytics' | 'marketing';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private consentGiven = false;
  private analyticsConsent = false;
  private marketingConsent = false;

  // IDs depuis environment (à configurer)
  private readonly ga4Id = environment.ga4MeasurementId || '';
  private readonly fbPixelId = environment.facebookPixelId || '';
  private readonly matomoUrl = environment.matomoUrl || '';
  private readonly matomoSiteId = environment.matomoSiteId || '';

  constructor() {
    if (!this.isBrowser) return;

    // Écouter les changements de consentement
    document.addEventListener('cookieConsentChanged', ((e: CustomEvent) => {
      const status = e.detail?.status;
      if (status === 'accepted') {
        // Si accepté, on considère que tous les consentements sont donnés
        // TODO: Implémenter un système de consentement granulaire si nécessaire
        this.analyticsConsent = true;
        this.marketingConsent = true;
        this.consentGiven = true;
        this.initialize();
      } else {
        this.consentGiven = false;
        this.analyticsConsent = false;
        this.marketingConsent = false;
      }
    }) as EventListener);

    // Vérifier le consentement existant au démarrage
    this.checkExistingConsent();
  }

  private checkExistingConsent(): void {
    if (!this.isBrowser) return;

    try {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent) return;

      const payload = JSON.parse(consent);
      if (payload?.value === 'accepted' && payload?.expires > Date.now()) {
        this.analyticsConsent = true;
        this.marketingConsent = true;
        this.consentGiven = true;
        this.initialize();
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Initialise les scripts analytics uniquement si consentement donné
   */
  private initialize(): void {
    if (!this.isBrowser || !this.consentGiven) return;

    if (this.analyticsConsent) {
      this.initGA4();
      this.initMatomo();
    }

    if (this.marketingConsent) {
      this.initFacebookPixel();
    }
  }

  /**
   * Initialise Google Analytics 4
   */
  private initGA4(): void {
    if (!this.ga4Id || typeof window === 'undefined') return;

    // Créer dataLayer si inexistant
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer!.push(arguments);
    };

    // Charger le script GA4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.ga4Id}`;
    document.head.appendChild(script);

    // Configuration initiale
    window.gtag('js', new Date());
    window.gtag('config', this.ga4Id, {
      anonymize_ip: true, // RGPD: anonymiser les IP
      allow_google_signals: false, // Désactiver les signaux Google par défaut
      allow_ad_personalization_signals: false,
    });
  }

  /**
   * Initialise Facebook Pixel
   */
  private initFacebookPixel(): void {
    if (!this.fbPixelId || typeof window === 'undefined') return;

    // Créer fbq si inexistant
    if (!window.fbq) {
      const fbqQueue: any[][] = [];
      const fbqFunction = function(...args: any[]) {
        fbqQueue.push(args);
      } as FacebookPixelFunction;
      fbqFunction.q = fbqQueue;
      fbqFunction.l = +new Date();
      window.fbq = fbqFunction;
    } else {
      window.fbq.l = +new Date();
    }

    // Charger le script Facebook Pixel
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://connect.facebook.net/en_US/fbevents.js`;
    document.head.appendChild(script);

    // Initialiser le pixel (fbq est maintenant garanti d'exister)
    const fbq = window.fbq!;
    fbq('init', this.fbPixelId);
    fbq('track', 'PageView');
  }

  /**
   * Initialise Matomo
   */
  private initMatomo(): void {
    if (!this.matomoUrl || !this.matomoSiteId || typeof window === 'undefined') return;

    window._paq = window._paq || [];

    // Configuration Matomo
    window._paq.push(['trackPageView']);
    window._paq.push(['enableLinkTracking']);

    // Charger le script Matomo
    const script = document.createElement('script');
    script.async = true;
    script.src = `${this.matomoUrl}/matomo.js`;
    document.head.appendChild(script);

    // Créer l'élément de tracking
    const trackingScript = document.createElement('script');
    trackingScript.type = 'text/javascript';
    trackingScript.innerHTML = `
      var _paq = window._paq = window._paq || [];
      _paq.push(['setSiteId', ${this.matomoSiteId}]);
      _paq.push(['setTrackerUrl', '${this.matomoUrl}/matomo.php']);
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
    `;
    document.head.appendChild(trackingScript);
  }

  /**
   * Track une page view (appeler après navigation)
   */
  trackPageView(url?: string): void {
    if (!this.consentGiven || !this.isBrowser) return;

    const pageUrl = url || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '');

    if (this.analyticsConsent) {
      // GA4
      if (window.gtag) {
        window.gtag('config', this.ga4Id, {
          page_path: pageUrl,
        });
      }

      // Matomo
      if (window._paq) {
        window._paq.push(['setCustomUrl', pageUrl]);
        window._paq.push(['trackPageView']);
      }
    }

    // Facebook Pixel track automatiquement les page views
  }

  /**
   * Track un événement personnalisé
   */
  trackEvent(
    eventName: string,
    eventParams?: Record<string, any>,
    consentType: ConsentType = 'analytics'
  ): void {
    if (!this.consentGiven || !this.isBrowser) return;

    if (consentType === 'analytics' && this.analyticsConsent) {
      // GA4
      if (window.gtag) {
        window.gtag('event', eventName, eventParams);
      }

      // Matomo
      if (window._paq) {
        window._paq.push(['trackEvent', eventName, ...Object.values(eventParams || {})]);
      }
    }

    if (consentType === 'marketing' && this.marketingConsent) {
      // Facebook Pixel
      const fbq = window.fbq;
      if (fbq) {
        fbq('track', eventName, eventParams);
      }
    }
  }

  /**
   * Vérifie si le consentement a été donné
   */
  hasConsent(): boolean {
    return this.consentGiven;
  }
}

