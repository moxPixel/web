import { ChangeDetectionStrategy, Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { map, switchMap, takeUntil, catchError, filter, tap } from 'rxjs/operators';
import { gsap } from 'gsap';
import { Subject } from 'rxjs';

import { Training } from '../../interfaces/training.interface';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { UploadApiService } from '../../services/api/upload-api.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-training-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatRippleModule, MatIconModule],
  templateUrl: './training-detail.component.html',
  styleUrls: ['./training-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trainingDetailHeroParallax', { static: false }) trainingDetailHeroParallax!: ElementRef;

  training$: Observable<Training | undefined>;
  loading = false;
  error: string | null = null;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();
  countdownText = '—';
  private countdownTimer?: any;
  nextSessionDate?: Date;
  private readonly seoService = inject(SeoService);

  constructor(
    private route: ActivatedRoute,
    private trainingsService: TrainingsService,
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService,
    private uploadService: UploadApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.training$ = this.route.paramMap.pipe(
      map(params => params.get('slug') ?? ''),
      switchMap(slug => {
        this.loading = true;
        this.error = null;
        return this.trainingsService.getTrainingBySlug(slug).pipe(
          tap(training => {
            // Mettre à jour le SEO quand la formation est chargée
            if (training) {
              this.updateSeoForTraining(training, slug);
            }
          }),
          map(training => {
            this.loading = false;
            if (!training) {
              this.error = 'Formation non trouvée';
            }
            this.setupCountdown(training);
            return training;
          }),
          catchError((error) => {
            this.loading = false;
            this.error = 'Erreur lors du chargement de la formation';
            console.error('Error loading training:', error);
            return of(undefined);
          })
        );
      })
    );
  }

  ngOnInit(): void {
    // SEO par défaut en attendant le chargement de la formation
    this.seoService.updateSeoData({
      title: 'Détail de la formation | Unlock Formation',
      description: 'Découvrez les détails de cette formation IT & IA : programme, prérequis, modalités, financement et inscription.',
      url: this.route.snapshot.url.join('/'),
      image: '/assets/images/logo/main-logo.png'
    });
  }

  private updateSeoForTraining(training: Training, slug: string): void {
    const description = training.tagline || '';
    const shortDescription = description.length > 160 ? description.substring(0, 157) + '...' : description;
    const imageUrl = training.heroImage ? this.uploadService.getImageUrlFromPath(training.heroImage) : '/assets/images/logo/main-logo.png';
    const fullUrl = `https://www.unlock-technologies.fr/trainings/${slug}`;

    this.seoService.updateSeoData({
      title: `${training.title} | Unlock Formation`,
      description: shortDescription || `Formation ${training.title} : ${training.category}. ${training.level ? `Niveau ${training.level}.` : ''} Formations certifiantes en IT & IA.`,
      keywords: `${training.title}, formation ${training.category}, ${training.level || ''}, formation IT, formation IA`,
      image: imageUrl,
      url: `/trainings/${slug}`,
      type: 'article',
      schema: this.seoService.generateCourseSchema({
        name: training.title,
        description: description || training.tagline || '',
        provider: 'Unlock Formation',
        url: fullUrl,
        image: imageUrl
      })
    });
  }

  getNextSessionLabel(training?: Training): string {
    if (!training) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = (training.sessions || [])
      .map((s) => ({
        ...s,
        start: new Date(s.startDate),
      }))
      .filter((s) => !isNaN(s.start.getTime()) && s.start.getTime() >= today.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const next = sessions[0];
    if (next) {
      const label = next.start.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return `Prochaine session : ${label}`;
    }

    if (training.nextSessionHighlight) return training.nextSessionHighlight;
    return 'Date à venir';
  }

  getImageUrl(path?: string): string {
    if (!path) return '/assets/images/img/p1.jpg';
    return this.uploadService.getImageUrlFromPath(path);
  }

  // ───────────── Countdown prochaine session ─────────────
  private setupCountdown(training?: Training): void {
    this.stopCountdown();
    this.countdownText = '—';
    this.nextSessionDate = undefined;

    if (!training) {
      this.markForCheckSafe();
      return;
    }

    const next = this.getNextSessionDate(training);
    if (next) {
      this.nextSessionDate = next;
      this.updateCountdown();
      this.countdownTimer = setInterval(() => this.updateCountdown(), 1000);
    } else {
      this.countdownText = training.nextSessionHighlight || 'Date à venir';
      this.markForCheckSafe();
    }
  }

  private getNextSessionDate(training: Training): Date | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessions = (training.sessions || [])
      .map(s => ({ ...s, start: new Date(s.startDate) }))
      .filter(s => !isNaN(s.start.getTime()) && s.start.getTime() >= today.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    return sessions[0]?.start || null;
  }

  private updateCountdown(): void {
    if (!this.nextSessionDate) return;
    const now = new Date().getTime();
    const diff = this.nextSessionDate.getTime() - now;
    if (diff <= 0) {
      this.countdownText = 'Bientôt en cours';
      this.stopCountdown();
      this.markForCheckSafe();
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

    this.countdownText = parts.join(' ');
    this.markForCheckSafe();
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  private markForCheckSafe(): void {
    try {
      this.cdr.markForCheck();
    } catch (e) {
      // no-op
    }
  }

  ngAfterViewInit(): void {
    // Même logique que le hero : attendre la fin du loader avant d'activer le parallaxe
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isHidden) => {
        if (isHidden && this.trainingDetailHeroParallax) {
          setTimeout(() => {
            if (!this.heroParallaxTween) {
              this.heroParallaxTween = this.gsapScroll.createParallax(
                this.trainingDetailHeroParallax.nativeElement,
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
    this.heroParallaxTween?.scrollTrigger?.kill();
    this.heroParallaxTween?.kill();
    this.heroParallaxTween = undefined;
    this.destroy$.next();
    this.destroy$.complete();
  }
}


