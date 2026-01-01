import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';

import { Contact, ContactStatus, ContactType, RequestType, ContactQueryParams } from '../../interfaces/contact.interface';
import { BackofficeContactsService } from '../../services/backoffice/backoffice-contacts.service';
import { AnchoredPanelComponent } from '../../shared/components/anchored-panel/anchored-panel.component';
import { EmailComposerComponent } from '../../shared/components/email-composer/email-composer.component';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

@Component({
  selector: 'app-backoffice-contacts-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TablerIconComponent,
    UiButtonDirective,
    UiCardDirective,
    UiInputDirective,
    UiChoiceGroupComponent,
    AnchoredPanelComponent,
    EmailComposerComponent,
  ],
  templateUrl: './backoffice-contacts.page.html',
  styleUrl: './backoffice-contacts.page.css',
})
export class BackofficeContactsPage implements OnInit, OnDestroy {
  private readonly bo = inject(BackofficeContactsService);
  private readonly destroy$ = new Subject<void>();
  private readonly queryChange$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly notifications = inject(NotificationService);

  contacts: Contact[] = [];
  total = 0;
  hasLoaded = false;

  search = '';
  status: 'all' | ContactStatus = 'all';
  contactType: 'all' | ContactType = 'all';
  requestType: 'all' | RequestType = 'all';

  filtersOpen = false;
  filtersAnchor: HTMLElement | null = null;

  replyOpen = false;
  selectedContact: Contact | null = null;
  markResponded = true;

  newMailOpen = false;
  newMailAnchor: HTMLElement | null = null;

  expandedId: string | null = null;
  updatingStatusId: string | null = null;

  protected readonly statusOptions: UiChoiceOption<'all' | ContactStatus>[] = [
    { value: 'all', label: 'Tous' },
    { value: ContactStatus.PENDING, label: 'En attente' },
    { value: ContactStatus.IN_PROGRESS, label: 'En cours' },
    { value: ContactStatus.RESPONDED, label: 'Répondu' },
    { value: ContactStatus.ARCHIVED, label: 'Archivé' },
  ];

  protected readonly manageStatusOptions: UiChoiceOption<ContactStatus>[] = [
    { value: ContactStatus.PENDING, label: 'En attente' },
    { value: ContactStatus.IN_PROGRESS, label: 'En cours' },
    { value: ContactStatus.RESPONDED, label: 'Répondu' },
    { value: ContactStatus.ARCHIVED, label: 'Archivé' },
  ];

  protected readonly contactTypeOptions: UiChoiceOption<'all' | ContactType>[] = [
    { value: 'all', label: 'Tous' },
    { value: ContactType.PARTICULIER, label: 'Particulier' },
    { value: ContactType.ENTREPRISE, label: 'Entreprise' },
    { value: ContactType.AUTRE, label: 'Autre' },
  ];

  protected readonly requestTypeOptions: UiChoiceOption<'all' | RequestType>[] = [
    { value: 'all', label: 'Tous' },
    { value: RequestType.FORMATION, label: 'Formation' },
    { value: RequestType.DEVIS, label: 'Devis' },
    { value: RequestType.INFORMATION, label: 'Information' },
    { value: RequestType.AUTRE, label: 'Autre' },
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
            this.contacts = res.data || [];
            this.total = res.pagination?.total ?? this.contacts.length;
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
    if (this.contactType !== 'all') n += 1;
    if (this.requestType !== 'all') n += 1;
    return n;
  }

  clearFilters(): void {
    this.search = '';
    this.status = 'all';
    this.contactType = 'all';
    this.requestType = 'all';
    this.scheduleLoad();
  }

  openReply(c: Contact, _anchor: HTMLElement): void {
    this.selectedContact = c;
    this.replyOpen = true;
    this.markResponded = true;
  }
  closeReply(): void {
    this.replyOpen = false;
    this.selectedContact = null;
  }

