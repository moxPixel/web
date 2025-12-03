import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  notifications$!: Observable<Notification[]>;

  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notifications$ = this.notificationService.notifications$;

    if (!('NotificationSystem' in window)) {
      (window as any).NotificationSystem = {
        show: (opts: any) => this.notificationService.show(opts),
        success: (title: string, message: string, duration?: number) =>
          this.notificationService.success(title, message, duration),
        info: (title: string, message: string, duration?: number) =>
          this.notificationService.info(title, message, duration),
        warning: (title: string, message: string, duration?: number) =>
          this.notificationService.warning(title, message, duration),
        error: (title: string, message: string, duration?: number) =>
          this.notificationService.error(title, message, duration)
      };
    }
  }

  ngOnDestroy(): void {
    if ((window as any).NotificationSystem) {
      delete (window as any).NotificationSystem;
    }
  }

  trackById(_: number, notification: Notification): string {
    return notification.id;
  }
}


