import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, of, switchMap, takeUntil } from 'rxjs';

import { CreateSessionDto, SessionStatus, UpdateSessionDto } from '../../interfaces/session-api.interface';
import { LocationType, TrainingApi, TrainingSessionApi } from '../../interfaces/training-api.interface';
import { BackofficeSessionsService } from '../../services/backoffice/backoffice-sessions.service';
import { BackofficeTrainingsService } from '../../services/backoffice/backoffice-trainings.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

@Component({
  selector: 'app-backoffice-session-form-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TablerIconComponent, UiChoiceGroupComponent, UiButtonDirective, UiCardDirective, UiInputDirective],
  templateUrl: './backoffice-session-form.page.html',
  styleUrl: './backoffice-session-form.page.css',
})
export class BackofficeSessionFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessions = inject(BackofficeSessionsService);
  private readonly trainings = inject(BackofficeTrainingsService);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  saving = false;
  hydrated = false;

  isEdit = false;
  sessionId: string | null = null;

  trainingsOptions: Array<{ id: string; title: string }> = [];

  readonly LocationType = LocationType;
  protected readonly statusOptions: UiChoiceOption<SessionStatus>[] = [
    { value: 'scheduled', label: 'Planifiée' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' },
  ];

  readonly form = this.fb.group({
    trainingId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    locationType: [LocationType.DISTANCIEL as LocationType],
    location: [''],
    seats: [null as number | null],
    seatsAvailable: [null as number | null],
    price: [null as number | null],
    status: ['scheduled' as SessionStatus, Validators.required],
    highlight: [false],
  });

  get locationType(): LocationType {
    return this.form.get('locationType')?.value || LocationType.DISTANCIEL;
  }

  get showLocationField(): boolean {
    return this.locationType !== LocationType.DISTANCIEL;
  }

  ngOnInit(): void {
    // Load trainings for select (best-effort).
    this.trainings
      .list({ limit: 300 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items: TrainingApi[]) => {
          this.trainingsOptions = (items || []).map((t) => ({ id: t.id, title: t.title }));
        },
        error: () => {
          this.trainingsOptions = [];
        },
      });

    // Check for trainingId in query params (when coming from training form)
    const trainingIdFromQuery = this.route.snapshot.queryParamMap.get('trainingId');
    const returnToTraining = this.route.snapshot.queryParamMap.get('returnTo') === 'training';

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((p) => {
          const id = p.get('id');
          this.sessionId = id;
          this.isEdit = !!id;
          this.hydrated = !id; // new forms are ready immediately

          // If creating new session and trainingId provided, pre-fill it
          if (!id && trainingIdFromQuery) {
            this.form.patchValue({ trainingId: trainingIdFromQuery });
            this.hydrated = true;
            return of(null);
          }

          if (!id) return of(null);
          return this.sessions.getById(id);
        }),
      )
      .subscribe({
        next: (s: TrainingSessionApi | null) => {
          if (s) this.patch(s);
          this.hydrated = true;
        },
        error: (err: Error) => {
          this.notifications.error('Chargement impossible', err.message || 'Erreur lors du chargement');
          this.hydrated = true;
        },
      });

    // Store returnToTraining for navigation after save
    if (returnToTraining && trainingIdFromQuery) {
      (this as any).returnToTrainingId = trainingIdFromQuery;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  back(): void {
    this.router.navigate(['/backoffice/sessions']);
  }

  submit(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.warning('Champs requis', 'Veuillez corriger les champs requis.');
      return;
    }

    this.saving = true;

    const v = this.form.getRawValue();
    
    // Construire location selon locationType (comme dans web/)
    let location: string | undefined = undefined;
    if (v.locationType === LocationType.DISTANCIEL) {
      location = undefined;
    } else if (v.locationType === LocationType.PRESENTIEL) {
      location = v.location || 'Présentiel';
    } else if (v.locationType === LocationType.HYBRIDE) {
      location = v.location || 'Hybride';
    }

    const dto: CreateSessionDto = {
      trainingId: v.trainingId!,
      startDate: this.toDateOrString(v.startDate!),
      endDate: this.toDateOrString(v.endDate!),
      location,
      seats: v.seats ?? undefined,
      seatsAvailable: v.seatsAvailable ?? undefined,
      price: v.price ?? undefined,
      status: v.status!,
      highlight: !!v.highlight,
    };

    const req$ = this.isEdit && this.sessionId
      ? this.sessions.update(this.sessionId, dto as UpdateSessionDto)
      : this.sessions.create(dto);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.notifications.success('Enregistré', this.isEdit ? 'Session mise à jour.' : 'Session créée.');
        // If we came from training form, return there
        const returnToTrainingId = (this as any).returnToTrainingId;
        if (returnToTrainingId) {
          this.router.navigate(['/backoffice/trainings', returnToTrainingId, 'edit'], {
            queryParams: { tab: 'sessions' }
          });
        } else {
          this.router.navigate(['/backoffice/sessions']);
        }
      },
      error: (err: Error) => {
        this.saving = false;
        this.notifications.error('Sauvegarde impossible', err.message || 'Erreur lors de la sauvegarde');
      },
    });
  }

  private patch(s: TrainingSessionApi): void {
    // Déterminer locationType à partir de location
    let locationType = LocationType.DISTANCIEL;
    if (s.location) {
      const loc = s.location.toLowerCase();
      if (loc.includes('hybride')) locationType = LocationType.HYBRIDE;
      else if (loc.includes('présentiel') || loc.includes('presentiel')) locationType = LocationType.PRESENTIEL;
      else locationType = LocationType.PRESENTIEL; // Si location existe, par défaut présentiel
    }

    this.form.patchValue({
      trainingId: s.trainingId,
      startDate: this.toInputDateTime(s.startDate),
      endDate: this.toInputDateTime(s.endDate),
      locationType,
      location: s.location || '',
      seats: s.seats ?? null,
      seatsAvailable: s.seatsAvailable ?? null,
      price: s.price ?? null,
      status: s.status,
      highlight: !!s.highlight,
    });
  }

  private toInputDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  private toDateOrString(input: string): Date | string {
    // Convertir datetime-local en Date
    if (input.includes('T')) {
      return new Date(input);
    }
    // Si format date simple (YYYY-MM-DD), convertir
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return new Date(`${input}T00:00:00.000Z`);
    }
    return input;
  }

  toggleLocationType(type: LocationType): void {
    this.form.patchValue({ locationType: type });
    if (type === LocationType.DISTANCIEL) {
      this.form.patchValue({ location: '' });
    }
  }
}


