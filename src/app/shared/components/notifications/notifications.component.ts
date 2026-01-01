import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { TablerIconComponent } from '../../icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../services/notifications/notification.service';
import { UiButtonDirective } from '../../../ui/ui-button.directive';
import { UiCardDirective } from '../../../ui/ui-card.directive';
import type { TablerIconName } from '../../icons/tabler-icons.registry';
import type { AppNotification, NotificationType } from '../../services/notifications/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  private readonly notifications = inject(NotificationService);
  readonly notifications$ = this.notifications.notifications$;

  trackById(_: number, n: AppNotification): string {
    return n.id;
  }

  iconFor(type: NotificationType): TablerIconName {
    switch (type) {
      case 'success':
        return 'circle-check';
      case 'warning':
        return 'info-circle';
      case 'error':
        return 'x';
      default:
        return 'sparkles';
    }
  }

  dismiss(id: string): void {
    this.notifications.dismiss(id);
  }
}


