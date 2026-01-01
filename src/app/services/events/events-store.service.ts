import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { EventApi } from '../../interfaces/event-api.interface';
import { EventsApiService } from '../api/events-api.service';

export type EventsNextState = {
  hasUpcoming: boolean;
  nextEvent: EventApi | null;
  nextDateText: string | null;
  loaded: boolean;
};

@Injectable({ providedIn: 'root' })
export class EventsStoreService {
  private readonly api = inject(EventsApiService);

  private readonly subject = new BehaviorSubject<EventsNextState>({
    hasUpcoming: false,
    nextEvent: null,
    nextDateText: null,
    loaded: false,
  });

  readonly state$ = this.subject.asObservable();

  private inflight = false;

  constructor() {
    // Best-effort prefetch so the Three morph can render the date instantly.
    this.refresh();
  }

  refresh(): void {
    if (this.inflight) return;
    this.inflight = true;

    this.api
      .findAll({ status: 'published', upcoming: true, limit: 1, sortBy: 'startDate', sortOrder: 'ASC' })
      .subscribe({
        next: (res) => {
          const nextEvent = (res.data || [])[0] || null;
          const nextDateText = nextEvent ? this.formatDateText(nextEvent.startDate) : null;
          this.subject.next({
            hasUpcoming: !!nextEvent,
            nextEvent,
            nextDateText,
            loaded: true,
          });
          this.inflight = false;
        },
        error: () => {
          this.subject.next({
            hasUpcoming: false,
            nextEvent: null,
            nextDateText: null,
            loaded: true,
          });
          this.inflight = false;
        },
      });
  }

  private formatDateText(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'DATE À VENIR';
    const base = d
      .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace('.', '')
      .toUpperCase();
    return base;
  }
}


