import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
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
  selector: 'app-training-project',
  standalone: true,
  imports: [CommonModule, RouterModule, MatRippleModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-3 relative px-4 sm:px-6 md:px-8 lg:px-12 overflow-visible min-h-[calc(100vh-120px)] lg:pb-[100px] pb-16 bg-background-1 dark:bg-background-8" aria-label="Construire votre projet de formation">
      <div class="max-w-[1920px] mx-auto relative">
        <!-- Sphères lumineuses -->
        <div class="hero-spheres" aria-hidden="true">
          <div class="hero-sphere hero-sphere--1"></div>
          <div class="hero-sphere hero-sphere--2"></div>
          <div class="hero-sphere hero-sphere--3"></div>
        </div>

        <div
          #projectParallax
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
                <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Projets de formation</p>

                <!-- H1 Mobile -->
                <h1 class="md:hidden max-w-[976px] mx-auto mb-4 text-xl sm:text-2xl leading-tight">
                  Construire un <span class="text-primary-500 dark:text-ns-green-light">projet de formation</span> solide
                </h1>

                <!-- H1 Desktop -->
                <h1 class="hidden md:block max-w-[976px] md:w-full mx-auto lg:mx-0 mb-4 text-xl md:text-2xl lg:text-3xl" style="word-break: keep-all; hyphens: none; line-height: 1.3;">
                  Construire un <span class="text-primary-500 dark:text-ns-green-light" style="white-space: nowrap;">projet de formation</span> solide et structuré
                </h1>

                <!-- Description -->
                <p class="max-w-[800px] mx-auto lg:mx-0 mb-6 text-base md:text-lg leading-relaxed text-secondary/80 dark:text-accent/80">
                  Unlock Formation accompagne les directions générales, RH et métiers dans la conception, la mise en œuvre et le suivi
                  de projets de formation en IT et IA. Objectif : transformer vos besoins en un dispositif clair, finançable et
                  directement opérationnel pour vos équipes.
                </p>

                <div class="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 w-[90%] md:w-auto mx-auto lg:mx-0">
                  <a
                    routerLink="/contact"
                    matRipple
                    [matRippleColor]="'rgba(255, 255, 255, 0.3)'"
                    class="btn btn-lg bg-secondary text-white hover:bg-secondary/90 border-0 dark:bg-white dark:text-secondary w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2"
                  >
                    <span class="leading-none">Échanger sur votre projet</span>
                    <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">arrow_forward</mat-icon>
                  </a>
                  <a
                    routerLink="/trainings"
                    matRipple
                    [matRippleColor]="'rgba(0, 0, 0, 0.1)'"
                    class="btn btn-lg w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2 border-2 border-secondary dark:border-white text-secondary dark:text-white hover:bg-secondary hover:text-white dark:hover:bg-white dark:hover:text-secondary transition-all"
                  >
                    <span class="leading-none">Explorer les formations</span>
                    <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">arrow_forward</mat-icon>
                  </a>
                </div>
              </div>

              <!-- Colonne visuel -->
              <div class="w-full lg:w-1/2">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-sm font-semibold text-secondary dark:text-accent">Diagnostic & cadrage</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-1">
                      Analyse des besoins, des publics, des contraintes opérationnelles et des objectifs stratégiques.
                    </p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-sm font-semibold text-secondary dark:text-accent">Ingénierie pédagogique</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-1">
                      Construction de parcours, choix des formats, définition des livrables et des modalités d'évaluation.
                    </p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-sm font-semibold text-secondary dark:text-accent">Déploiement encadré</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-1">
                      Planification, animation des sessions, coordination des intervenants et communication interne.
                    </p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-sm font-semibold text-secondary dark:text-accent">Mesure & amélioration</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-1">
                      Indicateurs, questionnaires, revues de fin de parcours et ajustements continus.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="main-container mt-10 space-y-12">
        <!-- Bloc 1 : Étapes de construction du projet -->
        <section class="space-y-4">
          <h2 class="text-2xl lg:text-3xl font-semibold text-secondary dark:text-accent">
            Les grandes étapes de votre projet de formation
          </h2>
          <ol class="list-decimal list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
            <li><strong>Recueil du besoin</strong> : clarification des enjeux (techniques, métiers, réglementaires), des publics cibles et du calendrier.</li>
            <li><strong>Diagnostic</strong> : analyse du niveau actuel, des compétences manquantes et des contraintes opérationnelles.</li>
            <li><strong>Cadrage</strong> : définition des objectifs pédagogiques, des indicateurs de réussite et des livrables attendus.</li>
            <li><strong>Conception</strong> : choix des modules, formats (présentiel, distanciel, hybride), modalités d’évaluation et intégration d’EVA.</li>
            <li><strong>Déploiement</strong> : animation des sessions, accompagnement des équipes, ajustements en temps réel.</li>
            <li><strong>Évaluation & reporting</strong> : synthèse des résultats, recommandations, plan de consolidation éventuel.</li>
          </ol>
        </section>

        <!-- Bloc 2 : Acteurs impliqués -->
        <section class="grid gap-8 lg:grid-cols-2 items-start">
          <div class="space-y-4">
            <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
              Acteurs impliqués côté entreprise</h3>
            <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
              <li><strong>Direction générale / direction métier</strong> : définition des priorités stratégiques.</li>
              <li><strong>Direction des ressources humaines</strong> : articulation avec les politiques de compétences et de GPEC.</li>
              <li><strong>Managers opérationnels</strong> : identification des cas d’usage et des situations de travail à intégrer.</li>
              <li><strong>Référents techniques</strong> : validation des technologies, outils et environnements concernés.</li>
            </ul>
          </div>
          <div class="space-y-4">
            <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
              Acteurs impliqués côté Unlock Formation</h3>
            <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
              <li><strong>Responsables pédagogiques</strong> : conception globale du dispositif et garantie de cohérence.</li>
              <li><strong>Experts formateurs</strong> : animation, retours d’expérience concrets, accompagnement des projets.</li>
              <li><strong>Équipe coordination</strong> : logistique, planning, lien entre vos équipes et les intervenants.</li>
              <li><strong>EVA, assistant IA</strong> : support complémentaire pour les apprenants (révision, reformulation, exemples).</li>
            </ul>
          </div>
        </section>

        <!-- Bloc 3 : Formats et modalités -->
        <section class="space-y-4">
          <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
            Formats et modalités possibles
          </h3>
          <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
            Le projet de formation peut combiner plusieurs modalités pour répondre finement à vos contraintes et objectifs :
          </p>
          <div class="grid gap-4 md:grid-cols-3">
            <div class="p-4 rounded-2xl bg-background-2/60 dark:bg-background-7/60 border border-stroke-2 dark:border-stroke-6">
              <p class="text-sm font-semibold text-secondary dark:text-accent mb-1">Formations intra sur mesure</p>
              <p class="text-sm text-secondary/70 dark:text-accent/70">
                Sessions dédiées à vos équipes, construites sur vos outils, vos données et vos cas d’usage.
              </p>
            </div>
            <div class="p-4 rounded-2xl bg-background-2/60 dark:bg-background-7/60 border border-stroke-2 dark:border-stroke-6">
              <p class="text-sm font-semibold text-secondary dark:text-accent mb-1">Parcours blended</p>
              <p class="text-sm text-secondary/70 dark:text-accent/70">
                Combinaison de présentiel, de distanciel synchrone et de travail autonome guidé par EVA.
              </p>
            </div>
            <div class="p-4 rounded-2xl bg-background-2/60 dark:bg-background-7/60 border border-stroke-2 dark:border-stroke-6">
              <p class="text-sm font-semibold text-secondary dark:text-accent mb-1">Coaching et ateliers ciblés</p>
              <p class="text-sm text-secondary/70 dark:text-accent/70">
                Sessions courtes, centrées sur un sujet précis : revue d’architecture, optimisation d’un pipeline, renforcement d’une équipe.</p>
            </div>
          </div>
        </section>

        <!-- Bloc 4 : Financement et conformité -->
        <section class="space-y-4">
          <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
            Financement et conformité qualité
          </h3>
          <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
            Unlock Formation s'inscrit dans une démarche qualité conforme aux exigences des organismes financeurs. Selon le contexte,
            certains projets peuvent être éligibles à une prise en charge partielle ou totale par les OPCO ou d'autres dispositifs.
          </p>
          <p class="text-xs text-secondary/60 dark:text-accent/60 leading-relaxed">
            Les informations relatives au financement sont fournies à titre indicatif et nécessitent une étude au cas par cas
            avec l’entreprise et les financeurs concernés. Il est recommandé de se référer aux textes officiels et aux accords
            applicables à votre structure.
          </p>
        </section>

        <!-- Bloc 5 : Engagements Unlock -->
        <section class="space-y-4">
          <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
            Nos engagements sur votre projet</h3>
          <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
            <li>Transparence sur les objectifs, les livrables et les modalités d’évaluation.</li>
            <li>Interventions assurées par des <strong>experts en activité</strong> dans les domaines concernés.</li>
            <li>Parcours construits pour générer un impact mesurable sur les compétences et la performance opérationnelle.</li>
            <li>Suivi régulier et points d’étape partagés avec vos équipes référentes.</li>
          </ul>
        </section>

        <!-- Bloc 6 : Mentions d'information -->
        <section class="space-y-3 rounded-2xl border border-stroke-2 dark:border-stroke-6 bg-background-2/60 dark:bg-background-7/60 p-5 md:p-6">
          <h3 class="text-lg font-semibold text-secondary dark:text-accent">
            Mentions d’information importantes
          </h3>
          <p class="text-xs text-secondary/70 dark:text-accent/70 leading-relaxed">
            Cette page a pour objectif de présenter les grandes lignes de notre accompagnement en matière de projets de formation.
            Elle ne constitue pas un engagement contractuel. Les modalités précises de chaque projet sont formalisées au sein de
            propositions, devis, conventions et contrats validés entre les parties.
          </p>
        </section>
      </div>
    </section>
  `,
})
export class TrainingProjectComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('projectParallax', { static: false }) projectParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();
  private readonly seoService = inject(SeoService);

  constructor(
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService
  ) {}

  ngOnInit(): void {
    // Configuration SEO pour la page Projet de formation
    const breadcrumbSchema = this.seoService.generateBreadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'Projet de formation', url: '/projet-formation' }
    ]);

    this.seoService.updateSeoData({
      title: 'Projet de formation entreprise | Unlock Formation',
      description: 'Unlock Formation accompagne les entreprises dans la conception de projets de formation IT & IA sur mesure. Diagnostic, ingénierie pédagogique, déploiement et suivi pour vos équipes.',
      keywords: 'formation entreprise IT, formation intra entreprise, projet formation sur mesure, montée en compétences IT entreprise, formation personnalisée entreprise',
      image: '/assets/images/logo/main-logo.png',
      url: '/projet-formation',
      type: 'website',
      schema: breadcrumbSchema
    });
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.projectParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.projectParallax.nativeElement,
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
