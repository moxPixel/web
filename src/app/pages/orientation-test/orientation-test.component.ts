import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { OrientationApiService } from '../../services/api/orientation-api.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { SeoService } from '../../services/seo.service';
import {
  OrientationObjective,
  OrientationProfileAnswers,
  OrientationProfileType,
  OrientationRequestPayload,
  OrientationResult,
} from '../../interfaces/orientation-api.interface';

interface ProfileOption {
  value: OrientationProfileType;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-orientation-test',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, MatIconModule, MatRippleModule],
  templateUrl: './orientation-test.component.html',
  styleUrls: ['./orientation-test.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrientationTestComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('orientationParallax', { static: false }) orientationParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  
  private fb = inject(FormBuilder);
  private api = inject(OrientationApiService);
  private gsapScroll = inject(GsapScrollService);
  private pageLoaderInline = inject(PageLoaderInlineService);
  private seoService = inject(SeoService);
  private destroy$ = new Subject<void>();

  step = 1;
  selectedProfile: OrientationProfileType | null = null;
  profileForm!: FormGroup;
  softSkillsForm!: FormGroup;
  isSubmitting = false;
  result: OrientationResult | null = null;
  error: string | null = null;

  profileOptions: ProfileOption[] = [
    { value: 'particulier', title: 'Particulier / Demandeur d’emploi', description: 'Clarifier votre reconversion ou prochaine étape.', icon: 'person' },
    { value: 'etudiant', title: 'Étudiant', description: 'Identifier alternance, stage ou pivot technique.', icon: 'school' },
    { value: 'entreprise', title: 'Entreprise / RH', description: 'Cartographier vos besoins en montée en compétences.', icon: 'apartment' },
    { value: 'porteur-projet', title: 'Porteur de projet', description: 'Structurer votre roadmap produit ou MVP.', icon: 'rocket_launch' },
    { value: 'etranger', title: 'Personne venant de l’étranger', description: 'Adapter votre parcours aux conditions locales.', icon: 'public' },
  ];

  objectiveOptions: { value: OrientationObjective; label: string }[] = [
    { value: 'emploi', label: 'Trouver un emploi' },
    { value: 'reconversion', label: 'Reconversion' },
    { value: 'alternance', label: 'Alternance' },
    { value: 'stage', label: 'Stage' },
    { value: 'autonomie', label: 'Autonomie technique' },
    { value: 'comprehension', label: 'Comprendre et piloter' },
    { value: 'gestion-equipe', label: 'Gérer une équipe tech' },
    { value: 'montee-competences', label: 'Monter en compétences' },
    { value: 'incertain', label: 'À clarifier' },
  ];

  trainingNeedsOptions: string[] = [
    'IA appliquée',
    'Développement web',
    'Cybersécurité',
    'Support IT',
    'Data / BI',
    'Product / gestion de projet',
  ];

  ngOnInit(): void {
    const breadcrumbSchema = this.seoService.generateBreadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'Test d\'orientation', url: '/orientation' }
    ]);

    // Configuration SEO pour la page Test d'orientation
    this.seoService.updateSeoData({
      title: 'Test d\'orientation professionnelle IT & IA | Unlock Formation',
      description: 'Découvrez votre profil et les formations IT & IA qui vous correspondent grâce à notre test d\'orientation gratuit. Analyse de vos compétences, motivations et recommandations personnalisées.',
      keywords: 'test orientation IT, test orientation IA, test orientation professionnelle, orientation formation IT, test compétences IT, orientation carrière numérique',
      image: '/assets/images/logo/main-logo.png',
      url: '/orientation',
      type: 'website',
      schema: breadcrumbSchema
    });
    this.initForms();
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.orientationParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.orientationParallax.nativeElement,
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

  selectProfile(profile: OrientationProfileType): void {
    this.selectedProfile = profile;
    this.result = null;
    this.error = null;
    this.buildProfileForm(profile);
  }

  nextStep(): void {
    if (this.step === 1) {
      if (!this.selectedProfile) return;
      this.selectProfile(this.selectedProfile);
      this.step = 2;
      return;
    }
    if (this.step === 2 && this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    if (this.step === 3 && this.softSkillsForm.invalid) {
      this.softSkillsForm.markAllAsTouched();
      return;
    }
    this.step = Math.min(this.step + 1, 4);
  }

  previousStep(): void {
    this.step = Math.max(1, this.step - 1);
  }

  submit(): void {
    if (!this.selectedProfile || this.profileForm.invalid || this.softSkillsForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.softSkillsForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.isSubmitting = true;
    this.error = null;

    this.api
      .submit(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.result = data;
          this.step = 4;
          this.isSubmitting = false;
        },
        error: (err) => {
          this.error = err.message || 'Impossible de finaliser le test pour le moment.';
          this.isSubmitting = false;
        },
      });
  }

  get kpiList(): Array<{ label: string; value: number | null }> {
    if (!this.result) return [];
    return [
      { label: 'Digital', value: this.result.kpis.digitalScore },
      { label: 'Soft Skills', value: this.result.kpis.softSkillsScore },
      { label: 'Motivation', value: this.result.kpis.motivationScore },
      { label: 'Alternance', value: this.result.kpis.alternanceEligibility.applicable ? this.result.kpis.alternanceEligibility.score : null },
      { label: 'Job Readiness', value: this.result.kpis.jobReadinessScore },
    ];
  }

  get topFormationsValue(): any[] {
    return this.result?.topFormations ?? [];
  }

  get profileTypeValue(): string {
    return this.result?.summary?.profileType ?? '';
  }

  get primaryObjectiveValue(): string {
    return this.result?.summary?.primaryObjective ?? 'Non renseigné';
  }

  get aiReportValue(): string {
    const rawReport = this.result?.aiReport ?? '';
    return this.formatReportToHtml(rawReport);
  }

  private formatReportToHtml(text: string): string {
    if (!text) return '';

    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let listType = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Ligne vide
      if (!line) {
        if (inList) {
          html += listType === 'ul' ? '</ul>' : '</ol>';
          inList = false;
        }
        continue;
      }

      // Détection de titre (ligne se terminant par ":" sans autre ponctuation)
      if (line.endsWith(':') && !line.includes('?') && !line.includes('.') && line.length < 100) {
        if (inList) {
          html += listType === 'ul' ? '</ul>' : '</ol>';
          inList = false;
        }
        const titleText = line.slice(0, -1);
        // Premier niveau de titre
        if (i === 0 || titleText.length < 50) {
          html += `<h3>${this.escapeHtml(titleText)}</h3>`;
        } else {
          html += `<h4>${this.escapeHtml(titleText)}</h4>`;
        }
        continue;
      }

      // Détection de liste non ordonnée (- ou •)
      if (line.match(/^[-•*]\s+/)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
          listType = 'ul';
        } else if (listType === 'ol') {
          html += '</ol><ul>';
          listType = 'ul';
        }
        const content = line.replace(/^[-•*]\s+/, '');
        html += `<li>${this.formatInlineStyles(content)}</li>`;
        continue;
      }

      // Détection de liste ordonnée (1. 2. etc.)
      if (line.match(/^\d+\.\s+/)) {
        if (!inList) {
          html += '<ol>';
          inList = true;
          listType = 'ol';
        } else if (listType === 'ul') {
          html += '</ul><ol>';
          listType = 'ol';
        }
        const content = line.replace(/^\d+\.\s+/, '');
        html += `<li>${this.formatInlineStyles(content)}</li>`;
        continue;
      }

      // Paragraphe normal
      if (inList) {
        html += listType === 'ul' ? '</ul>' : '</ol>';
        inList = false;
      }
      html += `<p>${this.formatInlineStyles(line)}</p>`;
    }

    // Fermer la liste si elle est encore ouverte
    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
    }

    return html;
  }

  private formatInlineStyles(text: string): string {
    // D'abord échapper le HTML pour sécurité
    let escaped = this.escapeHtml(text);
    // Puis appliquer les styles markdown
    // Gras **texte** d'abord
    escaped = escaped.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    // Italique *texte* ensuite (en évitant les ** restants)
    escaped = escaped.replace(/\*([^*<]+?)\*/g, '<em>$1</em>');
    return escaped;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  get digitalComfortValue(): number {
    if (!this.result?.summary?.keyFacts) {
      return this.profileForm.value.digitalComfort || 0;
    }
    const digitalComfort = this.result.summary.keyFacts['digitalComfort'];
    return typeof digitalComfort === 'number' ? digitalComfort : this.profileForm.value.digitalComfort || 0;
  }

  get ageValue(): number | string {
    if (!this.result?.summary?.keyFacts) {
      return '—';
    }
    const age = this.result.summary.keyFacts['age'];
    return typeof age === 'number' ? age : '—';
  }

  private initForms(): void {
    this.softSkillsForm = this.fb.group({
      logic: new FormControl(3, [Validators.required, Validators.min(1), Validators.max(5)]),
      autonomy: new FormControl(3, [Validators.required, Validators.min(1), Validators.max(5)]),
      creativity: new FormControl(3, [Validators.required, Validators.min(1), Validators.max(5)]),
      patience: new FormControl(3, [Validators.required, Validators.min(1), Validators.max(5)]),
      communication: new FormControl(3, [Validators.required, Validators.min(1), Validators.max(5)]),
      techComfort: new FormControl(3, [Validators.required, Validators.min(1), Validators.max(5)]),
    });
  }

  private buildProfileForm(profile: OrientationProfileType): void {
    this.profileForm = this.fb.group({
      age: [null],
      objective: [null, Validators.required],
      digitalComfort: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      poleEmploi: [false],
      cpfDisponible: [false],
      currentStudies: [null],
      companySize: [null],
      trainingNeeds: [[]],
      headcountToTrain: [null],
      budgetLevel: [null],
      projectType: [null],
      visaStatus: [null],
      languageLevel: [null],
      notes: [null],
    });

    // Adjust required fields by profile
    switch (profile) {
      case 'etudiant':
        this.profileForm.get('currentStudies')?.setValidators([Validators.required]);
        this.profileForm.get('objective')?.setValidators([Validators.required]);
        break;
      case 'entreprise':
        this.profileForm.get('companySize')?.setValidators([Validators.required]);
        this.profileForm.get('trainingNeeds')?.setValidators([Validators.required]);
        this.profileForm.get('budgetLevel')?.setValidators([Validators.required]);
        break;
      case 'porteur-projet':
        this.profileForm.get('projectType')?.setValidators([Validators.required]);
        this.profileForm.get('objective')?.setValidators([Validators.required]);
        break;
      case 'etranger':
        this.profileForm.get('visaStatus')?.setValidators([Validators.required]);
        this.profileForm.get('languageLevel')?.setValidators([Validators.required]);
        this.profileForm.get('objective')?.setValidators([Validators.required]);
        break;
      default:
        break;
    }

    this.profileForm.updateValueAndValidity();
  }

  toggleTrainingNeed(option: string, checked: boolean): void {
    const current = this.profileForm.value.trainingNeeds || [];
    const next = checked ? Array.from(new Set([...current, option])) : current.filter((item: string) => item !== option);
    this.profileForm.patchValue({ trainingNeeds: next });
  }

  private buildPayload(): OrientationRequestPayload {
    const profileValue = this.profileForm.value;
    const softSkills = this.softSkillsForm.value;

    // Build profile object with only relevant fields based on profile type
    const profile: Record<string, any> = {
      digitalComfort: profileValue.digitalComfort,
    };

    // Add age if provided
    if (profileValue.age) {
      profile['age'] = profileValue.age;
    }

    // Add objective if provided
    if (profileValue.objective) {
      profile['objective'] = profileValue.objective;
    }

    // Profile-specific fields
    if (this.selectedProfile === 'particulier') {
      if (profileValue.poleEmploi !== null && profileValue.poleEmploi !== undefined) {
        profile['poleEmploi'] = profileValue.poleEmploi;
      }
      if (profileValue.cpfDisponible !== null && profileValue.cpfDisponible !== undefined) {
        profile['cpfDisponible'] = profileValue.cpfDisponible;
      }
    } else if (this.selectedProfile === 'etudiant') {
      if (profileValue.currentStudies) {
        profile['currentStudies'] = profileValue.currentStudies;
      }
    } else if (this.selectedProfile === 'entreprise') {
      if (profileValue.companySize) {
        profile['companySize'] = profileValue.companySize;
      }
      if (profileValue.trainingNeeds && Array.isArray(profileValue.trainingNeeds) && profileValue.trainingNeeds.length > 0) {
        profile['trainingNeeds'] = profileValue.trainingNeeds;
      }
      if (profileValue.headcountToTrain) {
        profile['headcountToTrain'] = profileValue.headcountToTrain;
      }
      if (profileValue.budgetLevel) {
        profile['budgetLevel'] = profileValue.budgetLevel;
      }
    } else if (this.selectedProfile === 'porteur-projet') {
      if (profileValue.projectType) {
        profile['projectType'] = profileValue.projectType;
      }
    } else if (this.selectedProfile === 'etranger') {
      if (profileValue.visaStatus) {
        profile['visaStatus'] = profileValue.visaStatus;
      }
      if (profileValue.languageLevel) {
        profile['languageLevel'] = profileValue.languageLevel;
      }
    }

    return {
      profileType: this.selectedProfile as OrientationProfileType,
      digitalComfort: profileValue.digitalComfort,
      profile: profile as OrientationProfileAnswers,
      softSkills,
      notes: profileValue.notes || undefined,
    };
  }

  getSkillLabel(skill: string): string {
    const labels: Record<string, string> = {
      logic: 'Logique',
      autonomy: 'Autonomie',
      creativity: 'Créativité',
      patience: 'Patience',
      communication: 'Communication',
      techComfort: 'Aisance technologique',
    };
    return labels[skill] || skill;
  }

  getDigitalComfortLabel(value: number): string {
    const labels: Record<number, string> = {
      1: 'Débutant',
      2: 'Intermédiaire débutant',
      3: 'Intermédiaire',
      4: 'Avancé',
      5: 'Expert',
    };
    return labels[value] || 'Non défini';
  }
}
