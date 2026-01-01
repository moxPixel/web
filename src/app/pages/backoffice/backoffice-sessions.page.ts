import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';

import { SessionQueryParams, SessionStatus } from '../../interfaces/session-api.interface';
import { TrainingSessionApi } from '../../interfaces/training-api.interface';
import { BackofficeSessionsService } from '../../services/backoffice/backoffice-sessions.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

type StatusFilter = 'all' | SessionStatus;

@Component({
  selector: 'app-backoffice-sessions-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TablerIconComponent, UiChoiceGroupComponent, UiButtonDirective, UiInputDirective],
  templateUrl: './backoffice-sessions.page.html',
  styleUrl: './backoffice-sessions.page.css',
})
export class BackofficeSessionsPage implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly bo = inject(BackofficeSessionsService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  sessions: TrainingSessionApi[] = [];
  hasLoaded = false;

  trainingId = '';
  status: StatusFilter = 'all';
  highlight: 'all' | 'true' | 'false' = 'all';

  private readonly queryChange$ = new Subject<void>();

  protected readonly statusOptions: UiChoiceOption<StatusFilter>[] = [
    { value: 'all', label: 'Tous' },
    { value: 'scheduled', label: 'Planifiée' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' },
  ];

  protected readonly highlightOptions: UiChoiceOption<'all' | 'true' | 'false'>[] = [
    { value: 'all', label: 'Tous' },
    { value: 'true', label: 'Oui' },
    { value: 'false', label: 'Non' },
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
            this.sessions = items;
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
    this.router.navigate(['/backoffice/sessions/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/backoffice/sessions', id, 'edit']);
  }

  delete(id: string): void {
    if (!confirm('Supprimer cette session ?')) return;
    this.bo
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Supprimé', 'La session a été supprimée.');
          this.load();
        },
        error: (err: Error) => {
          this.notifications.error('Suppression impossible', err.message || 'Erreur lors de la suppression');
        },
      });
  }

  clearFilters(): void {
    this.trainingId = '';
    this.status = 'all';
    this.highlight = 'all';
    this.scheduleLoad();
  }

  private buildQuery(): SessionQueryParams {
    return {
      limit: 300,
      trainingId: this.trainingId || undefined,
      status: this.status === 'all' ? undefined : this.status,
      highlight: this.highlight === 'all' ? undefined : this.highlight === 'true',
      sortBy: 'startDate',
      sortOrder: 'DESC',
    };
  }

  fmtDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
}


