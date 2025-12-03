import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration: number;
  state: 'entering' | 'visible' | 'leaving';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();

  private dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  show(options: {
    type?: NotificationType;
    title?: string;
    message: string;
    duration?: number;
  }): string {
    const {
      type = 'info',
      title,
      message,
      duration = 5000
    } = options;

    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      state: 'entering'
    };

    this.notificationsSubject.next([...this.notificationsSubject.value, notification]);

    this.runOutsideAngularFrame(() => {
      this.updateState(id, 'visible');
    });

    if (duration > 0) {
      const timer = setTimeout(() => this.hide(id), duration);
      this.dismissTimers.set(id, timer);
    }

    return id;
  }

  info(title: string, message: string, duration?: number): string {
    return this.show({ type: 'info', title, message, duration });
  }

  success(title: string, message: string, duration?: number): string {
    return this.show({ type: 'success', title, message, duration });
  }

  warning(title: string, message: string, duration?: number): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  error(title: string, message: string, duration?: number): string {
    return this.show({ type: 'error', title, message, duration });
  }

  hide(id: string): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }

    this.updateState(id, 'leaving');
    setTimeout(() => {
      this.notificationsSubject.next(
        this.notificationsSubject.value.filter((notification) => notification.id !== id)
      );
    }, 500);
  }

  private updateState(id: string, state: Notification['state']): void {
    this.notificationsSubject.next(
      this.notificationsSubject.value.map((notification) =>
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


