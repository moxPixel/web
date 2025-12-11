import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormControl, AbstractControl } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TrainingsService } from '../../core/services/trainings.service';
import { Training } from '../../core/models/training.model';
import { CertificationsService } from '../../core/services/certifications.service';
import { UploadApiService } from '../../../services/api/upload-api.service';
import { SessionsService } from '../../core/services/sessions.service';
import { TrainingSession, SessionStatus as ModelSessionStatus } from '../../core/models/session.model';
import { SessionStatus } from '../../../interfaces/session-api.interface';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AiGenerateDialogComponent } from '../ai-generate-dialog/ai-generate-dialog.component';
import { AiFieldAssistantApiService, FieldAssistantInput } from '../../../services/api/ai-field-assistant-api.service';
import { NotificationService } from '../../../services/notification.service';
import { Subject, takeUntil } from 'rxjs';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';

@Component({
  selector: 'app-training-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatRippleModule, MatIconModule, MatButtonModule, MatDialogModule, TooltipDirective],
  templateUrl: './training-form.component.html',
  styleUrls: ['./training-form.component.css']
})
export class TrainingFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private trainingsService = inject(TrainingsService);
  private certificationsService = inject(CertificationsService);
  private uploadService = inject(UploadApiService);
  private sessionsService = inject(SessionsService);
  private route = inject(ActivatedRoute);
  private routerService = inject(Router);
  private dialog = inject(MatDialog);
  private aiFieldAssistantService = inject(AiFieldAssistantApiService);
  private notify = inject(NotificationService);
  
  // Exposer pour le template
  router = this.routerService;
  SessionStatus = SessionStatus;

  isEdit = false;
  trainingId?: string;
  certifications$ = this.certificationsService.getAll();
  
  // Navigation par onglets
  activeTab: 'general' | 'format' | 'content' | 'program' | 'media' | 'sessions' = 'general';
  expandedSections: Set<string> = new Set(['general']);
  
  // Sessions
  sessions = signal<TrainingSession[]>([]);

  // ─────────────────────────────────────────────────────────────
  // 🤖 MENU OVERLAY IA (compact)
  // ─────────────────────────────────────────────────────────────
  
  aiMenuVisible = signal(false);
  aiMenuPosition = signal<{ top: number; left: number } | null>(null);
  aiMenuContext = signal<{
    fieldName: string;
    fieldValue: string;
    control: AbstractControl;
    isArray?: boolean;
    arrayName?: string;
    index?: number;
  } | null>(null);
  aiMenuLoading = signal(false);
  aiMenuResult = signal<{ action: string; text: string | string[]; explanation?: string } | null>(null);
  aiMenuError = signal<string | null>(null);
  aiSelectedSuggestion = signal<string | null>(null);
  sessionsLoading = signal(false);
  // Overlay d'optimisation globale
  optPanelVisible = signal(false);
  optPanelPosition = signal<{ top: number; left: number } | null>(null);
  optPanelLoading = signal(false);
  optPanelError = signal<string | null>(null);
  optPanelResult = signal<string | null>(null);
  optPanelAction = signal<'improve' | 'complete' | 'suggest'>('improve');
  optPanelField = signal<string>('description');
  optimizationFields: string[] = ['description', 'tagline', 'nextSessionHighlight', 'durationLabel', 'pace', 'format', 'category', 'title', 'shortTitle'];
  private optPanelTriggerRect: DOMRect | null = null;
  private optPanelTriggerEl: HTMLElement | null = null;
  private aiMenuTriggerRect: DOMRect | null = null;
  private aiMenuTriggerEl: HTMLElement | null = null;
  
  // Gestion des subscriptions pour éviter les memory leaks
  private destroy$ = new Subject<void>();
  private aiRequestCancel$ = new Subject<void>();
  showSessionForm = signal(false);
  sessionForm = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    location: [''],
    locationType: ['distanciel' as 'distanciel' | 'presentiel' | 'hybride'],
    seats: [null as number | null],
    price: [null as number | null],
    status: [SessionStatus.SCHEDULED as SessionStatus],
    highlight: [false],
  });

  form = this.fb.group({
    id: [''],
    slug: ['', Validators.required],
    title: ['', Validators.required],
    shortTitle: ['', Validators.required],
    tagline: [''],
    description: [''],
    category: [''],
    certificationId: [''],
    level: ['initiation', Validators.required],
    format: [''],
    trainingType: ['bootcamp', Validators.required],
    audienceType: ['entreprise', Validators.required],
    priceFrom: [0, Validators.required],
    currency: ['EUR', Validators.required],
    locationTypes: this.fb.control<string[]>([]),
    pace: [''],
    durationDays: [null as number | null],
    durationHours: [null as number | null],
    durationLabel: [''],
    nextSessionHighlight: [''],
    objectives: this.fb.array([]),
    targetAudience: this.fb.array([]),
    prerequisites: this.fb.array([]),
    outcomes: this.fb.array([]),
    fundingOptions: this.fb.array([]),
    program: this.fb.array([]),
    heroImage: [''],
    watermarkLogo: [''],
    status: ['draft' as 'draft' | 'published' | 'archived'],
  });

  ngOnInit(): void {
    // Initialiser l'auto-génération du slug et shortTitle
    this.setupAutoGeneration();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.trainingId = id;
        this.trainingsService.getById(id).subscribe({
          next: (training) => {
            if (training) {
              this.patchForm(training);
              // Charger les sessions si on est en mode édition
              this.loadSessions();
            }
          },
          error: (error) => {
            console.error('Error loading training:', error);
            alert('Erreur lors du chargement de la formation');
            this.router.navigate(['/bo/trainings']);
          },
        });
      }
    });
  }

  get objectives(): FormArray {
    return this.form.get('objectives') as FormArray;
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
  get fundingOptions(): FormArray {
    return this.form.get('fundingOptions') as FormArray;
  }
  get program(): FormArray {
    return this.form.get('program') as FormArray;
  }

  addChip(control: FormArray, value: string): void {
    const trimmed = value.trim();
    if (trimmed) {
      control.push(this.fb.control(trimmed));
    }
  }

  removeChip(control: FormArray, index: number): void {
    control.removeAt(index);
  }

  addModule(): void {
    this.program.push(this.fb.group({
      id: ['m-' + Math.random().toString(36).slice(2, 7)],
      title: ['', Validators.required],
      durationHours: [null],
      topics: this.fb.array([])
    }));
  }

  removeModule(index: number): void {
    this.program.removeAt(index);
  }

  addTopic(modIndex: number, value: string): void {
    const topics = this.getModuleTopics(this.program.at(modIndex));
    const trimmed = value.trim();
    if (trimmed) topics.push(this.fb.control(trimmed));
  }

  onAddTopicEnter(modIndex: number, event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const val = input.value ?? '';
    this.addTopic(modIndex, val);
    input.value = '';
  }

  removeTopic(modIndex: number, topicIndex: number): void {
    const topics = this.getModuleTopics(this.program.at(modIndex));
    topics.removeAt(topicIndex);
  }

  onAddChipEnter(control: FormArray, event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const val = input.value ?? '';
    this.addChip(control, val);
    input.value = '';
  }

  getModuleTopics(mod: AbstractControl): FormArray {
    return (mod.get('topics') as FormArray) ?? this.fb.array([]);
  }

  getModuleTitleControl(mod: AbstractControl): FormControl {
    return mod.get('title') as FormControl;
  }

  getModuleDurationControl(mod: AbstractControl): FormControl {
    return mod.get('durationHours') as FormControl;
  }

  isLocationTypeSelected(type: string): boolean {
    const locationTypes = this.form.get('locationTypes')?.value as string[] || [];
    return locationTypes.includes(type);
  }

  toggleLocationType(type: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const locationTypes = [...(this.form.get('locationTypes')?.value as string[] || [])];
    
    if (checkbox.checked) {
      if (!locationTypes.includes(type)) {
        locationTypes.push(type);
      }
    } else {
      const index = locationTypes.indexOf(type);
      if (index > -1) {
        locationTypes.splice(index, 1);
      }
    }
    
    this.form.get('locationTypes')?.setValue(locationTypes);
  }

  saving = false;

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.saving) {
      return; // Éviter les double-clics
    }

    this.saving = true;
    const value = this.form.value as Partial<Training>;
    
    const operation = this.isEdit && this.trainingId
      ? this.trainingsService.update(this.trainingId, value)
      : this.trainingsService.create(value);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/bo/trainings']);
      },
      error: (error) => {
        this.saving = false;
        console.error('Error saving training:', error);
        const message = error.message || 'Erreur lors de la sauvegarde de la formation';
        this.notify.error('Erreur', message);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/bo/trainings']);
  }

  /**
   * Ouvrir le dialog de génération IA
   */
  openAiDialog(): void {
    const dialogRef = this.dialog.open(AiGenerateDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'ai-generate-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((generatedTraining) => {
      if (generatedTraining) {
        this.patchFormWithAiGenerated(generatedTraining);
      }
    });
  }

  /**
   * Patcher le formulaire avec les données générées par l'IA
   */
  private patchFormWithAiGenerated(generatedTraining: Training): void {
    // Patcher les champs de base
    this.form.patchValue({
      title: generatedTraining.title,
      shortTitle: generatedTraining.shortTitle,
      slug: generatedTraining.slug,
      category: generatedTraining.category,
      level: generatedTraining.level,
      trainingType: generatedTraining.trainingType,
      audienceType: generatedTraining.audienceType,
      tagline: generatedTraining.tagline,
      description: generatedTraining.description,
      format: generatedTraining.format,
      durationDays: generatedTraining.durationDays,
      durationHours: generatedTraining.durationHours,
      durationLabel: generatedTraining.durationLabel,
      pace: generatedTraining.pace,
      locationTypes: generatedTraining.locationTypes || [],
      priceFrom: generatedTraining.priceFrom,
      currency: generatedTraining.currency || 'EUR',
      nextSessionHighlight: generatedTraining.nextSessionHighlight,
      heroImage: '', // Toujours vide
      watermarkLogo: '', // Toujours vide
      status: generatedTraining.status || 'draft',
    });

    // Patcher les tableaux
    this.setArray(this.objectives, generatedTraining.objectives || []);
    this.setArray(this.targetAudience, generatedTraining.targetAudience || []);
    this.setArray(this.prerequisites, generatedTraining.prerequisites || []);
    this.setArray(this.outcomes, generatedTraining.outcomes || []);
    this.setArray(this.fundingOptions, generatedTraining.fundingOptions || []);

    // Patcher le programme (modules)
    this.program.clear();
    if (generatedTraining.program && generatedTraining.program.length > 0) {
      generatedTraining.program.forEach((module) => {
        const group = this.fb.group({
          id: [module.id || `m-${Math.random().toString(36).slice(2, 7)}`],
          title: [module.title, Validators.required],
          durationHours: [module.durationHours],
          topics: this.fb.array([]),
        });
        const topicsArray = group.get('topics') as FormArray;
        (module.topics || []).forEach((topic) => {
          topicsArray.push(this.fb.control(topic));
        });
        this.program.push(group);
      });
    }

    // Ouvrir l'onglet général pour voir le résultat
    this.setActiveTab('general');
    
    // Scroll vers le haut
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  // Navigation
  setActiveTab(tab: 'general' | 'format' | 'content' | 'program' | 'media' | 'sessions'): void {
    this.activeTab = tab;
    this.expandedSections.add(tab);
    
    // Charger les sessions si on accède à l'onglet sessions et qu'on a un trainingId
    if (tab === 'sessions' && this.trainingId) {
      this.loadSessions();
    }
    
    // Scroll vers le haut de la section
    setTimeout(() => {
      const element = document.getElementById(`section-${tab}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  toggleSection(section: string): void {
    if (this.expandedSections.has(section)) {
      this.expandedSections.delete(section);
    } else {
      this.expandedSections.add(section);
    }
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections.has(section);
  }

  getProgressPercentage(): number {
    let completed = 0;
    const total = 5; // 5 sections

    // Section 1: Informations générales (title, shortTitle, slug, level, trainingType, audienceType)
    const section1 = this.form.get('title')?.value && 
                     this.form.get('shortTitle')?.value && 
                     this.form.get('slug')?.value && 
                     this.form.get('level')?.value && 
                     this.form.get('trainingType')?.value && 
                     this.form.get('audienceType')?.value;
    if (section1) completed++;

    // Section 2: Format & tarifs (priceFrom, currency)
    const section2 = this.form.get('priceFrom')?.value !== null && 
                     this.form.get('priceFrom')?.value !== undefined && 
                     this.form.get('currency')?.value;
    if (section2) completed++;

    // Section 3: Contenu & publics (au moins un élément rempli)
    const section3 = this.form.get('tagline')?.value || 
                     this.objectives.length > 0 || 
                     this.targetAudience.length > 0 || 
                     this.prerequisites.length > 0 || 
                     this.outcomes.length > 0 || 
                     this.fundingOptions.length > 0;
    if (section3) completed++;

    // Section 4: Programme (au moins un module avec titre)
    const section4 = this.program.length > 0 && 
                     this.program.controls.some(mod => mod.get('title')?.value);
    if (section4) completed++;

    // Section 5: Médias (optionnel, mais on compte si au moins un champ est rempli)
    const section5 = this.form.get('heroImage')?.value || 
                     this.form.get('watermarkLogo')?.value;
    if (section5) completed++;

    return Math.round((completed / total) * 100);
  }

  private patchForm(training: Training): void {
    this.form.patchValue(training);
    this.setArray(this.objectives, training.objectives);
    this.setArray(this.targetAudience, training.targetAudience);
    this.setArray(this.prerequisites, training.prerequisites);
    this.setArray(this.outcomes, training.outcomes);
    this.setArray(this.fundingOptions, training.fundingOptions);
    training.program?.forEach(m => {
      const group = this.fb.group({
        id: [m.id],
        title: [m.title, Validators.required],
        durationHours: [m.durationHours],
        topics: this.fb.array([])
      });
      const topicsArray = group.get('topics') as FormArray;
      m.topics.forEach(t => topicsArray.push(this.fb.control(t)));
      this.program.push(group);
    });

    // Charger les prévisualisations des images si elles existent
    if (training.heroImage) {
      this.heroImagePreview = this.uploadService.getImageUrlFromPath(training.heroImage);
    }
    if (training.watermarkLogo) {
      this.watermarkLogoPreview = this.uploadService.getImageUrlFromPath(training.watermarkLogo);
    }
  }

  private setArray(control: FormArray, values: string[]): void {
    control.clear();
    values?.forEach(v => control.push(this.fb.control(v)));
  }

  // Image upload methods
  heroImagePreview: string | null = null;
  watermarkLogoPreview: string | null = null;
  heroImageUploading = false;
  watermarkLogoUploading = false;
  heroImageUploadProgress = 0;
  watermarkLogoUploadProgress = 0;

  onFileSelected(event: Event, type: 'hero' | 'watermark'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0], type);
    }
  }

  onFileDropped(event: DragEvent, type: 'hero' | 'watermark'): void {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0], type);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');
  }

  private handleFile(file: File, type: 'hero' | 'watermark'): void {
    // Vérifier le type de fichier
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      this.notify.warning('Fichier invalide', 'Veuillez sélectionner une image valide (JPEG, PNG, GIF ou WebP)');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notify.warning('Fichier trop volumineux', 'L’image ne doit pas dépasser 5MB');
      return;
    }

    // Créer une prévisualisation locale
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (type === 'hero') {
        this.heroImagePreview = result;
        this.heroImageUploading = true;
        this.heroImageUploadProgress = 0;
      } else {
        this.watermarkLogoPreview = result;
        this.watermarkLogoUploading = true;
        this.watermarkLogoUploadProgress = 0;
      }
    };
    reader.readAsDataURL(file);

    // Uploader l'image vers le serveur
    this.uploadService.uploadImageWithProgress(file).subscribe({
      next: (progress) => {
        if (type === 'hero') {
          this.heroImageUploadProgress = progress.progress;
          if (progress.response) {
            this.heroImageUploading = false;
            // Le backend retourne /uploads/images/filename (chemin relatif)
            // On stocke le chemin relatif dans le formulaire
            this.form.patchValue({ heroImage: progress.response.url });
            // Pour l'affichage, on construit l'URL complète pointant vers le backend
            this.heroImagePreview = this.uploadService.getImageUrlFromPath(progress.response.url);
            console.log('Hero image URL:', this.heroImagePreview);
          }
        } else {
          this.watermarkLogoUploadProgress = progress.progress;
          if (progress.response) {
            this.watermarkLogoUploading = false;
            // Le backend retourne /uploads/images/filename (chemin relatif)
            // On stocke le chemin relatif dans le formulaire
            this.form.patchValue({ watermarkLogo: progress.response.url });
            // Pour l'affichage, on construit l'URL complète pointant vers le backend
            this.watermarkLogoPreview = this.uploadService.getImageUrlFromPath(progress.response.url);
            console.log('Watermark logo URL:', this.watermarkLogoPreview);
          }
        }
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.notify.error('Upload', 'Erreur lors de l’upload de l’image');
        if (type === 'hero') {
          this.heroImageUploading = false;
          this.heroImagePreview = null;
          this.form.patchValue({ heroImage: '' });
        } else {
          this.watermarkLogoUploading = false;
          this.watermarkLogoPreview = null;
          this.form.patchValue({ watermarkLogo: '' });
        }
      },
    });
  }

  removeImage(type: 'hero' | 'watermark'): void {
    const currentValue = type === 'hero' 
      ? this.form.get('heroImage')?.value 
      : this.form.get('watermarkLogo')?.value;

    // Si c'est une URL serveur, supprimer l'image du serveur
    if (currentValue && currentValue.startsWith('/uploads/')) {
      const filename = currentValue.split('/').pop();
      if (filename) {
        this.uploadService.deleteImage(filename).subscribe({
          error: (error) => {
            console.error('Error deleting image:', error);
          },
        });
      }
    }

    if (type === 'hero') {
      this.heroImagePreview = null;
      this.heroImageUploading = false;
      this.heroImageUploadProgress = 0;
      this.form.patchValue({ heroImage: '' });
    } else {
      this.watermarkLogoPreview = null;
      this.watermarkLogoUploading = false;
      this.watermarkLogoUploadProgress = 0;
      this.form.patchValue({ watermarkLogo: '' });
    }
  }

  // Sessions
  loadSessions(): void {
    if (!this.trainingId) return;
    
    this.sessionsLoading.set(true);
    this.sessionsService.getAll({ trainingId: this.trainingId }).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.sessionsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.sessionsLoading.set(false);
      },
    });
  }

  toggleSessionForm(): void {
    this.showSessionForm.set(!this.showSessionForm());
    if (!this.showSessionForm()) {
      this.sessionForm.reset({
        locationType: 'distanciel',
        status: SessionStatus.SCHEDULED,
        highlight: false,
      });
    }
  }

  saveSession(): void {
    if (this.sessionForm.invalid || !this.trainingId) {
      return;
    }

    // Convertir SessionStatus (enum API) vers ModelSessionStatus (type union)
    const apiStatus = this.sessionForm.get('status')?.value as SessionStatus;
    const modelStatus: ModelSessionStatus | undefined = apiStatus === SessionStatus.SCHEDULED ? 'upcoming' :
      apiStatus === SessionStatus.IN_PROGRESS ? 'open' :
      apiStatus === SessionStatus.COMPLETED ? 'closed' :
      apiStatus === SessionStatus.CANCELLED ? 'closed' :
      undefined;

    const sessionData: Partial<TrainingSession> = {
      trainingId: this.trainingId,
      startDate: this.sessionForm.get('startDate')?.value || '',
      endDate: this.sessionForm.get('endDate')?.value || '',
      locationType: this.sessionForm.get('locationType')?.value as 'distanciel' | 'presentiel' | 'hybride',
      locationLabel: this.sessionForm.get('location')?.value || undefined,
      seats: this.sessionForm.get('seats')?.value || undefined,
      price: this.sessionForm.get('price')?.value || undefined,
      status: modelStatus,
      highlight: this.sessionForm.get('highlight')?.value ? 'Oui' : undefined,
    };

    this.sessionsService.create(sessionData).subscribe({
      next: () => {
        this.loadSessions();
        this.toggleSessionForm();
        this.notify.success('Session créée', 'La session a été ajoutée.');
      },
      error: (error) => {
        console.error('Error creating session:', error);
        this.notify.error('Erreur', 'Erreur lors de la création de la session');
      },
    });
  }

  deleteSession(sessionId: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      this.sessionsService.delete(sessionId).subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (error) => {
          console.error('Error deleting session:', error);
          this.notify.error('Erreur', 'Erreur lors de la suppression de la session');
        },
      });
    }
  }

  getSessionLocationType(session: TrainingSession): string {
    switch (session.locationType) {
      case 'distanciel':
        return 'Distanciel';
      case 'presentiel':
        return 'Présentiel';
      case 'hybride':
        return 'Hybride';
      default:
        return '-';
    }
  }

  getSessionStatusLabel(status?: ModelSessionStatus): string {
    switch (status) {
      case 'upcoming':
        return 'Programmée';
      case 'open':
        return 'En cours';
      case 'closed':
        return 'Terminée';
      case 'full':
        return 'Complète';
      default:
        return '-';
    }
  }

  getSessionStatusBadgeClass(status?: ModelSessionStatus): string {
    switch (status) {
      case 'upcoming':
        return 'badge badge-cyan';
      case 'open':
        return 'badge badge-green';
      case 'closed':
        return 'badge badge-gray';
      case 'full':
        return 'badge badge-red';
      default:
        return 'badge badge-gray';
    }
  }

  /**
   * 🎯 AUTO-GÉNÉRATION ET ASSISTANCE
   */
  
  // Configurer l'auto-génération du slug et shortTitle
  private setupAutoGeneration(): void {
    // Auto-génération du slug depuis le titre
    this.form.get('title')?.valueChanges.subscribe(title => {
      if (title && !this.isEdit) {
        const slug = this.generateSlug(title);
        this.form.patchValue({ slug }, { emitEvent: false });
        
        // Suggérer un shortTitle si vide
        if (!this.form.get('shortTitle')?.value) {
          const shortTitle = this.generateShortTitle(title);
          this.form.patchValue({ shortTitle }, { emitEvent: false });
        }
      }
    });

    // Suggestions de prix basées sur niveau et durée
    this.form.get('level')?.valueChanges.subscribe(() => this.suggestPrice());
    this.form.get('trainingType')?.valueChanges.subscribe(() => this.suggestPrice());
    this.form.get('durationDays')?.valueChanges.subscribe(() => this.suggestPrice());
    this.form.get('durationHours')?.valueChanges.subscribe(() => this.suggestPrice());
  }

  // Générer un slug depuis un titre
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Retirer les caractères spéciaux
      .trim()
      .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
      .replace(/-+/g, '-'); // Éviter les tirets multiples
  }

  // Générer un shortTitle depuis un titre
  private generateShortTitle(title: string): string {
    // Prendre les 50 premiers caractères et couper au dernier mot
    if (title.length <= 50) return title;
    const truncated = title.substring(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  // Suggérer un prix basé sur les paramètres
  private suggestPrice(): void {
    if (this.isEdit || this.form.get('priceFrom')?.value! > 0) return;

    const level = this.form.get('level')?.value;
    const trainingType = this.form.get('trainingType')?.value;
    const durationDays = this.form.get('durationDays')?.value || 0;
    const durationHours = this.form.get('durationHours')?.value || 0;

    let suggestedPrice = 500; // Prix de base

    // Ajustement selon le niveau
    switch (level) {
      case 'initiation': suggestedPrice *= 0.8; break;
      case 'intermediaire': suggestedPrice *= 1; break;
      case 'avance': suggestedPrice *= 1.3; break;
      case 'expert': suggestedPrice *= 1.6; break;
    }

    // Ajustement selon le type
    switch (trainingType) {
      case 'bootcamp': suggestedPrice *= 3; break;
      case 'alternance': suggestedPrice *= 5; break;
      case 'diplomante': suggestedPrice *= 6; break;
      case 'certifiante': suggestedPrice *= 2.5; break;
    }

    // Ajustement selon la durée (en jours ou heures)
    const totalDays = durationDays + (durationHours / 7);
    if (totalDays > 0) {
      suggestedPrice *= Math.max(0.5, Math.min(totalDays / 5, 10));
    }

    // Arrondir à la centaine la plus proche
    suggestedPrice = Math.round(suggestedPrice / 100) * 100;

    this.form.patchValue({ priceFrom: suggestedPrice }, { emitEvent: false });
  }

  /**
   * 📝 TEMPLATES ET EXEMPLES
   */
  
  // Templates d'objectifs selon le niveau
  getObjectivesTemplates(): string[] {
    const level = this.form.get('level')?.value;
    const templates: Record<string, string[]> = {
      'initiation': [
        'Comprendre les concepts fondamentaux',
        'Découvrir les outils essentiels',
        'Réaliser ses premiers projets pratiques',
        'Acquérir les bases théoriques et pratiques'
      ],
      'intermediaire': [
        'Maîtriser les techniques avancées',
        'Développer des projets complexes',
        'Optimiser ses pratiques professionnelles',
        'Approfondir ses connaissances sectorielles'
      ],
      'avance': [
        'Devenir expert dans son domaine',
        'Piloter des projets stratégiques',
        'Former et accompagner des équipes',
        'Anticiper les évolutions du secteur'
      ],
      'expert': [
        'Diriger l\'innovation et la transformation',
        'Concevoir des stratégies sectorielles',
        'Transmettre son expertise aux pairs',
        'Influencer les standards du marché'
      ]
    };
    return templates[level || 'initiation'] || templates['initiation'];
  }

  // Templates de prérequis selon le niveau
  getPrerequisitesTemplates(): string[] {
    const level = this.form.get('level')?.value;
    const templates: Record<string, string[]> = {
      'initiation': [
        'Aucun prérequis nécessaire',
        'Motivation et curiosité',
        'Maîtrise basique de l\'informatique'
      ],
      'intermediaire': [
        'Connaissances de base du domaine',
        '6 mois d\'expérience pratique',
        'Maîtrise des outils fondamentaux'
      ],
      'avance': [
        '2 ans d\'expérience professionnelle',
        'Maîtrise confirmée du domaine',
        'Portfolio de projets réalisés'
      ],
      'expert': [
        '5+ ans d\'expérience significative',
        'Expertise reconnue dans le secteur',
        'Responsabilités managériales ou stratégiques'
      ]
    };
    return templates[level || 'initiation'] || templates['initiation'];
  }

  // Templates d'outcomes (résultats attendus)
  getOutcomesTemplates(): string[] {
    return [
      'Certification professionnelle reconnue',
      'Portfolio de projets concrets',
      'Réseau professionnel étendu',
      'Accès à des opportunités de carrière',
      'Accompagnement post-formation',
      'Accès à la communauté d\'anciens élèves'
    ];
  }

  // Ajouter un template d'objectif
  addObjectiveTemplate(template: string): void {
    const objectivesArray = this.form.get('objectives') as FormArray;
    objectivesArray.push(this.fb.control(template));
  }

  // Ajouter un template de prérequis
  addPrerequisiteTemplate(template: string): void {
    const prerequisitesArray = this.form.get('prerequisites') as FormArray;
    prerequisitesArray.push(this.fb.control(template));
  }

  // Ajouter un template d'outcome
  addOutcomeTemplate(template: string): void {
    const outcomesArray = this.form.get('outcomes') as FormArray;
    outcomesArray.push(this.fb.control(template));
  }

  /**
   * 📊 COMPTEURS ET VALIDATIONS
   */
  
  // Obtenir le nombre de caractères d'un champ
  getCharCount(fieldName: string): number {
    const value = this.form.get(fieldName)?.value;
    return value ? value.length : 0;
  }

  // Obtenir la limite de caractères recommandée
  getCharLimit(fieldName: string): number {
    const limits: Record<string, number> = {
      'title': 100,
      'shortTitle': 60,
      'tagline': 150,
      'description': 500,
      'category': 50,
      'durationLabel': 50,
      'nextSessionHighlight': 100
    };
    return limits[fieldName] || 200;
  }

  // Vérifier si la limite est dépassée
  isCharLimitExceeded(fieldName: string): boolean {
    return this.getCharCount(fieldName) > this.getCharLimit(fieldName);
  }

  // Obtenir la couleur du compteur
  getCharCountColor(fieldName: string): string {
    const count = this.getCharCount(fieldName);
    const limit = this.getCharLimit(fieldName);
    const ratio = count / limit;
    
    if (ratio > 1) return 'text-red-500';
    if (ratio > 0.9) return 'text-orange-500';
    if (ratio > 0.7) return 'text-yellow-500';
    return 'text-secondary/50 dark:text-accent/50';
  }

  /**
   * 🤖 ASSISTANT IA POUR LES CHAMPS - MÉTHODES CENTRALISÉES
   */
  
  // Vérifier si un champ a du contenu (pour afficher l'icône IA)
  hasFieldValue(fieldName: string, control?: AbstractControl | null): boolean {
    const fieldControl = control || this.form.get(fieldName);
    if (!fieldControl) return false;
    const value = fieldControl.value;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value !== 0;
    return !!value;
  }

  // Vérifier si un contrôle a du contenu (méthode générique)
  hasControlValue(control: AbstractControl | null | undefined): boolean {
    if (!control) return false;
    const value = control.value;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value !== 0;
    return !!value;
  }

  // Ouvrir le menu d'assistance IA pour un champ (méthode centralisée)
  openFieldAssistant(event: MouseEvent, fieldName: string, control?: AbstractControl | null): void {
    event.preventDefault();
    event.stopPropagation();
    
    const fieldControl = control || this.form.get(fieldName);
    if (!fieldControl) return;
    
    const fieldValue = fieldControl.value;
    if (fieldValue === null || fieldValue === undefined) return;
    
    // Convertir en string pour l'IA
    const fieldValueStr = typeof fieldValue === 'string' 
      ? fieldValue.trim() 
      : String(fieldValue);
    
    if (!fieldValueStr || fieldValueStr === '0') {
      return;
    }

    // Calculer la position du menu (ancré sur le trigger)
    const triggerEl = event.currentTarget as HTMLElement;
    const rect = triggerEl.getBoundingClientRect();
    this.aiMenuTriggerRect = rect;
    this.aiMenuTriggerEl = triggerEl;
    const menuPosition = this.calculateOverlayPosition(rect);

    this.aiMenuContext.set({
      fieldName,
      fieldValue: fieldValueStr,
      control: fieldControl
    });
    this.aiMenuPosition.set(menuPosition);
    this.aiMenuVisible.set(true);
    this.aiMenuResult.set(null);
    this.aiMenuError.set(null);
    this.aiSelectedSuggestion.set(null);
  }

  // Ouvrir l'assistant pour un élément de tableau (objectives, prerequisites, etc.)
  openArrayFieldAssistant(event: MouseEvent, arrayName: string, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    
    const array = this.form.get(arrayName) as FormArray;
    const control = array.at(index);
    const fieldValue = control?.value;
    
    if (!fieldValue || fieldValue.trim() === '') {
      return;
    }

    // Calculer la position du menu (ancré sur le trigger)
    const triggerEl = event.currentTarget as HTMLElement;
    const rect = triggerEl.getBoundingClientRect();
    this.aiMenuTriggerRect = rect;
    this.aiMenuTriggerEl = triggerEl;
    const menuPosition = this.calculateOverlayPosition(rect);

    this.aiMenuContext.set({
      fieldName: arrayName.slice(0, -1), // 'objectives' -> 'objective'
      fieldValue,
      control: control!,
      isArray: true,
      arrayName,
      index
    });
    this.aiMenuPosition.set(menuPosition);
    this.aiMenuVisible.set(true);
    this.aiMenuResult.set(null);
    this.aiMenuError.set(null);
    this.aiSelectedSuggestion.set(null);
  }

  // Fermer le menu IA
  closeAiMenu(): void {
    this.aiMenuVisible.set(false);
    this.aiMenuPosition.set(null);
    this.aiMenuContext.set(null);
    this.aiMenuResult.set(null);
    this.aiMenuError.set(null);
    this.aiSelectedSuggestion.set(null);
  }

  // Exécuter une action IA avec gestion d'annulation et cache
  performAiAction(action: 'improve' | 'correct' | 'suggest' | 'complete'): void {
    const context = this.aiMenuContext();
    if (!context) return;

    // Annuler la requête précédente si elle existe
    this.aiRequestCancel$.next();
    this.aiRequestCancel$.complete();
    this.aiRequestCancel$ = new Subject<void>();

    this.aiMenuLoading.set(true);
    this.aiMenuError.set(null);
    this.aiMenuResult.set(null);
    this.aiSelectedSuggestion.set(null);

    const input: FieldAssistantInput = {
      fieldName: context.fieldName,
      fieldValue: context.fieldValue,
      action,
      context: {
        title: this.form.get('title')?.value || '',
        level: this.form.get('level')?.value || '',
        trainingType: this.form.get('trainingType')?.value || '',
        category: this.form.get('category')?.value || ''
      }
    };

    // Vérifier le cache (clé basée sur le contenu et l'action)
    const cacheKey = this.getCacheKey(input);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.applyCachedResult(cached, action);
      this.aiMenuLoading.set(false);
      return;
    }

    this.aiFieldAssistantService.assistField(input)
      .pipe(
        takeUntil(this.aiRequestCancel$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          // Mettre en cache le résultat
          this.setCachedResult(cacheKey, result);
          
          if (action === 'suggest' && result.suggestions && result.suggestions.length > 0) {
            this.aiMenuResult.set({
              action,
              text: result.suggestions,
              explanation: result.explanation
            });
            this.aiSelectedSuggestion.set(result.suggestions[0]);
          } else {
            this.aiMenuResult.set({
              action,
              text: result.improved,
              explanation: result.explanation
            });
            this.aiSelectedSuggestion.set(result.improved);
          }
          this.aiMenuLoading.set(false);
        },
        error: (error: any) => {
          // Ne pas afficher d'erreur si la requête a été annulée
          if (error.name === 'AbortError' || error.message?.includes('canceled')) {
            return;
          }
          this.aiMenuError.set(error.message || 'Une erreur est survenue lors de l\'assistance IA');
          this.aiMenuLoading.set(false);
        }
      });
  }

  // Cache simple en mémoire (peut être amélioré avec un service dédié)
  private aiCache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(input: FieldAssistantInput): string {
    return `${input.fieldName}:${input.fieldValue}:${input.action}`;
  }

  private getCachedResult(key: string): any | null {
    const cached = this.aiCache.get(key);
    if (!cached) return null;
    
    // Vérifier si le cache est encore valide
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.aiCache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  private setCachedResult(key: string, result: any): void {
    // Limiter la taille du cache (max 50 entrées)
    if (this.aiCache.size >= 50) {
      const firstKey = this.aiCache.keys().next().value;
      if (firstKey) {
        this.aiCache.delete(firstKey);
      }
    }
    
    this.aiCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  private applyCachedResult(cached: any, action: string): void {
    if (action === 'suggest' && cached.suggestions && cached.suggestions.length > 0) {
      this.aiMenuResult.set({
        action,
        text: cached.suggestions,
        explanation: cached.explanation
      });
      this.aiSelectedSuggestion.set(cached.suggestions[0]);
    } else {
      this.aiMenuResult.set({
        action,
        text: cached.improved,
        explanation: cached.explanation
      });
      this.aiSelectedSuggestion.set(cached.improved);
    }
  }

  // Appliquer le résultat IA
  applyAiResult(): void {
    const context = this.aiMenuContext();
    const result = this.aiMenuResult();
    const selected = this.aiSelectedSuggestion();

    if (!context || !result || !selected) return;

    // Si c'est une suggestion de sujets pour un module
    if (context.isArray && context.arrayName?.startsWith('module_') && context.index !== undefined) {
      const moduleIndex = context.index;
      const moduleControl = this.program.at(moduleIndex);
      const topicsArray = (moduleControl as any).get('topics') as FormArray;
      // Ajouter la suggestion sélectionnée comme nouveau topic
      topicsArray.push(new FormControl(selected));
      this.form.markAsDirty();
      this.closeAiMenu();
      return;
    }

    // Comportement normal pour les autres cas
    if (context.isArray && context.control) {
      context.control.setValue(selected);
    } else if (context.control) {
      context.control.setValue(selected);
    }

    this.form.markAsDirty();
    this.closeAiMenu();
  }

  // Helper pour vérifier si le résultat est un tableau (pour le template)
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  ngOnDestroy(): void {
    // Nettoyer les subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    this.aiRequestCancel$.next();
    this.aiRequestCancel$.complete();
    // Nettoyer le cache
    this.aiCache.clear();
  }

  // Helper pour obtenir les suggestions comme tableau typé
  getSuggestions(): string[] {
    const result = this.aiMenuResult();
    if (result && Array.isArray(result.text)) {
      return result.text;
    }
    return [];
  }

  // Suggérer des sujets pour un module
  suggestModuleTopics(event: MouseEvent, moduleIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    
    const moduleControl = this.program.at(moduleIndex);
    const moduleTitle = (moduleControl as any).get('title')?.value || '';
    const trainingContext = {
      title: this.form.get('title')?.value || '',
      level: this.form.get('level')?.value || '',
      trainingType: this.form.get('trainingType')?.value || '',
      category: this.form.get('category')?.value || '',
      moduleTitle
    };

    // Calculer la position du menu (ancré sur le trigger)
    const triggerEl = event.currentTarget as HTMLElement;
    const rect = triggerEl.getBoundingClientRect();
    this.aiMenuTriggerRect = rect;
    this.aiMenuTriggerEl = triggerEl;
    const menuPosition = this.calculateOverlayPosition(rect);

    this.aiMenuContext.set({
      fieldName: 'topic',
      fieldValue: `Suggérer des sujets pour le module "${moduleTitle}"`,
      control: null as any, // Pas de contrôle spécifique pour les suggestions multiples
      isArray: true,
      arrayName: `module_${moduleIndex}_topics`,
      index: moduleIndex
    });
    this.aiMenuPosition.set(menuPosition);
    this.aiMenuVisible.set(true);
    this.aiMenuResult.set(null);
    this.aiMenuError.set(null);
    this.aiSelectedSuggestion.set(null);

    // Lancer automatiquement l'action "suggest"
    this.performAiAction('suggest');
  }

  // Ouvrir l'assistant pour un champ de module (titre ou durée)
  openModuleFieldAssistant(event: MouseEvent, moduleIndex: number, fieldName: string): void {
    event.preventDefault();
    event.stopPropagation();
    
    const moduleControl = this.program.at(moduleIndex);
    const fieldControl = (moduleControl as any).get(fieldName);
    const fieldValue = fieldControl?.value;
    
    // Pour les champs numériques, convertir en string et vérifier
    const fieldValueStr = fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '';
    
    if (!fieldValueStr || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
      return;
    }

    // Calculer la position du menu (ancré sur le trigger)
    const triggerEl = event.currentTarget as HTMLElement;
    const rect = triggerEl.getBoundingClientRect();
    this.aiMenuTriggerRect = rect;
    this.aiMenuTriggerEl = triggerEl;
    const menuPosition = this.calculateOverlayPosition(rect);

    // Déterminer le nom du champ pour l'IA
    const aiFieldName = fieldName === 'title' ? 'moduleTitle' : fieldName === 'durationHours' ? 'durationHours' : fieldName;

    this.aiMenuContext.set({
      fieldName: aiFieldName,
      fieldValue: fieldValueStr,
      control: fieldControl
    });
    this.aiMenuPosition.set(menuPosition);
    this.aiMenuVisible.set(true);
    this.aiMenuResult.set(null);
    this.aiMenuError.set(null);
    this.aiSelectedSuggestion.set(null);
  }

  // Ouvrir l'assistant pour un sujet de module
  openModuleTopicAssistant(event: MouseEvent, moduleIndex: number, topicIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    
    const moduleControl = this.program.at(moduleIndex);
    const topicsArray = (moduleControl as any).get('topics') as FormArray;
    const topicControl = topicsArray.at(topicIndex);
    const fieldValue = topicControl?.value;
    
    if (!fieldValue || fieldValue.trim() === '') {
      return;
    }

    // Calculer la position du menu (ancré sur le trigger)
    const triggerEl = event.currentTarget as HTMLElement;
    const rect = triggerEl.getBoundingClientRect();
    this.aiMenuTriggerRect = rect;
    this.aiMenuTriggerEl = triggerEl;
    const menuPosition = this.calculateOverlayPosition(rect);

    this.aiMenuContext.set({
      fieldName: 'topic',
      fieldValue,
      control: topicControl
    });
    this.aiMenuPosition.set(menuPosition);
    this.aiMenuVisible.set(true);
    this.aiMenuResult.set(null);
    this.aiMenuError.set(null);
    this.aiSelectedSuggestion.set(null);
  }

  // ─────────────────────────────────────────────────────────────
  // 🤖 Suggestion IA pour les listes (chips)
  // ─────────────────────────────────────────────────────────────

  suggestItems(fieldArrayName: 'objectives' | 'prerequisites' | 'targetAudience' | 'outcomes' | 'fundingOptions'): void {
    // Pour l'instant, on utilise l'action "suggest" du menu overlay
    // TODO: Implémenter une logique spécifique pour générer plusieurs items
    console.log('Suggest items for:', fieldArrayName);
  }

  // ─────────────────────────────────────────────────────────────
  // 🤖 Overlay global : optimiser / enrichir la formation
  // ─────────────────────────────────────────────────────────────

  openOptimizePanel(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const triggerEl = event.currentTarget as HTMLElement;
    const rect = triggerEl.getBoundingClientRect();
    this.optPanelTriggerRect = rect;
    this.optPanelTriggerEl = triggerEl;
    const pos = this.calculateOverlayPosition(rect, { width: 340, height: 360 });
    this.optPanelPosition.set(pos);
    this.optPanelVisible.set(true);
    this.optPanelLoading.set(false);
    this.optPanelError.set(null);
    this.optPanelResult.set(null);
  }

  closeOptimizePanel(): void {
    this.optPanelVisible.set(false);
    this.optPanelPosition.set(null);
    this.optPanelTriggerRect = null;
    this.optPanelTriggerEl = null;
    this.optPanelLoading.set(false);
    this.optPanelError.set(null);
    this.optPanelResult.set(null);
  }

  runOptimize(): void {
    const field = this.optPanelField();
    const action = this.optPanelAction();
    const control = this.form.get(field);

    if (!control) {
      this.optPanelError.set('Champ introuvable.');
      return;
    }

    const rawValue = control.value;
    if (rawValue === null || rawValue === undefined) {
      this.optPanelError.set('Champ vide.');
      return;
    }
    const value = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue);
    if (!value) {
      this.optPanelError.set('Champ vide.');
      return;
    }

    this.optPanelLoading.set(true);
    this.optPanelError.set(null);
    this.optPanelResult.set(null);

    const input: FieldAssistantInput = {
      fieldName: field,
      fieldValue: value,
      action,
      context: {
        title: this.form.get('title')?.value || '',
        level: this.form.get('level')?.value || '',
        trainingType: this.form.get('trainingType')?.value || '',
        category: this.form.get('category')?.value || ''
      }
    };

    this.aiFieldAssistantService.assistField(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const improved = res?.improved || (Array.isArray(res?.text) ? res.text[0] : res?.text);
          this.optPanelResult.set(improved || value);
          this.optPanelLoading.set(false);
        },
        error: (err) => {
          console.error('Opt panel error:', err);
          this.optPanelError.set(err.message || 'Erreur IA');
          this.optPanelLoading.set(false);
        }
      });
  }

  applyOptimizeResult(): void {
    const result = this.optPanelResult();
    if (!result) return;
    const field = this.optPanelField();
    const control = this.form.get(field);
    if (!control) return;
    control.setValue(result);
    this.form.markAsDirty();
    this.closeOptimizePanel();
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers de positionnement (overlay IA & panel global)
  // ─────────────────────────────────────────────────────────────

  private calculateOverlayPosition(triggerRect: DOMRect, menuSize?: { width: number; height: number }): { top: number; left: number } {
    const spacing = 8;
    const menuWidth = menuSize?.width ?? 280;
    const menuHeight = menuSize?.height ?? 260;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const clampTop = (t: number) => Math.min(Math.max(t, scrollY + 12), scrollY + viewportHeight - menuHeight - 12);
    const clampLeft = (l: number) => Math.min(Math.max(l, scrollX + 12), scrollX + viewportWidth - menuWidth - 12);

    // 1) droite
    const rightLeft = triggerRect.right + spacing + scrollX;
    if (rightLeft + menuWidth <= scrollX + viewportWidth - 12) {
      const top = clampTop(triggerRect.top + scrollY + (triggerRect.height - menuHeight) / 2);
      return { top, left: rightLeft };
    }

    // 2) gauche
    const leftPos = triggerRect.left + scrollX - spacing - menuWidth;
    if (leftPos >= scrollX + 12) {
      const top = clampTop(triggerRect.top + scrollY + (triggerRect.height - menuHeight) / 2);
      return { top, left: leftPos };
    }

    // 3) dessous
    const bottomTop = triggerRect.bottom + spacing + scrollY;
    if (bottomTop + menuHeight <= scrollY + viewportHeight - 12) {
      const left = clampLeft(triggerRect.left + scrollX);
      return { top: bottomTop, left };
    }

    // 4) dessus
    const topPos = triggerRect.top + scrollY - spacing - menuHeight;
    if (topPos >= scrollY + 12) {
      const left = clampLeft(triggerRect.left + scrollX);
      return { top: topPos, left };
    }

    // Fallback : clampé sous l'élément
    return {
      top: clampTop(triggerRect.bottom + spacing + scrollY),
      left: clampLeft(triggerRect.left + scrollX)
    };
  }

  private recalcAiMenuPosition(): void {
    if (!this.aiMenuVisible()) return;
    const trigger = this.aiMenuTriggerEl;
    const rect = trigger?.isConnected ? trigger.getBoundingClientRect() : this.aiMenuTriggerRect;
    if (!rect) return;
    const pos = this.calculateOverlayPosition(rect);
    this.aiMenuPosition.set(pos);
  }

  private recalcOptimizePanel(): void {
    if (!this.optPanelVisible()) return;
    const trigger = this.optPanelTriggerEl;
    const rect = trigger?.isConnected ? trigger.getBoundingClientRect() : this.optPanelTriggerRect;
    if (!rect) return;
    const pos = this.calculateOverlayPosition(rect, { width: 340, height: 360 });
    this.optPanelPosition.set(pos);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.recalcAiMenuPosition();
    this.recalcOptimizePanel();
  }
}

