import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-approach',
  standalone: true,
  imports: [CommonModule, RouterModule, MatRippleModule, MatIconModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-3 relative px-4 sm:px-6 md:px-8 lg:px-12 overflow-visible min-h-[calc(100vh-120px)] lg:pb-[100px] pb-16 bg-background-1 dark:bg-background-8" aria-label="Notre approche pédagogique">
      <div class="max-w-[1920px] mx-auto relative">
        <!-- Sphères lumineuses -->
        <div class="hero-spheres" aria-hidden="true">
          <div class="hero-sphere hero-sphere--1"></div>
          <div class="hero-sphere hero-sphere--2"></div>
          <div class="hero-sphere hero-sphere--3"></div>
        </div>

        <div
          #approachParallax
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
              <!-- Colonne texte -->
              <div class="w-full lg:w-1/2 text-center lg:text-left pt-6 lg:pt-12 space-y-4 px-4 sm:px-0">
                <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Notre approche</p>

                <!-- H1 Mobile -->
                <h1 class="md:hidden max-w-[976px] mx-auto mb-4 text-xl sm:text-2xl leading-tight">
                  Une pédagogie <span class="text-primary-500 dark:text-ns-green-light">orientée pratique</span>
                </h1>

                <!-- H1 Desktop -->
                <h1 class="hidden md:block max-w-[976px] md:w-full mx-auto lg:mx-0 mb-4 text-xl md:text-2xl lg:text-3xl" style="word-break: keep-all; hyphens: none; line-height: 1.3;">
                  Une pédagogie <span class="text-primary-500 dark:text-ns-green-light" style="white-space: nowrap;">orientée pratique</span> et résultats
                </h1>

                <!-- Description -->
                <p class="max-w-[800px] mx-auto lg:mx-0 mb-6 text-base md:text-lg leading-relaxed text-secondary/80 dark:text-accent/80">
                  Unlock Formation conçoit des parcours fondés sur la mise en situation réelle : projets, études de cas et ateliers techniques pilotés par des <strong>experts en activité</strong>, complétés par l'assistance d'<strong>EVA</strong>, notre IA pédagogique propriétaire.
                </p>

                <div class="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 w-[90%] md:w-auto mx-auto lg:mx-0">
                  <a
                    routerLink="/trainings"
                    matRipple
                    [matRippleColor]="'rgba(255, 255, 255, 0.3)'"
                    class="btn btn-lg bg-secondary text-white hover:bg-secondary/90 border-0 dark:bg-white dark:text-secondary w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2"
                  >
                    <span class="leading-none">Découvrir nos parcours</span>
                    <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">arrow_forward</mat-icon>
                  </a>
                  <a
                    routerLink="/contact"
                    matRipple
                    [matRippleColor]="'rgba(0, 0, 0, 0.1)'"
                    class="btn btn-lg w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2 border-2 border-secondary dark:border-white text-secondary dark:text-white hover:bg-secondary hover:text-white dark:hover:bg-white dark:hover:text-secondary transition-all"
                  >
                    <span class="leading-none">Échanger avec nos équipes</span>
                    <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">arrow_forward</mat-icon>
                  </a>
                </div>
              </div>

              <!-- Colonne visuel -->
              <div class="w-full lg:w-1/2">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-sm font-semibold text-secondary dark:text-accent">Projets concrets</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-1">
                      Chaque bloc de formation est associé à un livrable : application, script, pipeline data, audit ou prototype.
                    </p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-sm font-semibold text-secondary dark:text-accent">Experts en activité</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-1">
                      Interventions assurées par des professionnels qui conçoivent, déploient et opèrent déjà les solutions qu'ils enseignent.
                    </p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-sm font-semibold text-secondary dark:text-accent">Assistance IA EVA</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-1">
                      EVA accompagne l'apprenant : reformulation, complétion, explications pas-à-pas, génération d'exemples complémentaires.
                    </p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-sm font-semibold text-secondary dark:text-accent">Suivi structuré</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-1">
                      Indicateurs de progression, feedbacks réguliers, validation des acquis et recommandations personnalisées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="main-container mt-10 space-y-12">
        <!-- Bloc 1 : Principes pédagogiques -->
        <section class="space-y-4">
          <h2 class="text-2xl lg:text-3xl font-semibold text-secondary dark:text-accent">
            Principes pédagogiques
          </h2>
          <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
            Nos parcours sont construits autour de principes clairs : un socle de connaissances solide, immédiatement mis en pratique,
            et une progression structurée par compétences. Chaque séquence vise un objectif mesurable et donne lieu à un livrable.
          </p>
          <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
            <li>Alternance de temps d'apports, de démonstrations et de mises en situation guidées.</li>
            <li>Études de cas inspirées de contextes réels d'entreprises et d'organisations.</li>
            <li>Validation régulière des acquis par des exercices, projets et soutenances.</li>
            <li>Possibilité d'intégrer vos propres cas d'usage en fil rouge lorsque cela est pertinent.</li>
          </ul>
        </section>

        <!-- Bloc 2 : Rôle des experts et d'EVA -->
        <section class="grid gap-8 lg:grid-cols-3 items-start">
          <!-- Image visuelle -->
          <div class="lg:col-span-1 order-3 lg:order-1">
            <div class="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                ngSrc="/assets/images/img/g6.jpg"
                alt="Notre approche pédagogique - Unlock Formation"
                width="600"
                height="800"
                class="w-full h-auto object-cover"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
          </div>
          
          <!-- Contenu texte -->
          <div class="lg:col-span-2 grid gap-8 lg:grid-cols-2 order-1 lg:order-2">
          <div class="space-y-4">
            <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
              Le rôle de nos experts
            </h3>
            <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
              Nos formateurs sont sélectionnés pour leur double légitimité : une expertise technique de haut niveau et une
              expérience pédagogique confirmée. Ils interviennent quotidiennement sur des projets en production et actualisent
              en continu les contenus transmis.
            </p>
            <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
              <li>Conception des programmes en cohérence avec les besoins du marché.</li>
              <li>Animation des sessions, retours d'expérience concrets, bonnes pratiques.</li>
              <li>Relecture et feedback sur les projets des apprenants.</li>
              <li>Conseils d'orientation et de positionnement professionnel.</li>
            </ul>
          </div>
          <div class="space-y-4">
            <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
              Le rôle d'EVA, notre assistant IA
            </h3>
            <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
              EVA est un assistant IA conçu spécifiquement pour accompagner les apprenants et les équipes dans leur progression.
              Il ne remplace pas le formateur, mais intervient en complément pour renforcer l'autonomie et accélérer l'apprentissage.
            </p>
            <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
              <li>Explication et reformulation des notions techniques complexes.</li>
              <li>Génération d'exemples supplémentaires ou de variantes d'exercices.</li>
              <li>Aide à la structuration de projets, à la rédaction de documentation ou de supports.</li>
              <li>Support à la révision entre les sessions, selon le rythme de l'apprenant.</li>
            </ul>
          </div>
          </div>
        </section>

        <!-- Bloc 3 : Parcours types -->
        <section class="space-y-4">
          <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
            Parcours types et formats proposés
          </h3>
          <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
            Nous proposons plusieurs formats pour répondre aux contraintes des particuliers et des entreprises, tout en conservant
            un haut niveau d'exigence pédagogique.
          </p>
          <div class="grid gap-4 md:grid-cols-3">
            <div class="p-4 rounded-2xl bg-background-2/60 dark:bg-background-7/60 border border-stroke-2 dark:border-stroke-6">
              <p class="text-sm font-semibold text-secondary dark:text-accent mb-1">Bootcamps intensifs</p>
              <p class="text-sm text-secondary/70 dark:text-accent/70">
                Formats condensés sur quelques semaines, centrés sur un objectif précis : lancer un projet, maîtriser un outil,
                valider un bloc de compétences.
              </p>
            </div>
            <div class="p-4 rounded-2xl bg-background-2/60 dark:bg-background-7/60 border border-stroke-2 dark:border-stroke-6">
              <p class="text-sm font-semibold text-secondary dark:text-accent mb-1">Parcours longs</p>
              <p class="text-sm text-secondary/70 dark:text-accent/70">
                Parcours structurés et certifiants, avec une progression par niveaux et un accompagnement renforcé.
              </p>
            </div>
            <div class="p-4 rounded-2xl bg-background-2/60 dark:bg-background-7/60 border border-stroke-2 dark:border-stroke-6">
              <p class="text-sm font-semibold text-secondary dark:text-accent mb-1">Formations intra-entreprise</p>
              <p class="text-sm text-secondary/70 dark:text-accent/70">
                Dispositifs dédiés à vos équipes, construits sur vos outils, vos cas d’usage et vos priorités métier.
              </p>
            </div>
          </div>
        </section>

        <!-- Bloc 4 : Pour qui ? -->
        <section class="grid gap-8 lg:grid-cols-2 items-start">
          <div class="space-y-4">
            <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
              Pour les apprenants
            </h3>
            <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
              Que vous soyez en reconversion, en montée en compétences ou en spécialisation, notre approche vise à rendre chaque
              compétence acquise directement exploitable dans un contexte professionnel.
            </p>
            <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
              <li>Parcours adaptés au niveau initial et aux objectifs visés.</li>
              <li>Projets valorisables dans un portfolio ou un dossier professionnel.</li>
              <li>Accompagnement sur le positionnement et la présentation de votre profil.</li>
            </ul>
          </div>
          <div class="space-y-4">
            <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
              Pour les entreprises
            </h3>
            <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
              Nous concevons des dispositifs de formation parfaitement intégrés à vos enjeux opérationnels et à votre feuille de route
              stratégique.
            </p>
            <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
              <li>Diagnostic des besoins et définition d’objectifs mesurables.</li>
              <li>Programmes adaptés à vos technologies, vos processus et vos contraintes de planning.</li>
              <li>Reporting clair sur la progression et les compétences acquises par vos équipes.</li>
            </ul>
          </div>
        </section>
      </div>
    </section>
  `,
})
export class ApproachComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('approachParallax', { static: false }) approachParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();

  private readonly seoService = inject(SeoService);

  constructor(
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService
  ) {}

  ngOnInit(): void {
    const breadcrumbSchema = this.seoService.generateBreadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'Notre approche', url: '/approche' }
    ]);

    // Configuration SEO pour la page Approche
    this.seoService.updateSeoData({
      title: 'Notre approche pédagogique | Unlock Formation',
      description: 'Découvrez la pédagogie Unlock Formation : pratique, orientée résultats, avec experts reconnus et assistant IA EVA. Méthodes d\'apprentissage innovantes pour formations IT & IA.',
      keywords: 'pédagogie formation, méthode apprentissage, formation pratique IT, approche pédagogique formation, EVA assistant IA, experts formateurs IT',
      image: '/assets/images/logo/main-logo.png',
      url: '/approche',
      type: 'website',
      schema: breadcrumbSchema
    });
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.approachParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.approachParallax.nativeElement,
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
