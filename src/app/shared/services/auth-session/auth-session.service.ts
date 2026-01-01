import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import { AuthApiService, LoginDto, LoginResponseData } from '../../../services/api/auth-api.service';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: string; // 'admin', etc.
};

type StoredSession = {
  token: string;
  user: AuthUser;
  createdAt: number;
};

const STORAGE_KEY = 'unlock.session.v1';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly api = inject(AuthApiService);
  private readonly subject = new BehaviorSubject<AuthUser | null>(null);
  readonly user$ = this.subject.asObservable();
  private tokenValue: string | null = null;

  constructor() {
    const stored = this.readSession();
    const token = stored?.token || null;
    const user = stored?.user || null;

    // Drop expired tokens eagerly (prevents “authenticated but broken” states).
    if (token && this.isTokenExpired(token)) {
      this.tokenValue = null;
      this.subject.next(null);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    } else {
      this.tokenValue = token;
      this.subject.next(user);
    }
  }

  get user(): AuthUser | null {
    return this.subject.value;
  }

  get token(): string | null {
    return this.tokenValue;
  }

  get isAuthenticated(): boolean {
    if (!this.subject.value || !this.tokenValue) return false;
    if (this.isTokenExpired(this.tokenValue)) {
      this.logout();
      return false;
    }
    return true;
  }

  login(dto: LoginDto, remember: boolean): Observable<AuthUser> {
    return this.api.login(dto).pipe(
      tap((data) => this.persistSessionFromLogin(data, remember)),
      map((data) => this.subject.value || this.toAuthUser(data)),
    );
  }

  logout(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.tokenValue = null;
    this.subject.next(null);
  }

  private readSession(): StoredSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredSession | null;
      if (!parsed?.token || !parsed?.user?.email) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private persistSessionFromLogin(data: LoginResponseData, remember: boolean): void {
    const user = this.toAuthUser(data);
    const payload: StoredSession = { token: data.token, user, createdAt: Date.now() };
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
      (remember ? window.localStorage : window.sessionStorage).setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
    this.tokenValue = data.token;
    this.subject.next(user);
  }

  private toAuthUser(data: LoginResponseData): AuthUser {
    const u = data.user;
    const email = (u.email || '').trim().toLowerCase();
    const name =
      (u.firstName || u.lastName)
        ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
        : (email.includes('@') ? email.split('@')[0] : email) || 'Utilisateur';
    return {
      id: u.id,
      email,
      role: u.role,
      displayName: this.titleCase(name.replace(/[._-]+/g, ' ')).trim() || 'Utilisateur',
    };
  }

  private titleCase(s: string): string {
    return (s || '')
      .split(' ')
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  private isTokenExpired(token: string): boolean {
    // JWT: header.payload.signature (payload is base64url JSON with "exp" in seconds)
    try {
      const parts = (token || '').split('.');
      if (parts.length < 2) return false;
      const payload = parts[1];
      const json = this.base64UrlDecode(payload);
      const data = JSON.parse(json) as { exp?: number };
      if (typeof data.exp !== 'number') return false;
      return Date.now() >= data.exp * 1000;
    } catch {
      // If token is not parseable, treat it as not expired (avoid logging users out unexpectedly).
      return false;
    }
  }

  private base64UrlDecode(input: string): string {
    const normalized = (input || '').replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLen);
    // atob is browser-only; this service is browser-oriented (guards with window checks elsewhere).
    return typeof window !== 'undefined' ? window.atob(padded) : '';
  }
}


