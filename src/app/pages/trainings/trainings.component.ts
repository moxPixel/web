import { ChangeDetectionStrategy, Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { gsap } from 'gsap';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Training } from '../../interfaces/training.interface';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { UploadApiService } from '../../services/api/upload-api.service';
import { SeoService } from '../../services/seo.service';

type TrainingLevelFilter = 'all' | 'initiation' | 'intermediaire' | 'avance' | 'expert';
type TrainingModeFilter = 'all' | 'distanciel' | 'presentiel' | 'hybride';
type TrainingTypeFilter = 'all' | 'bootcamp' | 'alternance' | 'diplomante' | 'certifiante';
type AudienceTypeFilter = 'all' | 'entreprise' | 'monter-en-competence' | 'reconversion';

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatRippleModule, MatIconModule],
  templateUrl: './trainings.component.html',
  styleUrls: ['./trainings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trainingsHeroParallax', { static: false }) trainingsHeroParallax!: ElementRef;

  allTrainings: Training[] = [];
  filteredTrainings: Training[] = [];
  globalNextSessionDate?: Date;
  globalCountdownText = 'Date à venir';
  private countdownTimer?: any;
  loading = false;
  error: string | null = null;

  searchTerm = '';
  selectedLevel: TrainingLevelFilter = 'all';
  selectedMode: TrainingModeFilter = 'all';
  selectedTrainingType: TrainingTypeFilter = 'all';
  selectedAudienceType: AudienceTypeFilter = 'all';

  // Structures de données pour les filtres
  levelFilters = [
    { value: 'initiation' as TrainingLevelFilter, label: '#Init.' }
  ];

  modeFilters = [
    { value: 'distanciel' as TrainingModeFilter, label: '#Distanciel' },
    { value: 'presentiel' as TrainingModeFilter, label: '#Présentiel' },
    { value: 'hybride' as TrainingModeFilter, label: '#Hybride' }
  ];

  trainingTypeFilters = [
    { value: 'bootcamp' as TrainingTypeFilter, label: '#Bootcamp' },
    { value: 'alternance' as TrainingTypeFilter, label: '#Alternance' },
    { value: 'diplomante' as TrainingTypeFilter, label: '#Dipl.' },
    { value: 'certifiante' as TrainingTypeFilter, label: '#Cert.' }
  ];

  audienceTypeFilters = [
    { value: 'entreprise' as AudienceTypeFilter, label: '#Entreprise' },
    { value: 'monter-en-competence' as AudienceTypeFilter, label: '#Compétence' },
    { value: 'reconversion' as AudienceTypeFilter, label: '#Reconversion' }
  ];

  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();
  private readonly seoService = inject(SeoService);

  constructor(
    private trainingsService: TrainingsService,
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService,
    private cdr: ChangeDetectorRef,
    private uploadService: UploadApiService
  ) {}

  ngOnInit(): void {
    // Configuration SEO pour la page Formations
    this.seoService.updateSeoData({
      title: 'Catalogue de formations IT & IA | Unlock Formation',
      description: 'Explorez notre catalogue complet de formations IT & IA : développement web, cybersécurité, data science, cloud, DevOps. Formations certifiantes, alternance et reconversion professionnelle.',
      keywords: 'catalogue formations, formations IT, formations IA, formations cybersécurité, formations développement web, formations data science, formations cloud, formations DevOps, alternance IT',
      image: '/assets/images/logo/main-logo.png',
      url: '/trainings',
      type: 'website'
    });
    
    this.loadTrainings();
  }

  loadTrainings(): void {
    this.loading = true;
    this.error = null;
    this.trainingsService.getTrainings().subscribe({
      next: (trainings) => {
        console.info('[TrainingsComponent] trainings loaded:', trainings.length);
        this.allTrainings = trainings;
        this.applyFilters();
        this.setupGlobalCountdown(trainings);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading trainings:', error);
        this.error = 'Erreur lors du chargement des formations';
        this.loading = false;
        this.applyFilters(); // Appliquer les filtres même en cas d'erreur (peut avoir des données mock)
        this.setupGlobalCountdown(this.allTrainings);
        this.cdr.markForCheck();
      },
    });
  }

  ngAfterViewInit(): void {
    // Utiliser exactement la même logique de déclenchement que le hero :
    // attendre que le loader soit complètement caché avant d'activer le parallaxe.
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isHidden) => {
        if (isHidden && this.trainingsHeroParallax) {
          setTimeout(() => {
            if (!this.heroParallaxTween) {
              this.heroParallaxTween = this.gsapScroll.createParallax(
                this.trainingsHeroParallax.nativeElement,
                -0.25,
                'top top',
                'bottom top'
              );
            }
          }, 50);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.heroParallaxTween?.scrollTrigger?.kill();
    this.heroParallaxTween?.kill();
    this.heroParallaxTween = undefined;
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  setLevelFilter(level: TrainingLevelFilter): void {
    this.selectedLevel = level;
    this.applyFilters();
  }

  setModeFilter(mode: TrainingModeFilter): void {
    this.selectedMode = mode;
    this.applyFilters();
  }

  setTrainingTypeFilter(type: TrainingTypeFilter): void {
    this.selectedTrainingType = type;
    this.applyFilters();
  }

  setAudienceTypeFilter(type: AudienceTypeFilter): void {
    this.selectedAudienceType = type;
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

  private setupGlobalCountdown(trainings: Training[]): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
    this.globalNextSessionDate = this.getGlobalNextSessionDate(trainings);
    if (this.globalNextSessionDate) {
      this.updateGlobalCountdown();
      this.countdownTimer = setInterval(() => this.updateGlobalCountdown(), 1000);
    } else {
      this.globalCountdownText = 'Date à venir';
    }
  }

  private getGlobalNextSessionDate(trainings: Training[]): Date | undefined {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessions = trainings
      .flatMap(t => t.sessions || [])
      .map(s => new Date(s.startDate))
      .filter(d => !isNaN(d.getTime()) && d.getTime() >= today.getTime())
      .sort((a, b) => a.getTime() - b.getTime());
    return sessions[0];
  }

  private updateGlobalCountdown(): void {
    if (!this.globalNextSessionDate) return;
    const now = Date.now();
    const diff = this.globalNextSessionDate.getTime() - now;
    if (diff <= 0) {
      this.globalCountdownText = 'Bientôt en cours';
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = undefined;
      }
      this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  getImageUrl(path?: string): string {
    if (!path) return '/assets/images/img/p1.jpg';
    return this.uploadService.getImageUrlFromPath(path);
  }

  private applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredTrainings = this.allTrainings.filter((training) => {
      // Recherche texte
      const matchesSearch =
        !term ||
        training.title.toLowerCase().includes(term) ||
        training.shortTitle.toLowerCase().includes(term) ||
        training.tagline.toLowerCase().includes(term) ||
        training.category.toLowerCase().includes(term);

      if (!matchesSearch) {
        return false;
      }

      // Filtre niveau
      if (this.selectedLevel !== 'all' && training.level !== this.selectedLevel) {
        return false;
      }

      // Filtre mode (distanciel / présentiel / hybride) basé sur locationTypes
      const hasDistanciel = training.locationTypes.some((loc) =>
        loc.toLowerCase().includes('distanciel')
      );
      const hasPresentiel = training.locationTypes.some((loc) =>
        loc.toLowerCase().includes('présentiel') || loc.toLowerCase().includes('presentiel')
      );

      if (this.selectedMode === 'distanciel' && !hasDistanciel) {
        return false;
      }

      if (this.selectedMode === 'presentiel' && !hasPresentiel) {
        return false;
      }

      if (this.selectedMode === 'hybride' && !(hasDistanciel && hasPresentiel)) {
        return false;
      }

      // Filtre type de formation
      if (this.selectedTrainingType !== 'all' && training.trainingType !== this.selectedTrainingType) {
        return false;
      }

      // Filtre type d'audience
      if (this.selectedAudienceType !== 'all' && training.audienceType !== this.selectedAudienceType) {
        return false;
      }

      return true;
    });
  }
}


