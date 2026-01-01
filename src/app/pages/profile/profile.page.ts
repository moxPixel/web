import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, takeUntil } from 'rxjs/operators';

import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { TablerIconName } from '../../shared/icons/tabler-icons.registry';
import { AuthSessionService } from '../../shared/services/auth-session/auth-session.service';
import { Contact, ContactStatus } from '../../interfaces/contact.interface';
import { ContactsApiService } from '../../services/api/contacts-api.service';
import { EnrollmentMineItem, EnrollmentStatus, TrainingEnrollmentsApiService } from '../../services/api/training-enrollments-api.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

type ActivityKind = 'enrollment' | 'contact';

type ActivityItem = {
  kind: ActivityKind;
  id: string;
  ts: number;
  dateLabel: string;
  title: string;
  subtitle?: string;
  status: string;
  statusLabel: string;
  icon: TablerIconName;
  link?: { label: string; routerLink: any[] };
  detail?: string;
};

type ActivityVm =
  | { state: 'loading'; items: ActivityItem[] }
  | { state: 'ready'; items: ActivityItem[] };

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthSessionService);
  private readonly enrollmentsApi = inject(TrainingEnrollmentsApiService);
  private readonly contactsApi = inject(ContactsApiService);
  private readonly destroy$ = new Subject<void>();

  readonly activityVm$: Observable<ActivityVm> = combineLatest([
    this.enrollmentsApi.listMine().pipe(catchError(() => of([] as EnrollmentMineItem[]))),
    this.contactsApi.listMine().pipe(catchError(() => of([] as Contact[]))),
  ]).pipe(
    map(([enrollments, contacts]) => ({ state: 'ready' as const, items: this.toActivityItems(enrollments, contacts) })),
    startWith({ state: 'loading' as const, items: [] }),
    shareReplay({ bufferSize: 1, refCount: true }),
    takeUntil(this.destroy$),
  );

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  private toActivityItems(enrollments: EnrollmentMineItem[], contacts: Contact[]): ActivityItem[] {
    const out: ActivityItem[] = [];

    for (const e of enrollments || []) {
      const createdAt = this.safeDate(e.createdAt);
      const ts = createdAt?.getTime() ?? 0;
      out.push({
        kind: 'enrollment',
        id: e.id,
        ts,
        dateLabel: this.formatDate(createdAt),
        title: `Demande d’inscription`,
        subtitle: e.training?.shortTitle || e.training?.title || 'Formation',
        status: e.status,
        statusLabel: this.enrollmentStatusLabel(e.status),
        icon: 'calendar-event',
        link: e.training?.slug ? { label: 'Voir la formation', routerLink: ['/trainings', e.training.slug] } : undefined,
        detail: e.session?.startDate ? `Session: ${this.formatDate(this.safeDate(e.session.startDate))}` : undefined,
      });
    }

    for (const c of contacts || []) {
      const createdAt = this.safeDate(c.createdAt);
      const ts = createdAt?.getTime() ?? 0;
      const responded = c.status === ContactStatus.RESPONDED && !!c.response;
      out.push({
        kind: 'contact',
        id: c.id,
        ts,
        dateLabel: this.formatDate(createdAt),
        title: `Message envoyé`,
        subtitle: this.contactSubtitle(c),
        status: c.status,
        statusLabel: this.contactStatusLabel(c.status),
        icon: 'mail',
        link: { label: 'Nouveau message', routerLink: ['/contact'] },
        detail: responded ? c.response : undefined,
      });
    }

    return out.sort((a, b) => b.ts - a.ts).slice(0, 50);
  }

  private enrollmentStatusLabel(status: EnrollmentStatus | string): string {
    const s = (status || '').toLowerCase();
    if (s === 'submitted') return 'Soumise';
    if (s === 'in_review') return 'En revue';
    if (s === 'accepted') return 'Acceptée';
    if (s === 'rejected') return 'Refusée';
    if (s === 'cancelled') return 'Annulée';
    return status || '—';
  }

  private contactStatusLabel(status: ContactStatus | string): string {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'En attente';
    if (s === 'in_progress') return 'En cours';
    if (s === 'responded') return 'Répondu';
    if (s === 'archived') return 'Archivé';
    return status || '—';
  }

  private contactSubtitle(c: Contact): string {
    const rt = (c.requestType || '').toString();
    const sc = (c.subjectCategory || '').toString();
    const left = rt ? rt.replace(/_/g, ' ') : 'Demande';
    const right = sc ? sc.replace(/_/g, ' ') : '';
    return right ? `${left} • ${right}` : left;
  }

  private safeDate(v?: string | Date | null): Date | null {
    if (!v) return null;
    const d = typeof v === 'string' ? new Date(v) : v;
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private formatDate(d: Date | null): string {
    if (!d) return '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}


