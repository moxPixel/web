import { environment } from '../../../environments/environment';

/**
 * Site base URL (SSOT).
 * Used for canonical URLs, OpenGraph URLs, and JSON-LD.
 */
export function getSiteBaseUrl(): string {
  const raw = String((environment as any).siteUrl || '').trim();
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  // Safe fallback for bots/SSR-less environments
  return 'https://www.unlock-formation.fr';
}


