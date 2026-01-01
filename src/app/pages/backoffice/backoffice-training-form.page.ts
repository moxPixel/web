import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, switchMap, takeUntil, of } from 'rxjs';

import { AudienceType, CreateTrainingDto, LocationType, TrainingApi, TrainingLevel, TrainingSessionApi, TrainingType, UpdateTrainingDto } from '../../interfaces/training-api.interface';
import { AiApiService, AiGenerateTrainingInput } from '../../services/api/ai-api.service';
import { AiFieldAssistantApiService, FieldAssistantAction } from '../../services/api/ai-field-assistant-api.service';
import { UploadApiService, UploadResponse } from '../../services/api/upload-api.service';
import { BackofficeSessionsService } from '../../services/backoffice/backoffice-sessions.service';
import { BackofficeTrainingsService } from '../../services/backoffice/backoffice-trainings.service';
import { AnchoredPanelComponent } from '../../shared/components/anchored-panel/anchored-panel.component';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

type TabKey = 'general' | 'content' | 'program' | 'media' | 'sessions';

@Component({
  selector: 'app-backoffice-training-form-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AnchoredPanelComponent,
    TablerIconComponent,
    UiChoiceGroupComponent,
    UiButtonDirective,
    UiCardDirective,
    UiInputDirective,
  ],
  templateUrl: './backoffice-training-form.page.html',
  styleUrl: './backoffice-training-form.page.css',
})
export class BackofficeTrainingFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bo = inject(BackofficeTrainingsService);
  private readonly sessions = inject(BackofficeSessionsService);
  private readonly ai = inject(AiApiService);
  private readonly aiField = inject(AiFieldAssistantApiService);
  private readonly upload = inject(UploadApiService);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  saving = false;
  hydrated = false;

  isEdit = false;
  trainingId: string | null = null;

  activeTab: TabKey = 'general';

  readonly LocationType = LocationType;
  protected readonly levelOptions: UiChoiceOption<TrainingLevel>[] = [
    { value: TrainingLevel.INITIATION, label: 'Initiation' },
    { value: TrainingLevel.INTERMEDIAIRE, label: 'Intermédiaire' },
    { value: TrainingLevel.AVANCE, label: 'Avancé' },
    { value: TrainingLevel.EXPERT, label: 'Expert' },
  ];

  protected readonly trainingTypeOptions: UiChoiceOption<TrainingType>[] = [
    { value: TrainingType.BOOTCAMP, label: 'Bootcamp' },
    { value: TrainingType.ALTERNANCE, label: 'Alternance' },
    { value: TrainingType.DIPLOMANTE, label: 'Diplômante' },
    { value: TrainingType.CERTIFIANTE, label: 'Certifiante' },
  ];

  protected readonly audienceTypeOptions: UiChoiceOption<AudienceType>[] = [
    { value: AudienceType.ENTREPRISE, label: 'Entreprise' },
    { value: AudienceType.MONTER_EN_COMPETENCE, label: 'Monter en compétence' },
    { value: AudienceType.RECONVERSION, label: 'Reconversion' },
  ];

  protected readonly statusOptions: UiChoiceOption<'draft' | 'published' | 'archived'>[] = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'published', label: 'Publié' },
    { value: 'archived', label: 'Archivé' },
  ];

  protected readonly aiLevelOptions: UiChoiceOption<'' | 'initiation' | 'intermediaire' | 'avance' | 'expert'>[] = [
    { value: '', label: 'Auto' },
    { value: 'initiation', label: 'Initiation' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' },
    { value: 'expert', label: 'Expert' },
  ];

  protected readonly aiAudienceOptions: UiChoiceOption<'' | 'entreprise' | 'monter-en-competence' | 'reconversion'>[] = [
    { value: '', label: 'Auto' },
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'monter-en-competence', label: 'Monter en compétence' },
    { value: 'reconversion', label: 'Reconversion' },
  ];

  private slugTouched = false;
  private shortTitleTouched = false;

  heroImagePreview: string | null = null;
  watermarkLogoPreview: string | null = null;
  private heroBlobUrl: string | null = null;
  private watermarkBlobUrl: string | null = null;
  heroImageUploading = false;
  watermarkLogoUploading = false;
  heroImageUploadProgress = 0;
  watermarkLogoUploadProgress = 0;

  aiGenerateOpen = false;
  aiGenerating = false;

  readonly aiGenerateForm = this.fb.group({
    trainingTitle: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    rncpCode: [''],
    rncpTitle: [''],
    durationDays: [null as number | null],
    totalHours: [null as number | null],
    level: ['' as '' | 'initiation' | 'intermediaire' | 'avance' | 'expert'],
    audienceType: ['' as '' | 'entreprise' | 'monter-en-competence' | 'reconversion'],
  });

  aiPopoverOpen = false;
  aiPopoverAnchor: HTMLElement | null = null;
  aiPopoverField: keyof typeof this.form.controls | null = null;
  aiPopoverLoading = false;
  aiPopoverAction: FieldAssistantAction | null = null;
  aiPopoverResult: string | null = null;
  aiPopoverSuggestions: string[] = [];
  aiPopoverSelected: string | null = null;

  sessionsList: TrainingSessionApi[] = [];
  sessionsLoading = false;

  readonly form = this.fb.group({
    title: ['', Validators.required],
    shortTitle: ['', Validators.required],
    slug: ['', Validators.required],
    category: [''],
    level: [TrainingLevel.INITIATION as TrainingLevel, Validators.required],
    trainingType: [TrainingType.BOOTCAMP as TrainingType, Validators.required],
    audienceType: [AudienceType.ENTREPRISE as AudienceType, Validators.required],
    status: ['draft' as 'draft' | 'published' | 'archived', Validators.required],

    tagline: [''],
    description: [''],
    format: [''],
    durationDays: [null as number | null],
    durationHours: [null as number | null],
    durationLabel: [''],
    pace: [''],
    priceFrom: [null as number | null],
    currency: ['EUR'],
    nextSessionHighlight: [''],

    locationTypes: this.fb.control<LocationType[]>([]),

    objectives: this.fb.array<string>([]),
    fundingOptions: this.fb.array<string>([]),
    targetAudience: this.fb.array<string>([]),
    prerequisites: this.fb.array<string>([]),
    outcomes: this.fb.array<string>([]),

    modules: this.fb.array([]),

    heroImage: [''],
    watermarkLogo: [''],
  });

  hasFieldValue(field: keyof typeof this.form.controls): boolean {
    const v = this.form.get(field)?.value;
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return true;
    return !!v;
  }

  get objectives(): FormArray {
    return this.form.get('objectives') as FormArray;
  }
  get fundingOptions(): FormArray {
    return this.form.get('fundingOptions') as FormArray;
  }
  get targetAudience(): FormArray {
    return this.form.get('targetAudience') as FormArray;
  }
  get prerequisites(): FormArray {
    return this.form.get('prerequisites') as FormArray;
  }
  get outcomes(): FormArray {
    return this.form.get('outcomes') as FormArray;
  }
  get modules(): FormArray {
    return this.form.get('modules') as FormArray;
  }

  ngOnInit(): void {
    // Autoslug / shortTitle
    this.form
      .get('slug')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.slugTouched = true));
    this.form
      .get('shortTitle')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.shortTitleTouched = true));

    this.form
      .get('title')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((title) => {
        const t = String(title || '');
        if (!this.slugTouched) this.form.get('slug')?.setValue(this.slugify(t), { emitEvent: false });
        if (!this.shortTitleTouched) this.form.get('shortTitle')?.setValue(this.shortTitleFrom(t), { emitEvent: false });
      });

    // Keep previews in sync when user pastes/edits URLs manually.
    this.form
      .get('heroImage')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((v) => {
        if (this.heroImageUploading) return;
        const val = String(v || '').trim();
        if (!val) this.heroImagePreview = null;
        else this.heroImagePreview = this.upload.getImageUrlFromPath(val);
      });
    this.form
      .get('watermarkLogo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((v) => {
        if (this.watermarkLogoUploading) return;
        const val = String(v || '').trim();
        if (!val) this.watermarkLogoPreview = null;
        else this.watermarkLogoPreview = this.upload.getImageUrlFromPath(val);
      });

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((p) => {
          const id = p.get('id');
          this.trainingId = id;
          this.isEdit = !!id;
          this.hydrated = !id; // new forms are ready immediately

          if (!id) return of(null);
          return this.bo.getById(id);
        }),
      )
      .subscribe({
        next: (training: TrainingApi | null) => {
          if (training) {
            this.patch(training);
            this.loadSessions();
          }
          // New: start with one module for convenience
          if (!this.modules.length) this.addModule();
          this.hydrated = true;
          
          // Check if we should open sessions tab (when returning from session creation)
          const tab = this.route.snapshot.queryParamMap.get('tab');
          if (tab === 'sessions') {
            this.activeTab = 'sessions';
            this.loadSessions(); // Reload sessions when opening tab
          }
        },
        error: (err: Error) => {
          this.notifications.error('Chargement impossible', err.message || 'Erreur lors du chargement');
          this.hydrated = true;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.heroBlobUrl) URL.revokeObjectURL(this.heroBlobUrl);
    if (this.watermarkBlobUrl) URL.revokeObjectURL(this.watermarkBlobUrl);
  }

  setTab(tab: TabKey): void {
    this.activeTab = tab;
  }

  back(): void {
    this.router.navigate(['/backoffice/trainings']);
  }

  toggleLocationType(t: LocationType): void {
    const c = this.form.get('locationTypes');
    if (!c) return;
    const cur = (c.value || []) as LocationType[];
    const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
    c.setValue(next);
  }

  addChip(arr: FormArray, value: string): void {
    const v = (value || '').trim();
    if (!v) return;
    arr.push(this.fb.control(v));
  }

  removeChip(arr: FormArray, idx: number): void {
    arr.removeAt(idx);
  }

  addModule(): void {
    this.modules.push(
      this.fb.group({
        title: ['', Validators.required],
        durationHours: [null as number | null],
        topicsText: [''],
      }),
    );
  }

  removeModule(i: number): void {
    this.modules.removeAt(i);
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
    const dto: CreateTrainingDto = {
      title: v.title!,
      shortTitle: v.shortTitle!,
      slug: v.slug!,
      category: v.category || undefined,
      level: v.level!,
      trainingType: v.trainingType!,
      audienceType: v.audienceType!,
      status: v.status || 'draft',
      tagline: v.tagline || undefined,
      description: v.description || undefined,
      format: v.format || undefined,
      durationDays: v.durationDays ?? undefined,
      durationHours: v.durationHours ?? undefined,
      durationLabel: v.durationLabel || undefined,
      pace: v.pace || undefined,
      locationTypes: (v.locationTypes || []) as LocationType[],
      priceFrom: v.priceFrom ?? undefined,
      currency: v.currency || undefined,
      nextSessionHighlight: v.nextSessionHighlight || undefined,
      fundingOptions: (v.fundingOptions || []) as string[],
      heroImage: v.heroImage || undefined,
      watermarkLogo: v.watermarkLogo || undefined,
      objectives: (v.objectives || []) as string[],
      targetAudience: (v.targetAudience || []) as string[],
      prerequisites: (v.prerequisites || []) as string[],
      outcomes: (v.outcomes || []) as string[],
      modules: (v.modules || []).map((m: any, idx: number) => ({
        title: String(m.title || ''),
        durationHours: m.durationHours ?? undefined,
        topics: this.parseTopics(String(m.topicsText || '')),
        order: idx,
      })),
    };

    const req$ = this.isEdit && this.trainingId
      ? this.bo.update(this.trainingId, dto as UpdateTrainingDto)
      : this.bo.create(dto);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/backoffice/trainings']);
      },
      error: (err: Error) => {
        this.saving = false;
        this.notifications.error('Sauvegarde impossible', err.message || 'Erreur lors de la sauvegarde');
      },
    });
  }

  openAiGenerate(): void {
    this.aiGenerateOpen = true;
    // Prefill from current form (helpful)
    const title = String(this.form.get('title')?.value || '').trim();
    if (title) this.aiGenerateForm.patchValue({ trainingTitle: title });
  }

  closeAiGenerate(): void {
    if (this.aiGenerating) return;
    this.aiGenerateOpen = false;
  }

  runAiGenerate(): void {
    if (this.aiGenerating) return;
    if (this.aiGenerateForm.invalid) {
      this.aiGenerateForm.markAllAsTouched();
      return;
    }

    this.aiGenerating = true;

    const v = this.aiGenerateForm.getRawValue();
    const input: AiGenerateTrainingInput = {
      trainingTitle: v.trainingTitle!,
      rncpCode: v.rncpCode || undefined,
      rncpTitle: v.rncpTitle || undefined,
      durationDays: v.durationDays ?? undefined,
      totalHours: v.totalHours ?? undefined,
      level: v.level || undefined,
      audienceType: v.audienceType || undefined,
    };

    this.ai
      .generateTraining(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (t) => {
          this.aiGenerating = false;
          this.aiGenerateOpen = false;
          this.patchFromAiTraining(t);
          this.activeTab = 'general';
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
        },
        error: (err: Error) => {
          this.aiGenerating = false;
          this.notifications.error('Génération IA impossible', err.message || 'Erreur lors de la génération IA');
        },
      });
  }

  openAiPopover(ev: MouseEvent, field: keyof typeof this.form.controls): void {
    ev.preventDefault();
    ev.stopPropagation();

    const ctrl = this.form.get(field);
    const v = ctrl?.value;
    const val = String(v ?? '').trim();
    if (!val) return; // backend requires fieldValue (match `web/`)

    const el = ev.currentTarget as HTMLElement | null;
    if (!el) return;

    this.aiPopoverField = field;
    this.aiPopoverAnchor = el;
    this.aiPopoverLoading = false;
    this.aiPopoverAction = null;
    this.aiPopoverResult = null;
    this.aiPopoverSuggestions = [];
    this.aiPopoverSelected = null;
    this.aiPopoverOpen = true;
  }

  closeAiPopover(): void {
    this.aiPopoverOpen = false;
    this.aiPopoverAnchor = null;
    this.aiPopoverField = null;
    this.aiPopoverLoading = false;
    this.aiPopoverAction = null;
    this.aiPopoverResult = null;
    this.aiPopoverSuggestions = [];
    this.aiPopoverSelected = null;
  }

  runAiAssist(action: FieldAssistantAction): void {
    if (!this.aiPopoverField) return;
    if (this.aiPopoverLoading) return;

    const field = this.aiPopoverField;
    const ctrl = this.form.get(field);
    const raw = String(ctrl?.value ?? '').trim();
    if (!raw) return;

    this.aiPopoverLoading = true;
    this.aiPopoverAction = action;
    this.aiPopoverResult = null;
    this.aiPopoverSuggestions = [];
    this.aiPopoverSelected = null;

    this.aiField
      .assistField({
        fieldName: String(field),
        fieldValue: raw,
        action,
        context: {
          title: String(this.form.get('title')?.value || ''),
          level: String(this.form.get('level')?.value || ''),
          trainingType: String(this.form.get('trainingType')?.value || ''),
          category: String(this.form.get('category')?.value || ''),
        },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.aiPopoverLoading = false;
          if (action === 'suggest' && res.suggestions?.length) {
            this.aiPopoverSuggestions = res.suggestions;
            this.aiPopoverSelected = res.suggestions[0];
          } else {
            this.aiPopoverResult = res.improved;
            this.aiPopoverSelected = res.improved;
          }
        },
        error: (err: Error) => {
          this.aiPopoverLoading = false;
          this.notifications.error('Assistance IA impossible', err.message || "Erreur lors de l'assistance IA");
        },
      });
  }

  selectAiSuggestion(v: string): void {
    this.aiPopoverSelected = v;
  }

  applyAiResult(): void {
    if (!this.aiPopoverField) return;
    if (!this.aiPopoverSelected) return;

    this.form.get(this.aiPopoverField)?.setValue(this.aiPopoverSelected);
    this.form.markAsDirty();
    this.closeAiPopover();
  }

  onFileDropped(event: DragEvent, type: 'hero' | 'watermark'): void {
    event.preventDefault();
    const dropZone = event.currentTarget as HTMLElement | null;
    dropZone?.classList.remove('ui-upload-zone--drag');

    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleImageFile(file, type);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    const dropZone = event.currentTarget as HTMLElement | null;
    dropZone?.classList.add('ui-upload-zone--drag');
  }

  onDragLeave(event: DragEvent): void {
    const dropZone = event.currentTarget as HTMLElement | null;
    dropZone?.classList.remove('ui-upload-zone--drag');
  }

  onFileSelected(event: Event, type: 'hero' | 'watermark'): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    this.handleImageFile(file, type);
    // Allow selecting the same file again (re-trigger change)
    if (input) input.value = '';
  }

  clearImage(type: 'hero' | 'watermark'): void {
    if (type === 'hero') {
      if (this.heroBlobUrl) {
        URL.revokeObjectURL(this.heroBlobUrl);
        this.heroBlobUrl = null;
      }
      this.heroImagePreview = null;
      this.heroImageUploading = false;
      this.heroImageUploadProgress = 0;
      this.form.patchValue({ heroImage: '' });
    } else {
      if (this.watermarkBlobUrl) {
        URL.revokeObjectURL(this.watermarkBlobUrl);
        this.watermarkBlobUrl = null;
      }
      this.watermarkLogoPreview = null;
      this.watermarkLogoUploading = false;
      this.watermarkLogoUploadProgress = 0;
      this.form.patchValue({ watermarkLogo: '' });
    }
  }

  private patch(t: TrainingApi): void {
    this.form.patchValue({
      title: t.title,
      shortTitle: t.shortTitle,
      slug: t.slug,
      category: t.category || '',
      level: t.level,
      trainingType: t.trainingType,
      audienceType: t.audienceType,
      status: t.status,
      tagline: t.tagline || '',
      description: t.description || '',
      format: t.format || '',
      durationDays: t.durationDays ?? null,
      durationHours: t.durationHours ?? null,
      durationLabel: t.durationLabel || '',
      pace: t.pace || '',
      priceFrom: t.priceFrom ?? null,
      currency: t.currency || 'EUR',
      nextSessionHighlight: t.nextSessionHighlight || '',
      heroImage: t.heroImage || '',
      watermarkLogo: t.watermarkLogo || '',
      locationTypes: (t.locationTypes || []) as LocationType[],
    });

    this.heroImagePreview = t.heroImage ? this.upload.getImageUrlFromPath(t.heroImage) : null;
    this.watermarkLogoPreview = t.watermarkLogo ? this.upload.getImageUrlFromPath(t.watermarkLogo) : null;

    this.objectives.clear();
    (t.objectives || []).forEach((x) => this.objectives.push(this.fb.control(x)));
    this.fundingOptions.clear();
    (t.fundingOptions || []).forEach((x) => this.fundingOptions.push(this.fb.control(x)));
    this.targetAudience.clear();
    (t.targetAudience || []).forEach((x) => this.targetAudience.push(this.fb.control(x)));
    this.prerequisites.clear();
    (t.prerequisites || []).forEach((x) => this.prerequisites.push(this.fb.control(x)));
    this.outcomes.clear();
    (t.outcomes || []).forEach((x) => this.outcomes.push(this.fb.control(x)));

    this.modules.clear();
    (t.modules || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((m) => {
        this.modules.push(
          this.fb.group({
            title: [m.title || '', Validators.required],
            durationHours: [m.durationHours ?? null],
            topicsText: [(m.topics || []).join('\n')],
          }),
        );
      });
  }

  private patchFromAiTraining(t: TrainingApi): void {
    // Patch scalars
    this.form.patchValue({
      title: t.title || '',
      shortTitle: t.shortTitle || '',
      slug: t.slug || '',
      category: t.category || '',
      level: t.level || TrainingLevel.INITIATION,
      trainingType: t.trainingType || TrainingType.BOOTCAMP,
      audienceType: t.audienceType || AudienceType.ENTREPRISE,
      status: t.status || 'draft',
      tagline: t.tagline || '',
      description: t.description || '',
      format: t.format || '',
      durationDays: t.durationDays ?? null,
      durationHours: t.durationHours ?? null,
      durationLabel: t.durationLabel || '',
      pace: t.pace || '',
      priceFrom: t.priceFrom ?? null,
      currency: t.currency || 'EUR',
      nextSessionHighlight: t.nextSessionHighlight || '',
      // Images intentionally not set by AI (keep whatever user has)
    });

    // Patch arrays
    this.objectives.clear();
    (t.objectives || []).forEach((x) => this.objectives.push(this.fb.control(x)));
    // Funding options are typically edited by admin (not generated by AI by default),
    // but if provided we accept them.
    this.fundingOptions.clear();
    (t.fundingOptions || []).forEach((x) => this.fundingOptions.push(this.fb.control(x)));
    this.targetAudience.clear();
    (t.targetAudience || []).forEach((x) => this.targetAudience.push(this.fb.control(x)));
    this.prerequisites.clear();
    (t.prerequisites || []).forEach((x) => this.prerequisites.push(this.fb.control(x)));
    this.outcomes.clear();
    (t.outcomes || []).forEach((x) => this.outcomes.push(this.fb.control(x)));

    // Patch modules
    this.modules.clear();
    (t.modules || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((m) => {
        this.modules.push(
          this.fb.group({
            title: [m.title || '', Validators.required],
            durationHours: [m.durationHours ?? null],
            topicsText: [(m.topics || []).join('\n')],
          }),
        );
      });
    if (!this.modules.length) this.addModule();
  }

  private handleImageFile(file: File, type: 'hero' | 'watermark'): void {
    if (!file.type.startsWith('image/')) {
      this.notifications.warning('Fichier invalide', 'Veuillez déposer un fichier image.');
      return;
    }

    // Instant preview (local)
    const localUrl = URL.createObjectURL(file);
    if (type === 'hero') {
      if (this.heroBlobUrl) URL.revokeObjectURL(this.heroBlobUrl);
      this.heroBlobUrl = localUrl;
      this.heroImagePreview = localUrl;
      this.heroImageUploading = true;
      this.heroImageUploadProgress = 0;
    } else {
      if (this.watermarkBlobUrl) URL.revokeObjectURL(this.watermarkBlobUrl);
      this.watermarkBlobUrl = localUrl;
      this.watermarkLogoPreview = localUrl;
      this.watermarkLogoUploading = true;
      this.watermarkLogoUploadProgress = 0;
    }

    this.upload
      .uploadImageWithProgress(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => this.onUploadProgress(type, progress),
        error: (err: Error) => {
          this.clearImage(type);
          this.notifications.error('Upload impossible', err.message || "Erreur lors de l'upload");
        },
      });
  }

  private onUploadProgress(
    type: 'hero' | 'watermark',
    progress: { progress: number; response?: UploadResponse },
  ): void {
    if (type === 'hero') this.heroImageUploadProgress = progress.progress;
    else this.watermarkLogoUploadProgress = progress.progress;

    if (!progress.response) return;

    // Backend returns a relative URL like "/uploads/images/xxx.jpg"
    const url = progress.response.url;
    if (type === 'hero') {
      this.heroImageUploading = false;
      if (this.heroBlobUrl) {
        URL.revokeObjectURL(this.heroBlobUrl);
        this.heroBlobUrl = null;
      }
      this.form.patchValue({ heroImage: url });
      this.heroImagePreview = this.upload.getImageUrlFromPath(url);
    } else {
      this.watermarkLogoUploading = false;
      if (this.watermarkBlobUrl) {
        URL.revokeObjectURL(this.watermarkBlobUrl);
        this.watermarkBlobUrl = null;
      }
      this.form.patchValue({ watermarkLogo: url });
      this.watermarkLogoPreview = this.upload.getImageUrlFromPath(url);
    }
  }

  loadSessions(): void {
    if (!this.trainingId) {
      this.sessionsList = [];
      return;
    }
    this.sessionsLoading = true;
    this.sessions
      .list({ trainingId: this.trainingId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions) => {
          this.sessionsList = sessions || [];
          this.sessionsLoading = false;
        },
        error: () => {
          this.sessionsList = [];
          this.sessionsLoading = false;
        },
      });
  }

  openNewSession(): void {
    if (!this.trainingId) return;
    // Navigate to session form with trainingId pre-filled and returnTo flag
    this.router.navigate(['/backoffice/sessions/new'], {
      queryParams: { trainingId: this.trainingId, returnTo: 'training' },
    });
  }

  deleteSession(sessionId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      return;
    }

    this.sessions
      .delete(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (err: Error) => {
          console.error('Error deleting session:', err);
          this.notifications.error(
            'Suppression impossible',
            err.message || 'Erreur lors de la suppression de la session',
          );
        },
      });
  }

  formatSessionDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  private parseTopics(text: string): string[] {
    return (text || '')
      .split('\n')
      .map((l) => l.trim())
      .map((l) => l.replace(/^[-•]\s+/, ''))
      .filter(Boolean);
  }

  private shortTitleFrom(title: string): string {
    const t = (title || '').trim();
    if (t.length <= 42) return t;
    return t.slice(0, 42).replace(/\s+\S*$/, '').trim() || t.slice(0, 42);
  }

  private slugify(input: string): string {
    return (input || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80);
  }
}


