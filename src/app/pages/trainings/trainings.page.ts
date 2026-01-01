import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Training } from '../../interfaces/training.interface';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { UploadApiService } from '../../services/api/upload-api.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

type TrainingLevelFilter = 'all' | 'initiation' | 'intermediaire' | 'avance' | 'expert';
type TrainingModeFilter = 'all' | 'distanciel' | 'presentiel' | 'hybride';
type TrainingTypeFilter = 'all' | 'bootcamp' | 'alternance' | 'diplomante' | 'certifiante';
type AudienceTypeFilter = 'all' | 'entreprise' | 'monter-en-competence' | 'reconversion';

@Component({
  selector: 'app-trainings-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TablerIconComponent,
    UiButtonDirective,
    UiCardDirective
  ],
  templateUrl: './trainings.page.html',
  styleUrl: './trainings.page.css'
})
export class TrainingsPage implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly notifications = inject(NotificationService);

  allTrainings: Training[] = [];
  filteredTrainings: Training[] = [];
  hasLoaded = false;

  searchTerm = '';
  selectedLevel: TrainingLevelFilter = 'all';
  selectedMode: TrainingModeFilter = 'all';
  selectedTrainingType: TrainingTypeFilter = 'all';
  selectedAudienceType: AudienceTypeFilter = 'all';

  globalNextSessionDate?: Date;
  globalCountdownText = 'Date à venir';
  private countdownTimer?: number;

  readonly levelFilters: Array<{ value: TrainingLevelFilter; label: string }> = [
    { value: 'initiation', label: '#Init.' },
    { value: 'intermediaire', label: '#Inter.' },
    { value: 'avance', label: '#Avancé' },
    { value: 'expert', label: '#Expert' }
  ];

  readonly modeFilters: Array<{ value: TrainingModeFilter; label: string }> = [
    { value: 'distanciel', label: '#Distanciel' },
    { value: 'presentiel', label: '#Présentiel' },
    { value: 'hybride', label: '#Hybride' }
  ];

  readonly trainingTypeFilters: Array<{ value: TrainingTypeFilter; label: string }> = [
    { value: 'bootcamp', label: '#Bootcamp' },
    { value: 'alternance', label: '#Alternance' },
    { value: 'diplomante', label: '#Dipl.' },
    { value: 'certifiante', label: '#Cert.' }
  ];

  readonly audienceTypeFilters: Array<{ value: AudienceTypeFilter; label: string }> = [
    { value: 'entreprise', label: '#Entreprise' },
    { value: 'monter-en-competence', label: '#Compétence' },
    { value: 'reconversion', label: '#Reconversion' }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private trainingsService: TrainingsService,
    private upload: UploadApiService,
  ) {}

  ngOnInit(): void {
    // Render immediately if we already have cached data (prevents blank page until first interaction).
    const cached = this.trainingsService.getCachedTrainings();
    if (cached.length) {
      this.allTrainings = cached;
      this.applyFilters();
      this.setupGlobalCountdown(cached);
      this.hasLoaded = true;
    }

    this.trainingsService
      .getTrainings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (trainings) => {
          // Make sure UI updates even if something ends up outside Angular's CD.
          this.ngZone.run(() => {
            this.allTrainings = trainings;
            this.applyFilters();
            this.setupGlobalCountdown(trainings);
            this.hasLoaded = true;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.notifications.error('Chargement impossible', 'Erreur lors du chargement des formations.');
            this.hasLoaded = true;
            this.cdr.detectChanges();
          });
        }
      });
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) window.clearInterval(this.countdownTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  toggleLevelFilter(level: TrainingLevelFilter): void {
    this.selectedLevel = this.selectedLevel === level ? 'all' : level;
    this.applyFilters();
  }

  toggleModeFilter(mode: TrainingModeFilter): void {
    this.selectedMode = this.selectedMode === mode ? 'all' : mode;
    this.applyFilters();
  }

  toggleTrainingTypeFilter(type: TrainingTypeFilter): void {
    this.selectedTrainingType = this.selectedTrainingType === type ? 'all' : type;
    this.applyFilters();
  }

  toggleAudienceTypeFilter(type: AudienceTypeFilter): void {
    this.selectedAudienceType = this.selectedAudienceType === type ? 'all' : type;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLevel = 'all';
    this.selectedMode = 'all';
    this.selectedTrainingType = 'all';
    this.selectedAudienceType = 'all';
    this.applyFilters();
  }

  getImageUrl(path?: string): string {
    if (!path) return '/assets/images/img/p1.jpg';
    return this.upload.getImageUrlFromPath(path);
  }

  private applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredTrainings = this.allTrainings.filter((t) => {
      const matchesSearch =
        !term ||
        t.title.toLowerCase().includes(term) ||
        t.shortTitle.toLowerCase().includes(term) ||
        t.tagline.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term);
      if (!matchesSearch) return false;

      if (this.selectedLevel !== 'all' && t.level !== this.selectedLevel) return false;

      const hasDistanciel = (t.locationTypes || []).some((x) => x.toLowerCase().includes('distanciel'));
      const hasPresentiel = (t.locationTypes || []).some((x) => x.toLowerCase().includes('présentiel') || x.toLowerCase().includes('presentiel'));
      if (this.selectedMode === 'distanciel' && !hasDistanciel) return false;
      if (this.selectedMode === 'presentiel' && !hasPresentiel) return false;
      if (this.selectedMode === 'hybride' && !(hasDistanciel && hasPresentiel)) return false;

      if (this.selectedTrainingType !== 'all' && t.trainingType !== this.selectedTrainingType) return false;
      if (this.selectedAudienceType !== 'all' && t.audienceType !== this.selectedAudienceType) return false;

      return true;
    });
  }

  private setupGlobalCountdown(trainings: Training[]): void {
    if (this.countdownTimer) window.clearInterval(this.countdownTimer);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessions = trainings
      .flatMap((t) => t.sessions || [])
      .map((s) => new Date(s.startDate))
      .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= today.getTime())
      .sort((a, b) => a.getTime() - b.getTime());

    this.globalNextSessionDate = sessions[0];
    if (!this.globalNextSessionDate) {
      this.globalCountdownText = 'Date à venir';
      return;
    }

    const update = () => {
      if (!this.globalNextSessionDate) return;
      const diff = this.globalNextSessionDate.getTime() - Date.now();
      if (diff <= 0) {
        this.globalCountdownText = 'Bientôt en cours';
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}j`);
      parts.push(`${hours.toString().padStart(2, '0')}h`);
      parts.push(`${minutes.toString().padStart(2, '0')}m`);
      parts.push(`${seconds.toString().padStart(2, '0')}s`);
      this.globalCountdownText = parts.join(' ');
    };

    update();
    this.countdownTimer = window.setInterval(update, 1000);
  }
}


