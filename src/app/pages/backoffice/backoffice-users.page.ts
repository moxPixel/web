import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';

import { UserApi, UserRole, UserStatus, UserQueryParams } from '../../interfaces/user-api.interface';
import { BackofficeUsersService } from '../../services/backoffice/backoffice-users.service';
import { AnchoredPanelComponent } from '../../shared/components/anchored-panel/anchored-panel.component';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

@Component({
  selector: 'app-backoffice-users-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TablerIconComponent,
    UiChoiceGroupComponent,
    UiButtonDirective,
    UiInputDirective,
    AnchoredPanelComponent,
  ],
  templateUrl: './backoffice-users.page.html',
  styleUrl: './backoffice-users.page.css',
})
export class BackofficeUsersPage implements OnInit, OnDestroy {
  private readonly bo = inject(BackofficeUsersService);
  private readonly destroy$ = new Subject<void>();
  private readonly queryChange$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly notifications = inject(NotificationService);

  users: UserApi[] = [];
  total = 0;
  hasLoaded = false;

  search = '';
  role: 'all' | string = 'all';
  status: 'all' | string = 'all';

  filtersOpen = false;
  filtersAnchor: HTMLElement | null = null;

  protected readonly roleOptions: UiChoiceOption<'all' | string>[] = [
    { value: 'all', label: 'Tous' },
    { value: UserRole.ADMIN, label: 'Admin' },
    { value: UserRole.USER, label: 'User' },
    { value: UserRole.INDIVIDUAL, label: 'Particulier' },
    { value: UserRole.COMPANY, label: 'Entreprise' },
    { value: UserRole.TRAINER, label: 'Formateur' },
    { value: UserRole.CANDIDATE, label: 'Candidat' },
  ];

  protected readonly statusOptions: UiChoiceOption<'all' | string>[] = [
    { value: 'all', label: 'Tous' },
    { value: UserStatus.PENDING, label: 'Pending' },
    { value: UserStatus.ACTIVE, label: 'Active' },
    { value: UserStatus.INACTIVE, label: 'Inactive' },
    { value: UserStatus.SUSPENDED, label: 'Suspended' },
  ];

  protected readonly statusQuickOptions: Array<{ value: UserStatus; label: string }> = [
    { value: UserStatus.ACTIVE, label: 'Activer' },
    { value: UserStatus.SUSPENDED, label: 'Suspendre' },
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

  toggleFilters(anchor: HTMLElement): void {
    this.filtersAnchor = anchor;
    this.filtersOpen = !this.filtersOpen;
  }

  closeFilters(): void {
    this.filtersOpen = false;
  }

  activeFiltersCount(): number {
    let n = 0;
    if (this.role !== 'all') n += 1;
    if (this.status !== 'all') n += 1;
    return n;
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
            this.users = res.data || [];
            this.total = res.pagination?.total ?? this.users.length;
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

  clearFilters(): void {
    this.search = '';
    this.role = 'all';
    this.status = 'all';
    this.scheduleLoad();
  }

  displayName(u: UserApi): string {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return name || u.email;
  }

  badgeRole(role: string): string {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'user') return 'User';
    if (r === 'individual') return 'Particulier';
    if (r === 'company') return 'Entreprise';
    if (r === 'trainer') return 'Formateur';
    if (r === 'candidate') return 'Candidat';
    return role || '—';
  }

  badgeStatus(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'Pending';
    if (s === 'active') return 'Active';
    if (s === 'inactive') return 'Inactive';
    if (s === 'suspended') return 'Suspended';
    return status || '—';
  }

  statusClass(status: string): 'is-draft' | 'is-archived' | '' {
    const s = (status || '').toLowerCase();
    if (s === 'pending' || s === 'inactive') return 'is-draft';
    if (s === 'suspended') return 'is-archived';
    return '';
  }

  fmtDate(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  updateStatus(u: UserApi, next: UserStatus): void {
    if (!confirm(`Mettre à jour le statut de ${u.email} vers "${next}" ?`)) return;
    this.bo
      .updateStatus(u.id, { status: next })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Statut mis à jour', 'Utilisateur mis à jour.');
          this.load();
        },
        error: (err: Error) => {
          this.notifications.error('Mise à jour impossible', err.message || 'Erreur lors de la mise à jour');
        },
      });
  }

  deleteUser(u: UserApi): void {
    if (!confirm(`Supprimer l'utilisateur ${u.email} ?`)) return;
    this.bo
      .delete(u.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Supprimé', 'Utilisateur supprimé.');
          this.load();
        },
        error: (err: Error) => {
          this.notifications.error('Suppression impossible', err.message || 'Erreur lors de la suppression');
        },
      });
  }

  private buildQuery(): UserQueryParams {
    return {
      limit: 200,
      search: this.search || undefined,
      role: this.role === 'all' ? undefined : this.role,
      status: this.status === 'all' ? undefined : this.status,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };
  }
}


