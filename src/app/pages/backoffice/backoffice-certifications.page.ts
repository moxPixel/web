import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';

import { CertificationApi, CertificationQueryParams, CertificationStatus, CertificationType } from '../../interfaces/certification-api.interface';
import { BackofficeCertificationsService } from '../../services/backoffice/backoffice-certifications.service';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

type StatusFilter = 'all' | CertificationStatus;
type TypeFilter = 'all' | CertificationType;

@Component({
  selector: 'app-backoffice-certifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TablerIconComponent, UiChoiceGroupComponent, UiButtonDirective, UiInputDirective],
  templateUrl: './backoffice-certifications.page.html',
  styleUrl: './backoffice-certifications.page.css',
})
export class BackofficeCertificationsPage implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly bo = inject(BackofficeCertificationsService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  certifications: CertificationApi[] = [];
  hasLoaded = false;

  search = '';
  status: StatusFilter = 'all';
  type: TypeFilter = 'all';

  private readonly queryChange$ = new Subject<void>();

  protected readonly statusOptions: UiChoiceOption<StatusFilter>[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'active', label: 'Actives' },
    { value: 'inactive', label: 'Inactives' },
  ];

  protected readonly typeOptions: UiChoiceOption<TypeFilter>[] = [
    { value: 'all', label: 'Tous' },
    { value: 'RNCP', label: 'RNCP' },
    { value: 'RS', label: 'RS' },
    { value: 'Other', label: 'Autres' },
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
            this.certifications = items;
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
    this.router.navigate(['/backoffice/certifications/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/backoffice/certifications', id, 'edit']);
  }

  delete(id: string): void {
    if (!confirm('Supprimer cette certification ?')) return;
    this.bo
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Supprimé', 'La certification a été supprimée.');
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
    this.type = 'all';
    this.scheduleLoad();
  }

  private buildQuery(): CertificationQueryParams {
    return {
      limit: 200,
      search: this.search || undefined,
      status: this.status === 'all' ? undefined : this.status,
      type: this.type === 'all' ? undefined : (this.type as string),
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    };
  }

  badgeForStatus(s: CertificationStatus): string {
    return s === 'active' ? 'Active' : 'Inactive';
  }

  fmtDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}


