import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, map, of, switchMap, takeUntil } from 'rxjs';

import { Training } from '../../interfaces/training.interface';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { CreateEnrollmentPayload, EnrollmentRole, TrainingEnrollmentsApiService } from '../../services/api/training-enrollments-api.service';
import { UploadApiService } from '../../services/api/upload-api.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiChoiceGroupComponent } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

type RoleChoice = EnrollmentRole;

@Component({
  selector: 'app-training-register-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TablerIconComponent, UiChoiceGroupComponent, UiButtonDirective, UiCardDirective, UiInputDirective],
  templateUrl: './training-register.page.html',
  styleUrl: './training-register.page.css',
})
export class TrainingRegisterPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  training?: Training;
  loadFailed = false;

  submitting = false;

  upcomingSessions: Array<{ id: string; label: string }> = [];

  readonly roles: Array<{ value: RoleChoice; label: string; description: string }> = [
    { value: 'individual', label: 'Particulier', description: 'Inscription personnelle' },
    { value: 'company', label: 'Entreprise', description: 'Pour votre équipe / collaborateurs' },
    { value: 'trainer', label: 'Formateur', description: 'Intervenir sur la formation' },
    { value: 'candidate', label: 'Candidat', description: 'Étudiant / demandeur d’emploi' },
  ];

  readonly formats: Array<{ value: 'presentiel' | 'distanciel' | 'hybride'; label: string }> = [
    { value: 'presentiel', label: 'Présentiel' },
    { value: 'distanciel', label: 'Distanciel' },
    { value: 'hybride', label: 'Hybride' },
  ];

  readonly form = this.fb.group({
    role: ['individual' as RoleChoice, Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    companyName: [''],
    jobTitle: [''],
    siret: [''],
    teamSize: [''],
    message: [''],
    preferredFormat: ['distanciel', Validators.required],
    sessionId: [''],
    desiredDate: [''],
    objectives: [''],
  });

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly trainings: TrainingsService,
    private readonly enrollmentsApi: TrainingEnrollmentsApiService,
    private readonly upload: UploadApiService,
  ) {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        map((p) => p.get('slug') ?? ''),
        switchMap((slug) => {
          this.loadFailed = false;
          this.training = undefined;
          return this.trainings.getTrainingBySlug(slug).pipe(
            map((t) => {
              this.training = t;
              if (!t) {
                this.loadFailed = true;
                this.notifications.error('Formation introuvable', 'Cette formation n’existe pas ou n’est plus disponible.');
              }
              this.prepareSessions(t);
              return t;
            }),
            catchError(() => {
              this.training = undefined;
              this.upcomingSessions = [];
              this.loadFailed = true;
              this.notifications.error('Chargement impossible', 'Erreur lors du chargement de la formation.');
              return of(undefined);
            }),
          );
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  back(): void {
    if (this.training?.slug) {
      this.router.navigate(['/trainings', this.training.slug]);
      return;
    }
    this.router.navigate(['/trainings']);
  }

  isCompany(): boolean {
    return this.form.get('role')?.value === 'company';
  }

  isIndividualOrCandidate(): boolean {
    const r = this.form.get('role')?.value;
    return r === 'individual' || r === 'candidate';
  }

  isTrainer(): boolean {
    return this.form.get('role')?.value === 'trainer';
  }

  onSubmit(): void {
    if (!this.training) {
      this.notifications.error('Impossible', 'Formation introuvable.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.warning('Formulaire incomplet', 'Veuillez compléter les champs requis.');
      return;
    }

    this.submitting = true;

    const payload: CreateEnrollmentPayload = {
      trainingId: this.training.id,
      sessionId: this.form.value.sessionId || null,
      role: this.form.value.role as EnrollmentRole,
      firstName: this.form.value.firstName!,
      lastName: this.form.value.lastName!,
      email: this.form.value.email!,
      phone: this.form.value.phone || undefined,
      companyName: this.form.value.companyName || undefined,
      jobTitle: this.form.value.jobTitle || undefined,
      siret: this.form.value.siret || undefined,
      teamSize: this.form.value.teamSize || undefined,
      message: this.form.value.message || undefined,
      preferredFormat: this.form.value.preferredFormat || undefined,
      desiredDate: this.form.value.desiredDate || undefined,
      objectives: this.form.value.objectives || undefined,
    };

    this.enrollmentsApi
      .create(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.notifications.success('Demande envoyée', 'Nous revenons vers vous sous 24–48h.');
          window.setTimeout(() => this.back(), 900);
        },
        error: (err: Error) => {
          this.submitting = false;
          this.notifications.error('Envoi impossible', err.message || "Erreur lors de l'inscription");
        },
      });
  }

  getImageUrl(path?: string): string {
    if (!path) return '/assets/images/img/p1.jpg';
    return this.upload.getImageUrlFromPath(path);
  }

  private prepareSessions(training?: Training): void {
    if (!training?.sessions?.length) {
      this.upcomingSessions = [];
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.upcomingSessions = training.sessions
      .map((s) => ({ ...s, start: new Date(s.startDate), end: new Date(s.endDate) }))
      .filter((s) => !Number.isNaN(s.start.getTime()) && s.start.getTime() >= today.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((s) => {
        const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const label =
          s.end && !Number.isNaN(s.end.getTime()) && s.end.getTime() !== s.start.getTime()
            ? `Du ${s.start.toLocaleDateString('fr-FR', opts)} au ${s.end.toLocaleDateString('fr-FR', opts)}`
            : s.start.toLocaleDateString('fr-FR', opts);
        return { id: s.id, label };
      });
  }
}