  onEmailSent(ev: { to: string; cc?: string; subject: string; message: string }): void {
    // 1) persist response to contact
    const c = this.selectedContact;
    if (!c) return;

    const nextStatus = this.markResponded ? ContactStatus.RESPONDED : ContactStatus.IN_PROGRESS;
    this.bo
      .update(c.id, { response: ev.message, status: nextStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeReply();
          this.load();
          this.notifications.success('Email envoyé', `Réponse envoyée à ${ev.to}${ev.cc ? ` (Cc: ${ev.cc})` : ''}.`);
        },
        error: (err: Error) => {
          this.notifications.error('Sauvegarde impossible', err.message || 'Erreur lors de la sauvegarde');
        },
      });
  }

  openNewMail(anchor: HTMLElement): void {
    this.newMailAnchor = anchor;
    this.newMailOpen = true;
  }

  closeNewMail(): void {
    this.newMailOpen = false;
  }

  onNewMailSent(ev: { to: string; cc?: string; subject: string; message: string }): void {
    // Email already sent by the component; here we just close + show success.
    this.newMailOpen = false;
    this.notifications.success('Email envoyé', `Email envoyé à ${ev.to}${ev.cc ? ` (Cc: ${ev.cc})` : ''}.`);
  }

  deleteContact(c: Contact): void {
    if (!confirm(`Supprimer la demande de contact de ${c.email} ?`)) return;
    this.bo
      .delete(c.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.load();
          this.notifications.success('Supprimé', 'La demande a été supprimée.');
        },
        error: (err: Error) => {
          this.notifications.error('Suppression impossible', err.message || 'Erreur lors de la suppression');
        },
      });
  }

  toggleRow(c: Contact): void {
    this.expandedId = this.expandedId === c.id ? null : c.id;
  }

  isExpanded(c: Contact): boolean {
    return this.expandedId === c.id;
  }

  setContactStatus(c: Contact, status: ContactStatus): void {
    if (!c?.id) return;
    if (c.status === status) return;
    this.updatingStatusId = c.id;
    // Optimistic UI
    const prev = c.status;
    c.status = status;

    this.bo
      .update(c.id, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          // Keep list in sync (backend may also update respondedAt/respondedBy)
          Object.assign(c, updated);
          this.updatingStatusId = null;
          this.cdr.detectChanges();
          this.notifications.success('Statut mis à jour', 'La demande a été mise à jour.');
        },
        error: (err: Error) => {
          c.status = prev;
          this.updatingStatusId = null;
          this.notifications.error('Mise à jour impossible', err.message || 'Erreur lors de la mise à jour du statut');
          this.cdr.detectChanges();
        },
      });
  }

  displayName(c: Contact): string {
    return c.companyName || (c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.email);
  }

  responderLabel(c: Contact): string {
    const r: any = (c as any).responder;
    if (!r) return '';
    const name = `${r.firstName || ''} ${r.lastName || ''}`.trim();
    return name || r.email || '';
  }

  badgeStatus(status: ContactStatus): string {
    if (status === ContactStatus.PENDING) return 'En attente';
    if (status === ContactStatus.IN_PROGRESS) return 'En cours';
    if (status === ContactStatus.RESPONDED) return 'Répondu';
    if (status === ContactStatus.ARCHIVED) return 'Archivé';
    return status;
  }

  statusClass(status: ContactStatus): 'is-draft' | 'is-archived' | '' {
    if (status === ContactStatus.PENDING) return 'is-draft';
    if (status === ContactStatus.ARCHIVED) return 'is-archived';
    return '';
  }

  fmtDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  replySubjectFor(c: Contact): string {
    return `Re: Votre demande de contact (${c.requestType})`;
  }

  private buildQuery(): ContactQueryParams {
    return {
      page: 1,
      limit: 200,
      search: this.search || undefined,
      status: this.status === 'all' ? undefined : this.status,
      contactType: this.contactType === 'all' ? undefined : this.contactType,
      requestType: this.requestType === 'all' ? undefined : this.requestType,
    };
  }
}


