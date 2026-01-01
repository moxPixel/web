import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, of, switchMap, takeUntil } from 'rxjs';

import { CreateEventDto, EventApi, EventStatus, EventType, UpdateEventDto } from '../../interfaces/event-api.interface';
import { BackofficeEventsService } from '../../services/backoffice/backoffice-events.service';
import { UploadApiService, UploadResponse } from '../../services/api/upload-api.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

@Component({
  selector: 'app-backoffice-event-form-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TablerIconComponent, UiChoiceGroupComponent, UiButtonDirective, UiCardDirective, UiInputDirective],
  templateUrl: './backoffice-event-form.page.html',
  styleUrl: './backoffice-event-form.page.css',
})
export class BackofficeEventFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bo = inject(BackofficeEventsService);
  private readonly upload = inject(UploadApiService);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  saving = false;
  hydrated = false;

  isEdit = false;
  eventId: string | null = null;

  private slugTouched = false;

  coverPreview: string | null = null;
  private coverBlobUrl: string | null = null;
  coverUploading = false;
  coverUploadProgress = 0;

  protected readonly statusOptions: UiChoiceOption<EventStatus>[] = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'published', label: 'Publié' },
    { value: 'archived', label: 'Archivé' },
  ];

  protected readonly typeOptions: UiChoiceOption<EventType>[] = [
    { value: 'webinar', label: 'Webinar' },
    { value: 'atelier', label: 'Atelier' },
    { value: 'conference', label: 'Conférence' },
    { value: 'meetup', label: 'Meetup' },
    { value: 'portes-ouvertes', label: 'Portes ouvertes' },
    { value: 'autre', label: 'Autre' },
  ];

  readonly form = this.fb.group({
    title: ['', Validators.required],
    slug: ['', Validators.required],
    status: ['draft' as EventStatus, Validators.required],
    eventType: ['autre' as EventType, Validators.required],
    highlight: [false],

    startDate: ['', Validators.required],
    endDate: [''],
    isOnline: [false],
    location: [''],
    registrationUrl: [''],

    excerpt: [''],
    description: [''],

    coverImage: [''],
  });

  get isOnline(): boolean {
    return !!this.form.get('isOnline')?.value;
  }

  ngOnInit(): void {
    // Autoslug unless user touches it
    this.form
      .get('slug')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.slugTouched = true));
    this.form
      .get('title')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((title) => {
        const t = String(title || '');
        if (!this.slugTouched) this.form.get('slug')?.setValue(this.slugify(t), { emitEvent: false });
      });

    // Preview sync
    this.form
      .get('coverImage')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((v) => {
        if (this.coverUploading) return;
        const val = String(v || '').trim();
        if (!val) this.coverPreview = null;
        else this.coverPreview = this.upload.getImageUrlFromPath(val);
      });

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((p) => {
          const id = p.get('id');
          this.eventId = id;
          this.isEdit = !!id;
          this.hydrated = !id;
          if (!id) return of(null);
          return this.bo.getById(id);
        }),
      )
      .subscribe({
        next: (e: EventApi | null) => {
          if (e) this.patch(e);
          this.hydrated = true;
        },
        error: (err: Error) => {
          this.notifications.error('Chargement impossible', err.message || 'Erreur lors du chargement');
          this.hydrated = true;
        },
      });
  }

  ngOnDestroy(): void {
    if (this.coverBlobUrl) URL.revokeObjectURL(this.coverBlobUrl);
    this.destroy$.next();
    this.destroy$.complete();
  }

  back(): void {
    this.router.navigate(['/backoffice/events']);
  }

  submit(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const v = this.form.getRawValue();

    const dto: CreateEventDto = {
      title: String(v.title || '').trim(),
      slug: String(v.slug || '').trim(),
      status: v.status as EventStatus,
      eventType: v.eventType as EventType,
      highlight: !!v.highlight,
      startDate: this.toIsoFromDatetimeLocal(String(v.startDate || '')),
      endDate: v.endDate ? this.toIsoFromDatetimeLocal(String(v.endDate || '')) : undefined,
      isOnline: !!v.isOnline,
      location: v.location ? String(v.location || '').trim() : undefined,
      registrationUrl: v.registrationUrl ? String(v.registrationUrl || '').trim() : undefined,
      excerpt: v.excerpt ? String(v.excerpt || '').trim() : undefined,
      description: v.description ? String(v.description || '').trim() : undefined,
      coverImage: v.coverImage ? String(v.coverImage || '').trim() : undefined,
    };

    const req$ = this.isEdit && this.eventId ? this.bo.update(this.eventId, dto as UpdateEventDto) : this.bo.create(dto);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/backoffice/events']);
      },
      error: (err: Error) => {
        this.saving = false;
        this.notifications.error('Sauvegarde impossible', err.message || 'Erreur lors de la sauvegarde');
      },
    });
  }

  onCoverSelected(file: File | null): void {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.notifications.warning('Fichier invalide', 'Veuillez sélectionner une image.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    if (this.coverBlobUrl) URL.revokeObjectURL(this.coverBlobUrl);
    this.coverBlobUrl = localUrl;
    this.coverPreview = localUrl;

    this.coverUploading = true;
    this.coverUploadProgress = 0;

    this.upload
      .uploadImageWithProgress(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ progress, response }: { progress: number; response?: UploadResponse }) => {
          this.coverUploadProgress = progress;
          if (response?.url) {
            // Store backend path (e.g. "/uploads/images/x.webp")
            this.form.get('coverImage')?.setValue(response.url, { emitEvent: false });
            this.coverPreview = this.upload.getImageUrlFromPath(response.url);
            this.coverUploading = false;
          }
        },
        error: (err: Error) => {
          this.coverUploading = false;
          this.notifications.error('Upload impossible', err.message || "Erreur lors de l'upload");
        },
      });
  }

  clearCover(): void {
    if (this.coverUploading) return;
    this.form.get('coverImage')?.setValue('');
    this.coverPreview = null;
  }

  private patch(e: EventApi): void {
    this.form.patchValue({
      title: e.title || '',
      slug: e.slug || '',
      status: e.status || 'draft',
      eventType: e.eventType || 'autre',
      highlight: !!e.highlight,
      startDate: this.toDatetimeLocal(e.startDate),
      endDate: e.endDate ? this.toDatetimeLocal(e.endDate) : '',
      isOnline: !!e.isOnline,
      location: e.location || '',
      registrationUrl: e.registrationUrl || '',
      excerpt: e.excerpt || '',
      description: e.description || '',
      coverImage: e.coverImage || '',
    });
    this.slugTouched = true;
    this.coverPreview = e.coverImage ? this.upload.getImageUrlFromPath(e.coverImage) : null;
  }

  private slugify(s: string): string {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private toIsoFromDatetimeLocal(value: string): string {
    // datetime-local is local time; convert to ISO
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toISOString();
  }
}


