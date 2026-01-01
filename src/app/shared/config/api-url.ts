/**
 * API base URL (matches `web/` convention).
 *
 * Controlled via Angular environments (SSOT):
 * - Dev: `environment.apiUrl` (e.g. `http://localhost:4000/api`)
 * - Prod: `environment.apiUrl` (e.g. `/api` behind a reverse proxy)
 */
import { environment } from '../../../environments/environment';

export function getApiBaseUrl(): string {
  const raw = String(environment.apiUrl || '').trim();
  if (!raw) return '/api';

  // Absolute URL (dev): keep as-is (no trailing slash)
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.replace(/\/+$/, '');
  }

  // Relative: ensure it is absolute-rooted so it doesn't become route-relative.
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, '');
}


