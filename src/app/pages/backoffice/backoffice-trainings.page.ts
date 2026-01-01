import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';

import { TrainingApi, TrainingLevel, TrainingQueryParams, TrainingType, AudienceType } from '../../interfaces/training-api.interface';
import { BackofficeTrainingsService } from '../../services/backoffice/backoffice-trainings.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';
type LevelFilter = 'all' | TrainingLevel;
type TrainingTypeFilter = 'all' | TrainingType;
type AudienceTypeFilter = 'all' | AudienceType;

@Component({
  selector: 'app-backoffice-trainings-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TablerIconComponent, UiChoiceGroupComponent, UiButtonDirective, UiInputDirective],
  templateUrl: './backoffice-trainings.page.html',
  styleUrl: './backoffice-trainings.page.css',
})
export class BackofficeTrainingsPage implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly bo = inject(BackofficeTrainingsService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  trainings: TrainingApi[] = [];
  hasLoaded = false;

  search = '';
  status: StatusFilter = 'all';
  level: LevelFilter = 'all';
  trainingType: TrainingTypeFilter = 'all';
  audienceType: AudienceTypeFilter = 'all';

  private readonly queryChange$ = new Subject<void>();

  protected readonly statusOptions: UiChoiceOption<StatusFilter>[] = [
    { value: 'all', label: 'Tous' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'published', label: 'Publié' },
    { value: 'archived', label: 'Archivé' },
  ];

  protected readonly levelOptions: UiChoiceOption<LevelFilter>[] = [
    { value: 'all', label: 'Tous' },
    { value: TrainingLevel.INITIATION, label: 'Initiation' },
    { value: TrainingLevel.INTERMEDIAIRE, label: 'Intermédiaire' },
    { value: TrainingLevel.AVANCE, label: 'Avancé' },
    { value: TrainingLevel.EXPERT, label: 'Expert' },
  ];

  ngOnInit(): void {
    // Auto-load on any filter change (debounced)
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
            this.trainings = items;
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
    this.router.navigate(['/backoffice/trainings/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/backoffice/trainings', id, 'edit']);
  }

  delete(id: string): void {
    if (!confirm('Supprimer cette formation ?')) return;
    this.bo
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Supprimé', 'La formation a été supprimée.');
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
    this.level = 'all';
    this.trainingType = 'all';
    this.audienceType = 'all';
    this.scheduleLoad();
  }

  private buildQuery(): TrainingQueryParams {
    return {
      limit: 200,
      search: this.search || undefined,
      status: this.status === 'all' ? undefined : this.status,
      level: this.level === 'all' ? undefined : this.level,
      trainingType: this.trainingType === 'all' ? undefined : this.trainingType,
      audienceType: this.audienceType === 'all' ? undefined : this.audienceType,
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    };
  }

  badgeForStatus(s: TrainingApi['status']): string {
    if (s === 'published') return 'Publié';
    if (s === 'draft') return 'Brouillon';
    return 'Archivé';
  }

  fmtDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}


