import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, of } from 'rxjs';
import { switchMap, takeUntil, map, catchError } from 'rxjs/operators';

import { TrainingsService } from '../../services/trainings/trainings.service';
import { Training } from '../../interfaces/training.interface';
import { UploadApiService } from '../../services/api/upload-api.service';
import { TrainingEnrollmentsApiService } from '../../services/api/training-enrollments-api.service';
import { NotificationService } from '../../services/notification.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';

type RoleChoice = 'individual' | 'company' | 'trainer' | 'candidate';

@Component({
  selector: 'app-training-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatRippleModule, MatIconModule, NgOptimizedImage],
  templateUrl: './training-register.component.html',
  styleUrls: ['./training-register.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingRegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trainingRegisterParallax', { static: false }) trainingRegisterParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;

  private route = inject(ActivatedRoute);
  private trainingsService = inject(TrainingsService);
  private fb = inject(FormBuilder);
  private uploadService = inject(UploadApiService);
  private enrollmentsApi = inject(TrainingEnrollmentsApiService);
  private notify = inject(NotificationService);
  private gsapScroll = inject(GsapScrollService);
  private pageLoaderInline = inject(PageLoaderInlineService);
  router = inject(Router);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  upcomingSessions: { id: string; label: string }[] = [];
  successMessage: string | null = null; // legacy UI hidden
  submitError: string | null = null; // legacy UI hidden

  training?: Training;
  loading = false;
  error: string | null = null;
  submitting = false;

  roles: { value: RoleChoice; label: string; description: string }[] = [
    { value: 'individual', label: 'Particulier', description: 'Inscription personnelle' },
    { value: 'company', label: 'Entreprise', description: 'Pour votre équipe ou collaborateurs' },
    { value: 'trainer', label: 'Formateur', description: 'Formateur souhaitant intervenir' },
    { value: 'candidate', label: 'Candidat', description: 'Étudiant ou demandeur d’emploi' },
  ];

  formats = [
    { value: 'presentiel', label: 'Présentiel' },
    { value: 'distanciel', label: 'Distanciel' },
    { value: 'hybride', label: 'Hybride' },
  ];

  form = this.fb.group({
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

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        map((params) => params.get('slug') ?? ''),
        switchMap((slug) => {
          this.loading = true;
          this.error = null;
          return this.trainingsService.getTrainingBySlug(slug).pipe(
          map((training) => {
            this.loading = false;
            this.training = training;
            if (!training) {
              this.error = 'Formation non trouvée';
              this.upcomingSessions = [];
            }
            this.prepareSessions(training);
            this.cdr.markForCheck();
            return training;
          }),
            catchError((err) => {
              this.loading = false;
              this.error = 'Erreur lors du chargement de la formation';
              console.error('Error loading training:', err);
            this.upcomingSessions = [];
            this.cdr.markForCheck();
              return of(undefined);
            })
          );
        })
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.trainingRegisterParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.trainingRegisterParallax.nativeElement,
              -0.25,
              'top top',
              'bottom top'
            );
          }, 50);
        }
      });
  }

  ngOnDestroy(): void {
    this.heroParallaxTween?.scrollTrigger?.kill();
    this.heroParallaxTween?.kill();
    this.heroParallaxTween = undefined;
    this.destroy$.next();
    this.destroy$.complete();
  }

  getImageUrl(path?: string): string {
    if (!path) return '/assets/images/img/p1.jpg';
    return this.uploadService.getImageUrlFromPath(path);
  }

  private prepareSessions(training?: Training): void {
    if (!training || !training.sessions || !training.sessions.length) {
      this.upcomingSessions = [];
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.upcomingSessions = training.sessions
      .map((s) => ({
        ...s,
        start: new Date(s.startDate),
        end: new Date(s.endDate),
      }))
      .filter((s) => !isNaN(s.start.getTime()) && s.start.getTime() >= today.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((s) => {
        const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const label =
          s.end && !isNaN(s.end.getTime()) && s.end.getTime() !== s.start.getTime()
            ? `Du ${s.start.toLocaleDateString('fr-FR', opts)} au ${s.end.toLocaleDateString('fr-FR', opts)}`
            : s.start.toLocaleDateString('fr-FR', opts);
        return { id: s.id, label };
      });
  }

  isCompany(): boolean {
    return this.form.get('role')?.value === 'company';
  }

  isIndividual(): boolean {
    return this.form.get('role')?.value === 'individual';
  }

  isTrainer(): boolean {
    return this.form.get('role')?.value === 'trainer';
  }

  isCandidate(): boolean {
    return this.form.get('role')?.value === 'candidate';
  }

  onSubmit(): void {
    if (this.form.invalid || !this.training) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.successMessage = null;
    this.submitError = null;

    const payload = {
      trainingId: this.training.id,
      sessionId: this.form.value.sessionId || null,
      role: this.form.value.role as any,
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

    this.enrollmentsApi.create(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Demande envoyée', 'Nous revenons vers vous rapidement.');
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/trainings', this.training?.slug]), 800);
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.message || 'Erreur lors de l’inscription';
        this.submitError = msg;
        this.notify.error('Erreur', msg);
        this.cdr.markForCheck();
      }
    });
  }
}

