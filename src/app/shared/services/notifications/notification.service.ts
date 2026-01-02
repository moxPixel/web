import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationState = 'entering' | 'visible' | 'leaving';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  createdAt: number;
  durationMs: number;
  state: NotificationState;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly items$ = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.items$.asObservable();
  private dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private isLoaderHidden = false;
  private pendingNotifications: Array<Omit<AppNotification, 'id' | 'createdAt' | 'state'>> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Check if loader already gone
      if (!document.getElementById('page-loader')) {
        this.isLoaderHidden = true;
      } else {
        // Wait for loader-hidden event
        const onLoaderHidden = () => {
          this.isLoaderHidden = true;
          // Process any pending notifications
          this.pendingNotifications.forEach((notif) => this.push(notif));
          this.pendingNotifications = [];
        };
        window.addEventListener('app-loader-hidden', onLoaderHidden as any, { once: true } as any);
      }
    }
  }

  info(title: string, message: string, durationMs = 4200): void {
    this.push({ type: 'info', title, message, durationMs });
  }

  success(title: string, message: string, durationMs = 4200): void {
    this.push({ type: 'success', title, message, durationMs });
  }

  warning(title: string, message: string, durationMs = 5200): void {
    this.push({ type: 'warning', title, message, durationMs });
  }

  error(title: string, message: string, durationMs = 6500): void {
    this.push({ type: 'error', title, message, durationMs });
  }

  dismiss(id: string): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }

    this.updateState(id, 'leaving');
    setTimeout(() => {
      this.items$.next(this.items$.value.filter((n) => n.id !== id));
    }, 500);
  }

  clear(): void {
    this.dismissTimers.forEach((timer) => clearTimeout(timer));
    this.dismissTimers.clear();
    this.items$.next([]);
  }

  private push(input: Omit<AppNotification, 'id' | 'createdAt' | 'state'>): void {
    // If loader is still visible, queue the notification
    if (!this.isLoaderHidden) {
      this.pendingNotifications.push(input);
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const createdAt = Date.now();
    const durationMs = Math.max(1200, Math.min(20_000, Number(input.durationMs) || 4200));

    const item: AppNotification = { ...input, id, createdAt, durationMs, state: 'entering' };
    this.items$.next([item, ...this.items$.value].slice(0, 4));

    // Transition to 'visible' state after animation frame
    this.runOutsideAngularFrame(() => {
      this.updateState(id, 'visible');
    });

    if (typeof window !== 'undefined' && durationMs > 0) {
      const timer = setTimeout(() => this.dismiss(id), durationMs);
      this.dismissTimers.set(id, timer);
    }
  }

  private updateState(id: string, state: NotificationState): void {
    this.items$.next(
      this.items$.value.map((notification) =>
        notification.id === id ? { ...notification, state } : notification
      )
    );
  }

  private runOutsideAngularFrame(callback: () => void): void {
    if (typeof window === 'undefined') {
      callback();
      return;
    }

    if ('requestAnimationFrame' in window) {
      requestAnimationFrame(() => requestAnimationFrame(callback));
    } else {
      setTimeout(callback, 0);
    }
  }
}


