import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';

import { AnchoredPanelComponent } from '../../shared/components/anchored-panel/anchored-panel.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { EnrollmentMineItem, EnrollmentRole, EnrollmentStatus } from '../../services/api/training-enrollments-api.service';
import { BackofficeEnrollmentsService } from '../../services/backoffice/backoffice-enrollments.service';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

type StatusFilter = 'all' | EnrollmentStatus;
type RoleFilter = 'all' | EnrollmentRole;

@Component({
  selector: 'app-backoffice-enrollments-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TablerIconComponent,
    UiButtonDirective,
    UiInputDirective,
    UiChoiceGroupComponent,
    AnchoredPanelComponent,
  ],
  templateUrl: './backoffice-enrollments.page.html',
  styleUrl: './backoffice-enrollments.page.css',
})
export class BackofficeEnrollmentsPage implements OnInit, OnDestroy {
  private readonly bo = inject(BackofficeEnrollmentsService);
  private readonly destroy$ = new Subject<void>();
  private readonly queryChange$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly notifications = inject(NotificationService);

  enrollments: EnrollmentMineItem[] = [];
  total = 0;
  hasLoaded = false;

  search = '';
  status: StatusFilter = 'all';
  role: RoleFilter = 'all';

  filtersOpen = false;
  filtersAnchor: HTMLElement | null = null;

  expandedId: string | null = null;
  updatingStatusId: string | null = null;

  protected readonly statusOptions: UiChoiceOption<StatusFilter>[] = [
    { value: 'all', label: 'Tous' },
    { value: 'submitted', label: 'Soumise' },
    { value: 'in_review', label: 'En revue' },
    { value: 'accepted', label: 'Acceptée' },
    { value: 'rejected', label: 'Rejetée' },
    { value: 'cancelled', label: 'Annulée' },
  ];

  protected readonly roleOptions: UiChoiceOption<RoleFilter>[] = [
    { value: 'all', label: 'Tous' },
    { value: 'individual', label: 'Particulier' },
    { value: 'company', label: 'Entreprise' },
    { value: 'trainer', label: 'Formateur' },
    { value: 'candidate', label: 'Candidat' },
  ];

  protected readonly manageStatusOptions: UiChoiceOption<EnrollmentStatus>[] = [
    { value: 'submitted', label: 'Soumise' },
    { value: 'in_review', label: 'En revue' },
    { value: 'accepted', label: 'Acceptée' },
    { value: 'rejected', label: 'Rejetée' },
    { value: 'cancelled', label: 'Annulée' },
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

  scheduleLoad(): void {
    this.queryChange$.next();
  }

  load(): void {
    const query = this.buildQuery();
    this.bo
      .list(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            this.enrollments = res.data || [];
            this.total = res.pagination?.total ?? this.enrollments.length;
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

  toggleFilters(anchor: HTMLElement): void {
    this.filtersAnchor = anchor;
    this.filtersOpen = !this.filtersOpen;
  }
  closeFilters(): void {
    this.filtersOpen = false;
  }

  activeFiltersCount(): number {
    let n = 0;
    if (this.status !== 'all') n += 1;
    if (this.role !== 'all') n += 1;
    return n;
  }

  clearFilters(): void {
    this.search = '';
    this.status = 'all';
    this.role = 'all';
    this.scheduleLoad();
  }

  toggleRow(e: EnrollmentMineItem): void {
    this.expandedId = this.expandedId === e.id ? null : e.id;
  }

  isExpanded(e: EnrollmentMineItem): boolean {
    return this.expandedId === e.id;
  }

  setEnrollmentStatus(e: EnrollmentMineItem, status: EnrollmentStatus): void {
    if (!e?.id) return;
    if (e.status === status) return;
    this.updatingStatusId = e.id;
    const prev = e.status;
    e.status = status;

    this.bo
      .updateStatus(e.id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.updatingStatusId = null;
          this.notifications.success('Statut mis à jour', `Statut: ${this.badgeStatus(status)}. Email envoyé automatiquement.`);
          this.load();
        },
        error: (err: Error) => {
          e.status = prev;
          this.updatingStatusId = null;
          this.notifications.error('Mise à jour impossible', err.message || 'Erreur lors de la mise à jour du statut');
          this.cdr.detectChanges();
        },
      });
  }

  displayName(e: EnrollmentMineItem): string {
    const firstName = this.anyField<string>(e, 'firstName') || '';
    const lastName = this.anyField<string>(e, 'lastName') || '';
    const email = this.anyField<string>(e, 'email') || '';
    const name = `${firstName} ${lastName}`.trim();
    return name || email || 'Demande';
  }

  displayEmail(e: EnrollmentMineItem): string {
    return this.anyField<string>(e, 'email') || '';
  }

  trainingLabel(e: EnrollmentMineItem): string {
    return e.training?.shortTitle || e.training?.title || e.trainingId || 'Formation';
  }

  sessionLabel(e: EnrollmentMineItem): string {
    const s = e.session;
    if (!s?.startDate) return 'À planifier';
    const d = this.safeDate(s.startDate);
    return d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'À planifier';
  }

  messageOf(e: EnrollmentMineItem): string {
    return this.anyField<string>(e, 'message') || '';
  }

  objectivesOf(e: EnrollmentMineItem): string {
    return this.anyField<string>(e, 'objectives') || '';
  }

  roleOf(e: EnrollmentMineItem): string {
    return this.anyField<string>(e, 'role') || '';
  }

  phoneOf(e: EnrollmentMineItem): string {
    return this.anyField<string>(e, 'phone') || '';
  }

  companyOf(e: EnrollmentMineItem): string {
    return this.anyField<string>(e, 'companyName') || '';
  }

  preferredFormatOf(e: EnrollmentMineItem): string {
    return this.anyField<string>(e, 'preferredFormat') || '';
  }

  desiredDateOf(e: EnrollmentMineItem): string {
    return this.anyField<string>(e, 'desiredDate') || '';
  }

  badgeStatus(status: EnrollmentStatus): string {
    if (status === 'submitted') return 'Soumise';
    if (status === 'in_review') return 'En revue';
    if (status === 'accepted') return 'Acceptée';
    if (status === 'rejected') return 'Rejetée';
    if (status === 'cancelled') return 'Annulée';
    return status;
  }

  fmtDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return (
      d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  }

  private safeDate(v?: string | Date | null): Date | null {
    if (!v) return null;
    const d = typeof v === 'string' ? new Date(v) : v;
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private buildQuery(): {
    page: number;
    limit: number;
    search?: string;
    status?: EnrollmentStatus;
    role?: EnrollmentRole;
  } {
    return {
      page: 1,
      limit: 200,
      search: this.search || undefined,
      status: this.status === 'all' ? undefined : this.status,
      role: this.role === 'all' ? undefined : this.role,
    };
  }

  private anyField<T>(obj: unknown, key: string): T | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    return (obj as any)[key] as T | undefined;
  }
}


