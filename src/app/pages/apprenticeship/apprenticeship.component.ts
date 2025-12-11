import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
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
  selector: 'app-apprenticeship',
  standalone: true,
  imports: [CommonModule, RouterModule, MatRippleModule, MatIconModule],
  template: `
    <section class="mt-3 relative px-4 sm:px-6 md:px-8 lg:px-12 overflow-visible min-h-[calc(100vh-120px)] lg:pb-[100px] pb-16 bg-background-1 dark:bg-background-8" aria-label="Alternance IT & IA">
      <div class="max-w-[1920px] mx-auto relative">
        <!-- Sphères lumineuses -->
        <div class="hero-spheres" aria-hidden="true">
          <div class="hero-sphere hero-sphere--1"></div>
          <div class="hero-sphere hero-sphere--2"></div>
          <div class="hero-sphere hero-sphere--3"></div>
        </div>

        <div
          #alternanceParallax
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
                <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Alternance IT & IA</p>

                <!-- H1 Mobile -->
                <h1 class="md:hidden max-w-[976px] mx-auto mb-4 text-xl sm:text-2xl leading-tight">
                  IT & IA : une alternance à <span class="text-primary-500 dark:text-ns-green-light">haute valeur professionnelle</span>
                </h1>

                <!-- H1 Desktop -->
                <h1 class="hidden md:block max-w-[976px] md:w-full mx-auto lg:mx-0 mb-4 text-xl md:text-2xl lg:text-3xl" style="word-break: keep-all; hyphens: none; line-height: 1.3;">
                  IT & IA : une alternance à <span class="text-primary-500 dark:text-ns-green-light" style="white-space: nowrap;">haute valeur professionnelle</span>
                </h1>

                <!-- Description -->
                <p class="max-w-[800px] mx-auto lg:mx-0 mb-6 text-base md:text-lg leading-relaxed text-secondary/80 dark:text-accent/80">
                  Unlock Formation structure des parcours en alternance dans les domaines du <strong>développement web</strong>,
                  de la <strong>data et de l'intelligence artificielle</strong>, de la <strong>cybersécurité</strong>, du
                  <strong>cloud et DevOps</strong> et des <strong>réseaux et systèmes</strong>. L'objectif : former des professionnels immédiatement opérationnels, en conjuguant exigence académique et expérience en entreprise.
                </p>

                <div class="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 w-[90%] md:w-auto mx-auto lg:mx-0">
                  <a
                    routerLink="/contact"
                    matRipple
                    [matRippleColor]="'rgba(255, 255, 255, 0.3)'"
                    class="btn btn-lg bg-secondary text-white hover:bg-secondary/90 border-0 dark:bg-white dark:text-secondary w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2"
                  >
                    <mat-icon class="!w-[18px] !h-[18px] !text-[18px] !leading-[18px] flex-shrink-0">phone</mat-icon>
                    <span class="leading-none">Nous contacter</span>
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

              <!-- Colonne visuel -->
              <div class="w-full lg:w-1/2">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-2xl font-bold text-secondary dark:text-accent">Contrat d'apprentissage</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-2">
                      Statut salarié, protection sociale, formation financée par l’OPCO de l’entreprise d’accueil.
                    </p>
                  </div>
                  <div class="glassmorphism-content-card p-5 rounded-2xl bg-white/80 dark:bg-[rgba(24,29,38,0.75)] border border-stroke-2 dark:border-stroke-6 shadow-sm">
                    <p class="text-2xl font-bold text-secondary dark:text-accent">Contrat de professionnalisation</p>
                    <p class="text-sm text-secondary/70 dark:text-accent/70 mt-2">
                      Montée en compétences ciblée pour salariés ou demandeurs d’emploi, avec prise en charge partielle ou totale.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="main-container mt-10 space-y-12">
        <!-- Bloc 1 : Principes de l'alternance -->
        <section class="space-y-4">
          <h2 class="text-2xl lg:text-3xl font-semibold text-secondary dark:text-accent">
            Comprendre le fonctionnement de l'alternance
          </h2>
          <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
            L'alternance repose sur une articulation entre périodes en organisme de formation et périodes en entreprise.
            L’apprenant est salarié de l’entreprise d’accueil et bénéficie d’un contrat de travail spécifique (apprentissage
            ou professionnalisation), régi par le Code du travail et, le cas échéant, par la convention collective applicable.
          </p>
          <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
            <li>Périodes de formation encadrées par un programme détaillé et validé par la direction pédagogique.</li>
            <li>Temps en entreprise dédié à la mise en pratique des compétences visées par le parcours.</li>
            <li>Suivi tripartite : organisme de formation, tuteur ou maître d’apprentissage en entreprise, alternant.</li>
          </ul>
        </section>

        <!-- Bloc 2 : Publics concernés et prérequis -->
        <section class="grid gap-8 lg:grid-cols-3 items-start">
          <!-- Image visuelle -->
          <div class="lg:col-span-1 order-3 lg:order-1">
            <div class="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/assets/images/img/g1.jpg"
                alt="Alternance IT & IA - Formation en entreprise"
                loading="lazy"
                class="w-full h-auto object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
          </div>
          
          <!-- Contenu texte -->
          <div class="lg:col-span-2 grid gap-8 lg:grid-cols-2 order-1 lg:order-2">
          <div class="space-y-4">
            <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
              Profils éligibles et prérequis
            </h3>
            <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
              Les parcours en alternance Unlock Formation s’adressent principalement aux publics suivants, sous réserve
              d’éligibilité au regard de la réglementation en vigueur :
            </p>
            <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
              <li>Étudiants ou apprenants préparant un titre ou un diplôme dans les métiers du numérique.</li>
              <li>Personnes en reconversion souhaitant intégrer un métier de l’IT ou de l’IA.</li>
              <li>Salariés en montée en compétences dans le cadre d'un projet de mobilité interne.</li>
              <li>Demandeurs d’emploi dans le cadre d’un projet validé avec un conseiller (mission locale, Pôle emploi, etc.).</li>
            </ul>
            <p class="text-xs text-secondary/60 dark:text-accent/60">
              Les conditions d'âge, de niveau académique et de statut varient selon le type de contrat et la réglementation applicable.
              Un échange préalable avec nos équipes est systématiquement organisé pour vérifier l'éligibilité.
            </p>
          </div>
          <div class="space-y-4">
            <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
              Domaines et types de missions en entreprise
            </h3>
            <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
              Les missions confiées en entreprise sont définies en cohérence avec le parcours de formation suivi :
            </p>
            <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
              <li><strong>Développement web et mobile</strong> : réalisation de fonctionnalités, maintenance applicative, intégration d’API.</li>
              <li><strong>Data & IA</strong> : préparation de données, automatisation de traitements, prototypage de modèles.</li>
              <li><strong>Cybersécurité</strong> : participation à des audits, durcissement de configurations, sensibilisation des équipes.</li>
              <li><strong>Cloud & DevOps</strong> : déploiement d’environnements, industrialisation de pipelines, supervision.</li>
              <li><strong>Réseaux & systèmes</strong> : administration, supervision, contribution à des projets d’évolution d’infrastructure.</li>
            </ul>
          </div>
          </div>
        </section>

        <!-- Bloc 3 : Rémunération et financement -->
        <section class="space-y-4">
          <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
            Rémunération, statut et financement
          </h3>
          <p class="text-secondary/80 dark:text-accent/80 leading-relaxed">
            En alternance, l’apprenant bénéficie du statut de salarié. La rémunération et les modalités de prise en charge
            financière dépendent de plusieurs paramètres (type de contrat, âge, niveau de formation, convention collective,
            accords de branche, etc.).
          </p>
          <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
            <li><strong>Rémunération</strong> : définie sur la base des barèmes légaux et conventionnels applicables au contrat (apprentissage ou professionnalisation).</li>
            <li><strong>Frais pédagogiques</strong> : généralement pris en charge, en tout ou partie, par l’OPCO de l’entreprise d’accueil ou par d’autres dispositifs selon le statut.</li>
            <li><strong>Protection sociale</strong> : l’alternant bénéficie de la protection liée à son statut de salarié (santé, retraite, etc.).</li>
          </ul>
          <p class="text-xs text-secondary/60 dark:text-accent/60">
            Les informations relatives à la rémunération et au financement sont fournies à titre indicatif et doivent être
            confirmées dans le cadre de l’étude de chaque dossier, en lien avec l’entreprise d’accueil et les financeurs.
            Pour une information détaillée et à jour, il est recommandé de consulter les ressources officielles
            (par exemple : service-public.fr) et les textes applicables.
          </p>
        </section>

        <!-- Bloc 4 : Engagements pédagogiques Unlock -->
        <section class="space-y-4">
          <h3 class="text-xl lg:text-2xl font-semibold text-secondary dark:text-accent">
            Engagements pédagogiques d’Unlock Formation
          </h3>
          <ul class="list-disc list-inside text-secondary/80 dark:text-accent/80 space-y-2 text-sm md:text-base">
            <li>Contenus alignés sur les référentiels de compétences visés et les besoins du marché.</li>
            <li>Interventions assurées par des experts en activité dans les domaines enseignés.</li>
            <li>Parcours structurés autour de projets concrets et d’évaluations régulières.</li>
            <li>Suivi individuel de l'alternant, en lien avec le tuteur ou maître d’apprentissage.</li>
            <li>Utilisation d’<strong>EVA</strong>, notre assistant IA, comme appui pédagogique complémentaire.</li>
          </ul>
        </section>

        <!-- Bloc 5 : Mentions d’information importantes -->
        <section class="space-y-3 rounded-2xl border border-stroke-2 dark:border-stroke-6 bg-background-2/60 dark:bg-background-7/60 p-5 md:p-6">
          <h3 class="text-lg font-semibold text-secondary dark:text-accent">
            Mentions d’information importantes
          </h3>
          <p class="text-xs text-secondary/70 dark:text-accent/70 leading-relaxed">
            Les informations présentées sur cette page ont pour objet de décrire de manière générale le fonctionnement de
            l’alternance et les modalités possibles dans le cadre des parcours proposés par Unlock Formation. Elles ne
            constituent pas un document contractuel et peuvent évoluer en fonction des textes réglementaires,
            conventionnels et des accords passés avec les entreprises et les financeurs.
          </p>
          <p class="text-xs text-secondary/70 dark:text-accent/70 leading-relaxed">
            Les conditions précises (rémunération, durée, rythme, prise en charge financière, etc.) sont détaillées dans
            les conventions, contrats et documents officiels signés entre les parties (apprenant, entreprise, organisme
            de formation, financeurs). Il appartient à chaque partie de vérifier les dispositions légales et conventionnelles applicables.
          </p>
        </section>
      </div>
    </section>
  `,
})
export class ApprenticeshipComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('alternanceParallax', { static: false }) alternanceParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();
  private readonly seoService = inject(SeoService);

  constructor(
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService
  ) {}

  ngOnInit(): void {
    // Configuration SEO pour la page Alternance
    this.seoService.updateSeoData({
      title: 'Alternance IT & IA | Unlock Formation',
      description: 'Formations en alternance IT & IA : contrats d\'apprentissage et de professionnalisation. Rémunération, financement OPCO, accompagnement carrière. Devenez développeur, data scientist ou expert cybersécurité en alternance.',
      keywords: 'alternance IT, alternance IA, contrat apprentissage IT, alternance cybersécurité, alternance développement web, alternance data science, contrat professionnalisation IT, rémunération alternance',
      image: '/assets/images/logo/main-logo.png',
      url: '/alternance',
      type: 'website'
    });
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.alternanceParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.alternanceParallax.nativeElement,
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

