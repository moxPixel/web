import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';

import { EventApi, EventQueryParams, EventStatus, EventType } from '../../interfaces/event-api.interface';
import { BackofficeEventsService } from '../../services/backoffice/backoffice-events.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

type StatusFilter = 'all' | EventStatus;
type TypeFilter = 'all' | EventType;

@Component({
  selector: 'app-backoffice-events-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TablerIconComponent, UiChoiceGroupComponent, UiButtonDirective, UiInputDirective],
  templateUrl: './backoffice-events.page.html',
  styleUrl: './backoffice-events.page.css',
})
export class BackofficeEventsPage implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly bo = inject(BackofficeEventsService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  events: EventApi[] = [];
  hasLoaded = false;

  search = '';
  status: StatusFilter = 'all';
  eventType: TypeFilter = 'all';

  private readonly queryChange$ = new Subject<void>();

  protected readonly statusOptions: UiChoiceOption<StatusFilter>[] = [
    { value: 'all', label: 'Tous' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'published', label: 'Publié' },
    { value: 'archived', label: 'Archivé' },
  ];

  protected readonly typeOptions: UiChoiceOption<TypeFilter>[] = [
    { value: 'all', label: 'Tous' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'atelier', label: 'Atelier' },
    { value: 'conference', label: 'Conférence' },
    { value: 'meetup', label: 'Meetup' },
    { value: 'portes-ouvertes', label: 'Portes ouvertes' },
    { value: 'autre', label: 'Autre' },
  ];

  ngOnInit(): void {
    this.queryChange$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(200),
        map(() => JSON.stringify(this.buildQuery())),
        distinctUntilChanged(),
      )
      .subscribe(() => this.load());

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    const query = this.buildQuery();
    this.bo
      .list(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.ngZone.run(() => {
            this.events = items;
            this.hasLoaded = true;
            this.cdr.detectChanges();
          });
        },
        error: (err: Error) => {
          this.ngZone.run(() => {
            this.notifications.error('Chargement impossible', err.message || 'Erreur lors du chargement');
            this.hasLoaded = true;
            this.cdr.detectChanges();
          });
        },
      });
  }

  scheduleLoad(): void {
    this.queryChange$.next();
  }

  create(): void {
    this.router.navigate(['/backoffice/events/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/backoffice/events', id, 'edit']);
  }

  delete(id: string): void {
    if (!confirm('Supprimer cet événement ?')) return;
    this.bo
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Supprimé', "L'événement a été supprimé.");
          this.load();
        },
        error: (err: Error) => {
          this.notifications.error('Suppression impossible', err.message || 'Erreur lors de la suppression');
        },
      });
  }

  clearFilters(): void {
    this.search = '';
    this.status = 'all';
    this.eventType = 'all';
    this.scheduleLoad();
  }

  badgeForStatus(s: EventApi['status']): string {
    if (s === 'published') return 'Publié';
    if (s === 'draft') return 'Brouillon';
    return 'Archivé';
  }

  fmtDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private buildQuery(): EventQueryParams {
    return {
      limit: 200,
      search: this.search || undefined,
      status: this.status === 'all' ? undefined : this.status,
      eventType: this.eventType === 'all' ? undefined : this.eventType,
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    };
  }
}


