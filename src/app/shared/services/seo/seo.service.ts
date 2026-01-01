import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { getSiteBaseUrl } from '../../config/site-url';
import type { SeoRouteData, SeoRobots } from './seo.types';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Apply immediately (first load) + on each navigation.
    this.applyRouteSeo();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.applyRouteSeo());
  }

  /**
   * Use for dynamic pages (ex: training detail) after data is loaded.
   */
  set(seo: SeoRouteData): void {
    const baseUrl = getSiteBaseUrl();

    const title = seo.title ? this.withBrand(seo.title) : 'Unlock Formation';
    const description = seo.description || 'Formations Tech & IA — Bootcamp, alternance, certifiantes. Unlock.';
    const canonical = seo.canonicalPath ? this.absUrl(seo.canonicalPath, baseUrl) : this.absUrl(this.router.url, baseUrl);
    const robots: SeoRobots = seo.robots || 'index,follow';
    const ogType = seo.ogType || 'website';
    const image = seo.image ? this.absMaybe(seo.image, baseUrl) : this.absUrl('/assets/images/logo/logo-dark.png', baseUrl);

    this.title.setTitle(title);

    this.setMetaTag('name', 'description', description);
    this.setMetaTag('name', 'robots', robots);

    // Canonical
    this.setCanonical(canonical);

    // OpenGraph
    this.setMetaTag('property', 'og:site_name', 'Unlock Formation');
    this.setMetaTag('property', 'og:title', title);
    this.setMetaTag('property', 'og:description', description);
    this.setMetaTag('property', 'og:type', ogType);
    this.setMetaTag('property', 'og:url', canonical);
    this.setMetaTag('property', 'og:image', image);

    // Twitter
    this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    this.setMetaTag('name', 'twitter:title', title);
    this.setMetaTag('name', 'twitter:description', description);
    this.setMetaTag('name', 'twitter:image', image);

    // JSON-LD
    this.setJsonLd(seo.jsonLd ?? null);
  }

  private applyRouteSeo(): void {
    // Walk to deepest child to get the most specific route data
    let r = this.router.routerState.snapshot.root;
    while (r.firstChild) r = r.firstChild;

    const seo = (r.data?.['seo'] || {}) as SeoRouteData;
    this.set(seo);
  }

  private withBrand(t: string): string {
    const s = String(t || '').trim();
    if (!s) return 'Unlock Formation';
    if (s.toLowerCase().includes('unlock')) return s;
    return `${s} • Unlock`;
  }

  private setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
    if (!content) return;
    this.meta.updateTag({ [attr]: key, content } as any);
  }

  private setCanonical(url: string): void {
    if (typeof document === 'undefined') return;
    const head = document.head;
    if (!head) return;
    let link = head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: SeoRouteData['jsonLd']): void {
    if (typeof document === 'undefined') return;
    const head = document.head;
    if (!head) return;
    const id = 'ui-jsonld';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!data) {
      if (script) script.remove();
      return;
    }
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      head.appendChild(script);
    }
    script.text = JSON.stringify(data);
  }

  private absUrl(pathOrUrl: string, baseUrl: string): string {
    const raw = String(pathOrUrl || '').trim();
    if (!raw) return baseUrl;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    // strip query/hash for canonical
    const clean = path.split('#')[0].split('?')[0];
    return `${baseUrl}${clean}`;
  }

  private absMaybe(pathOrUrl: string, baseUrl: string): string {
    const raw = String(pathOrUrl || '').trim();
    if (!raw) return this.absUrl('/', baseUrl);
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
    return this.absUrl(raw, baseUrl);
  }
}


