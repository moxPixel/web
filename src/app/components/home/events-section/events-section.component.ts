import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { EventApi } from '../../../interfaces/event-api.interface';
import { EventsApiService } from '../../../services/api/events-api.service';
import { UploadApiService } from '../../../services/api/upload-api.service';
import { TablerIconComponent } from '../../../shared/icons/tabler-icon/tabler-icon.component';

@Component({
  selector: 'app-events-section',
  standalone: true,
  imports: [CommonModule, RouterLink, TablerIconComponent],
  templateUrl: './events-section.component.html',
  styleUrl: './events-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsSectionComponent implements OnInit {
  private readonly eventsApi = inject(EventsApiService);
  private readonly upload = inject(UploadApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  events: EventApi[] = [];
  hasLoaded = false;

  ngOnInit(): void {
    this.eventsApi
      .findAll({ status: 'published', upcoming: true, limit: 6, sortBy: 'startDate', sortOrder: 'ASC' })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const items = (res.data || []).slice();
          items.sort((a, b) => {
            const ha = a.highlight ? 1 : 0;
            const hb = b.highlight ? 1 : 0;
            if (ha !== hb) return hb - ha;
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          });
          this.events = items.slice(0, 3);
          this.hasLoaded = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[EventsSection] Failed to load events:', err);
          this.events = [];
          this.hasLoaded = true;
          this.cdr.markForCheck();
        },
      });
  }

  coverUrl(e: EventApi): string {
    if (!e.coverImage) return '/assets/images/img/p1.jpg';
    return this.upload.getImageUrlFromPath(e.coverImage);
  }

  dateLabel(e: EventApi): string {
    const d = new Date(e.startDate);
    if (Number.isNaN(d.getTime())) return 'Date à venir';
    const date = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${date} • ${time}`;
  }

  placeLabel(e: EventApi): string {
    if (e.isOnline) return 'En ligne';
    return e.location || 'Sur place';
  }

  typeLabel(e: EventApi): string {
    const t = e.eventType;
    if (t === 'portes-ouvertes') return 'Portes ouvertes';
    if (t === 'conference') return 'Conférence';
    if (t === 'meetup') return 'Meetup';
    if (t === 'atelier') return 'Atelier';
    if (t === 'webinar') return 'Webinar';
    return 'Événement';
  }
}


