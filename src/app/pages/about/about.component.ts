import { Component, AfterViewInit, OnDestroy, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, MatRippleModule, MatIconModule],
  template: `
    <section class="mt-3 relative px-4 sm:px-6 md:px-8 lg:px-12 overflow-visible" aria-label="À propos Unlock">
      <div class="max-w-[1920px] mx-auto relative" style="overflow: visible !important;">
        <!-- Sphères lumineuses comme sur le hero -->
        <div class="hero-spheres" aria-hidden="true">
          <div class="hero-sphere hero-sphere--1"></div>
          <div class="hero-sphere hero-sphere--2"></div>
          <div class="hero-sphere hero-sphere--3"></div>
        </div>

        <div
          #aboutParallax
          class="relative z-10 bg-[url('/assets/images/home-page-14/hero-bg.svg')] dark:bg-[url('/assets/images/home-page-14/hero-bg-dark.svg')] rounded-t-[12px] md:rounded-t-[20px] rounded-b-[20px] md:rounded-b-[30px] lg:rounded-b-[40px] bg-cover bg-no-repeat mb-16 md:mb-[100px] overflow-hidden"
        >
          <div class="main-container relative z-10 py-16 lg:py-24">
            <!-- Bouton retour -->
            <div class="mb-6 px-4 sm:px-6 md:px-8 lg:px-12">
              <button
                type="button"
                class="!flex !items-center !justify-center size-10 bg-background-2 dark:bg-background-7 text-secondary dark:text-accent rounded-full hover:bg-background-3 dark:hover:bg-background-6 transition-colors duration-200 overflow-hidden"
                matRipple
                [matRippleColor]="'rgba(0, 0, 0, 0.1)'"
                routerLink="/"
              >
                <mat-icon class="!w-5 !h-5 !text-[20px] !leading-5">arrow_back</mat-icon>
              </button>
            </div>

            <div class="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div class="w-full lg:w-1/2 text-center lg:text-left pt-6 lg:pt-12 space-y-4 px-4 sm:px-0">
                <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Unlock Formation</p>
                <!-- H1 Mobile (court) -->
                <h1 class="md:hidden max-w-[976px] mx-auto mb-4 text-xl sm:text-2xl leading-tight">
                  Centre de formation en <span class="text-primary-500 dark:text-ns-green-light">technologies avancées</span>
                </h1>
                <!-- H1 Desktop (complet) -->
                <h1 class="hidden md:block max-w-[976px] md:w-full mx-auto lg:mx-0 mb-4 text-xl md:text-2xl lg:text-3xl" style="word-break: keep-all; hyphens: none; line-height: 1.3;">
                  Centre de formation en <span class="text-primary-500 dark:text-ns-green-light" style="white-space: nowrap;">technologies avancées</span>
                </h1>
                <!-- Description Mobile (courte) -->
                <p class="md:hidden max-w-[800px] mx-auto mb-14 text-base leading-relaxed">
                  IA, cybersécurité, data, cloud, product, DevOps et métiers du numérique. Parcours certifiants, modulaires, opérationnels avec assistance IA.
                </p>
                <!-- Description Desktop (complète) -->
                <p class="hidden md:block max-w-[800px] md:w-full mx-auto lg:mx-0 mb-14 text-lg leading-relaxed" style="word-break: keep-all; hyphens: none;">
                  IA, cybersécurité, data, cloud, product, DevOps et métiers du numérique. Des parcours certifiants,
                  modulaires, opérationnels, qui combinent pédagogie humaine et assistance IA pour livrer des résultats mesurables.
                </p>
                <div class="flex flex-wrap items-center gap-3">
                  <span class="px-4 py-2 rounded-full bg-primary-500/10 text-primary-500 dark:bg-ns-green-light/10 dark:text-ns-green-light text-sm font-semibold">
                    RNCP / RS
                  </span>
                  <span class="px-4 py-2 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-sm font-semibold">
                    Présentiel · Distanciel · Hybride
                  </span>
                  <span class="px-4 py-2 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-sm font-semibold">
                    Assistance IA intégrée
                  </span>
                </div>
                <div class="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 w-[90%] md:w-auto mx-auto lg:mx-0">
                  <a
                    routerLink="/approche"
                    matRipple
                    [matRippleColor]="'rgba(255, 255, 255, 0.3)'"
                    class="btn btn-lg bg-secondary text-white hover:bg-secondary/90 border-0 dark:bg-white dark:text-secondary w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2"
                  >
                    <span class="leading-none">Découvrir notre approche</span>
                    <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">arrow_forward</mat-icon>
                  </a>
                  <a
                    routerLink="/trainings"
                    matRipple
                    [matRippleColor]="'rgba(0, 0, 0, 0.1)'"
                    class="btn btn-lg w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2 border-2 border-secondary dark:border-white text-secondary dark:text-white hover:bg-secondary hover:text-white dark:hover:bg-white dark:hover:text-secondary transition-all"
                  >
                    <span class="leading-none">Voir les formations</span>
                    <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">arrow_forward</mat-icon>
                  </a>
                </div>
              </div>

              <div class="w-full lg:w-1/2">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/70 dark:bg-[rgba(24,29,38,0.6)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-3xl font-bold text-secondary dark:text-accent">150+</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70">parcours et modules opérationnels</p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/70 dark:bg-[rgba(24,29,38,0.6)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-3xl font-bold text-secondary dark:text-accent">35+</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70">experts métier et formateurs référents</p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/70 dark:bg-[rgba(24,29,38,0.6)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-3xl font-bold text-secondary dark:text-accent">4.8/5</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70">satisfaction moyenne apprenants</p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/70 dark:bg-[rgba(24,29,38,0.6)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-3xl font-bold text-secondary dark:text-accent">100%</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70">programmes activables en entreprise</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="main-container relative z-10 space-y-12 pb-20">
          <div class="grid gap-10 lg:grid-cols-2 items-start">
            <div class="space-y-4">
              <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Mission</p>
              <h2 class="text-2xl lg:text-3xl font-semibold text-secondary dark:text-accent">Relier technologie et impact métier</h2>
              <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
                Nous concevons des parcours ancrés dans la réalité des projets : IA appliquée, data, cloud, développement,
                cybersécurité, product. Objectifs mesurables : montée en compétence, mise en production, employabilité et reconversion réussie.
              </p>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-500 dark:bg-ns-green-light/10 dark:text-ns-green-light text-xs font-semibold">IA & data</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">Cloud & DevOps</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">Cyber & conformité</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">Product & design</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">Marketing & growth</span>
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="p-5 rounded-2xl bg-white/80 dark:bg-background-8/80 border border-stroke-2 dark:border-stroke-6 shadow-sm space-y-2">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Pédagogie active</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Ateliers, cas d’usage, projets tutorés, feedback continu.</p>
              </div>
              <div class="p-5 rounded-2xl bg-white/80 dark:bg-background-8/80 border border-stroke-2 dark:border-stroke-6 shadow-sm space-y-2">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Assistance IA</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Co-pilote pédagogique pour reformuler, enrichir, corriger et accélérer.</p>
              </div>
              <div class="p-5 rounded-2xl bg-white/80 dark:bg-background-8/80 border border-stroke-2 dark:border-stroke-6 shadow-sm space-y-2">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Certifications</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Titres RNCP / RS et blocs de compétences mobilisables.</p>
              </div>
              <div class="p-5 rounded-2xl bg-white/80 dark:bg-background-8/80 border border-stroke-2 dark:border-stroke-6 shadow-sm space-y-2">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Formats flexibles</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Présentiel, distanciel, hybride, sessions modulaires ou intensives.</p>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-stroke-2 dark:border-stroke-6 bg-white/70 dark:bg-background-8/70 shadow-sm p-6 sm:p-8 space-y-6">
            <div class="space-y-2">
              <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Approche</p>
              <h3 class="text-2xl font-semibold text-secondary dark:text-accent">Une méthode centrée sur l’impact</h3>
              <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
                Blocs courts, objectifs mesurables, livrables attendus et coaching. Accompagnement IA intégré pour assister,
                corriger, enrichir et accélérer. Reporting clair pour l’entreprise : progression, délivrables, compétences acquises.
              </p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div class="p-4 rounded-2xl bg-background-1/70 dark:bg-background-7/70 border border-stroke-2 dark:border-stroke-6">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Diagnostic & objectifs</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Analyse du besoin, définition des compétences cibles, parcours sur-mesure.</p>
              </div>
              <div class="p-4 rounded-2xl bg-background-1/70 dark:bg-background-7/70 border border-stroke-2 dark:border-stroke-6">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Blocs pédagogiques courts</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Séquences actionnables, ateliers guidés, cas concrets issus d’environnements pro.</p>
              </div>
              <div class="p-4 rounded-2xl bg-background-1/70 dark:bg-background-7/70 border border-stroke-2 dark:border-stroke-6">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Coaching + IA</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Feedback expert complété par l’assistant IA pour reformuler, enrichir, corriger.</p>
              </div>
              <div class="p-4 rounded-2xl bg-background-1/70 dark:bg-background-7/70 border border-stroke-2 dark:border-stroke-6">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Évaluation continue</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Quiz, projets, soutenances ; indicateurs de progression partagés.</p>
              </div>
              <div class="p-4 rounded-2xl bg-background-1/70 dark:bg-background-7/70 border border-stroke-2 dark:border-stroke-6">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Certification & employabilité</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Alignement RNCP/RS, portfolio, accompagnement placement ou mobilité interne.</p>
              </div>
              <div class="p-4 rounded-2xl bg-background-1/70 dark:bg-background-7/70 border border-stroke-2 dark:border-stroke-6">
                <p class="text-sm font-semibold text-secondary dark:text-accent">Suivi post-formation</p>
                <p class="text-sm text-secondary/70 dark:text-accent/70">Sessions de suivi, coaching, mise à jour des contenus selon l’évolution tech.</p>
              </div>
            </div>
          </div>

          <div class="grid gap-8 lg:grid-cols-2 items-center">
            <div class="p-6 rounded-3xl bg-white/70 dark:bg-background-8/70 border border-stroke-2 dark:border-stroke-6 shadow-sm space-y-4">
              <div class="flex items-center gap-3">
                <span class="inline-flex size-12 items-center justify-center rounded-full bg-primary-500/12 text-primary-500 dark:bg-ns-green-light/12 dark:text-ns-green-light">
                  <mat-icon class="!text-[20px] !w-5 !h-5 leading-none">verified</mat-icon>
                </span>
                <div>
                  <p class="text-sm font-semibold text-secondary dark:text-accent">Qualité & certification</p>
                  <p class="text-sm text-secondary/70 dark:text-accent/70">Programmes alignés RNCP/RS, indicateurs de satisfaction et placement suivis.</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="inline-flex size-12 items-center justify-center rounded-full bg-primary-500/12 text-primary-500 dark:bg-ns-green-light/12 dark:text-ns-green-light">
                  <mat-icon class="!text-[20px] !w-5 !h-5 leading-none">groups</mat-icon>
                </span>
                <div>
                  <p class="text-sm font-semibold text-secondary dark:text-accent">Accompagnement humain</p>
                  <p class="text-sm text-secondary/70 dark:text-accent/70">Coaching expert, office hours, relectures, préparation aux certifications.</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="inline-flex size-12 items-center justify-center rounded-full bg-primary-500/12 text-primary-500 dark:bg-ns-green-light/12 dark:text-ns-green-light">
                  <mat-icon class="!text-[20px] !w-5 !h-5 leading-none">bolt</mat-icon>
                </span>
                <div>
                  <p class="text-sm font-semibold text-secondary dark:text-accent">Productivité augmentée</p>
                  <p class="text-sm text-secondary/70 dark:text-accent/70">Assistant IA intégré : reformulation, correction, complétion, cohérence de livrables.</p>
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Equipe & domaines</p>
              <h3 class="text-2xl font-semibold text-secondary dark:text-accent">Des parcours orientés métiers et produits</h3>
              <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
                Développement web et mobile, IA générative appliquée, data & BI, cloud & DevOps, cybersécurité,
                product management, design d’expérience, marketing digital et compétences transverses.
              </p>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-500 dark:bg-ns-green-light/10 dark:text-ns-green-light text-xs font-semibold">IA générative</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">Data & BI</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">DevOps & cloud</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">Cyber</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">Product</span>
                <span class="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary dark:bg-accent/10 dark:text-accent text-xs font-semibold">Design & UX</span>
              </div>
            </div>
          </div>

          <div class="rounded-3xl bg-secondary/90 dark:bg-accent/90 text-white dark:text-background-9 px-6 sm:px-8 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-lg">
            <div class="space-y-2">
              <p class="text-xs uppercase tracking-[0.2em] text-white/70 dark:text-background-9/70">Vous accompagner</p>
              <h4 class="text-2xl font-semibold">Parlons de votre projet de formation ou de montée en compétences.</h4>
              <p class="text-white/80 dark:text-background-9/80">Parcours sur mesure pour vos équipes ou votre reconversion.</p>
            </div>
            <div class="flex gap-3">
              <a
                routerLink="/contact"
                matRipple
                [matRippleColor]="'rgba(0, 0, 0, 0.1)'"
                  class="btn btn-lg w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2 border-2 border-secondary text-secondary bg-white hover:bg-secondary hover:text-white dark:border-0 dark:bg-background-9 dark:text-white dark:hover:bg-background-7 transition-all cursor-pointer"
              >
                <span class="leading-none">Nous contacter</span>
                <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">arrow_forward</mat-icon>
              </a>
              <a
                routerLink="/trainings"
                matRipple
                [matRippleColor]="'rgba(255,255,255,0.3)'"
                  class="btn btn-lg bg-secondary text-white hover:bg-secondary/90 border-0 dark:bg-white dark:text-secondary dark:hover:bg-white/90 w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span class="leading-none">Voir les formations</span>
                <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">arrow_forward</mat-icon>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})

export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('aboutParallax', { static: false }) aboutParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();
  private readonly seoService = inject(SeoService);

  constructor(
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService
  ) {}

  ngOnInit(): void {
    // Configuration SEO pour la page À propos
    this.seoService.updateSeoData({
      title: 'À propos - Unlock Formation',
      description: 'Découvrez Unlock Formation, centre expert en formations IT & IA. Notre mission, nos valeurs, notre équipe d\'experts reconnus. Formations certifiantes en développement, cybersécurité, data et cloud.',
      keywords: 'à propos unlock formation, qui sommes nous, centre formation IT, équipe experts IT, mission unlock formation',
      image: '/assets/images/logo/main-logo.png',
      url: '/about',
      type: 'website',
      schema: this.seoService.generateOrganizationSchema()
    });
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.aboutParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.aboutParallax.nativeElement,
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
}


