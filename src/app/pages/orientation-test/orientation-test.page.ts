import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrientationApiService } from '../../services/api/orientation-api.service';
import {
  OrientationObjective,
  OrientationProfileAnswers,
  OrientationProfileType,
  OrientationRequestPayload,
  OrientationResult,
  QuizChoice,
} from '../../interfaces/orientation-api.interface';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

type ProfileOption = {
  value: OrientationProfileType;
  title: string;
  description: string;
  icon: 'user' | 'graduation-cap' | 'building' | 'rocket' | 'world';
};

@Component({
  selector: 'app-orientation-test-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './orientation-test.page.html',
  styleUrl: './orientation-test.page.css',
})
export class OrientationTestPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OrientationApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  step = 1;
  selectedProfile: OrientationProfileType | null = null;
  profileForm!: FormGroup;
  assessmentForm!: FormGroup;
  softSkillsForm!: FormGroup;
  isSubmitting = false;
  result: OrientationResult | null = null;

  readonly profileOptions: ProfileOption[] = [
    { value: 'particulier', title: 'Particulier / Demandeur d’emploi', description: 'Clarifier votre reconversion ou prochaine étape.', icon: 'user' },
    { value: 'etudiant', title: 'Étudiant', description: 'Identifier alternance, stage ou pivot technique.', icon: 'graduation-cap' },
    { value: 'entreprise', title: 'Entreprise / RH', description: 'Cartographier vos besoins en montée en compétences.', icon: 'building' },
    { value: 'porteur-projet', title: 'Porteur de projet', description: 'Structurer votre roadmap produit ou MVP.', icon: 'rocket' },
    { value: 'etranger', title: 'Personne venant de l’étranger', description: 'Adapter votre parcours aux conditions locales.', icon: 'world' },
  ];

  readonly objectiveOptions: Array<{ value: OrientationObjective; label: string }> = [
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

  readonly trainingNeedsOptions: string[] = [
    'IA appliquée',
    'Développement web',
    'Cybersécurité',
    'Support IT',
    'Data / BI',
    'Product / gestion de projet',
  ];

  readonly logicQuestions: Array<{
    id: string;
    title: string;
    prompt: string;
    choices: Array<{ key: QuizChoice; label: string }>;
  }> = [
    {
      id: 'logic-1',
      title: 'Suite logique',
      prompt: 'Complétez la suite : 2, 4, 8, 16, …',
      choices: [
        { key: 'a', label: '18' },
        { key: 'b', label: '32' },
        { key: 'c', label: '24' },
        { key: 'd', label: '30' },
      ],
    },
    {
      id: 'logic-2',
      title: 'Raisonnement',
      prompt: 'Si tous les A sont B, et certains B sont C, alors :',
      choices: [
        { key: 'a', label: 'Tous les A sont C' },
        { key: 'b', label: 'Aucun A n’est C' },
        { key: 'c', label: 'On ne peut pas conclure pour A → C' },
        { key: 'd', label: 'Tous les C sont A' },
      ],
    },
    {
      id: 'logic-3',
      title: 'Priorisation',
      prompt: 'Vous avez 30 min et 3 tâches (5 min, 10 min, 20 min). Objectif: en finir le plus possible. Que faites‑vous ?',
      choices: [
        { key: 'a', label: '5 min + 10 min (2 tâches finies)' },
        { key: 'b', label: '20 min (1 tâche finie)' },
        { key: 'c', label: '10 min + 20 min (2 tâches, pile 30 min)' },
        { key: 'd', label: 'Je commence les 3' },
      ],
    },
    {
      id: 'logic-4',
      title: 'Déduction',
      prompt: 'Vous recevez une info “il y a exactement 1 badge bleu”. Cette phrase est utile car :',
      choices: [
        { key: 'a', label: 'Elle ne change rien' },
        { key: 'b', label: 'Elle donne la couleur à tout le monde' },
        { key: 'c', label: 'Elle prouve que tout est bleu' },
        { key: 'd', label: 'Elle permet une déduction progressive par élimination' },
      ],
    },
  ];

  readonly technicalQuestions: Array<{
    id: string;
    title: string;
    prompt: string;
    choices: Array<{ key: QuizChoice; label: string }>;
  }> = [
    {
      id: 'tech-1',
      title: 'HTTP',
      prompt: 'Quel code indique une ressource créée avec succès ?',
      choices: [
        { key: 'a', label: '200' },
        { key: 'b', label: '201' },
        { key: 'c', label: '204' },
        { key: 'd', label: '404' },
      ],
    },
    {
      id: 'tech-2',
      title: 'Git',
      prompt: 'Annuler le dernier commit local (non push) en gardant les fichiers modifiés :',
      choices: [
        { key: 'a', label: 'git reset --soft HEAD~1' },
        { key: 'b', label: 'git reset --hard HEAD~1' },
        { key: 'c', label: 'git revert HEAD' },
        { key: 'd', label: 'git checkout -- .' },
      ],
    },
    {
      id: 'tech-3',
      title: 'JavaScript',
      prompt: 'Que renvoie `typeof null` ?',
      choices: [
        { key: 'a', label: '"null"' },
        { key: 'b', label: '"nullobject"' },
        { key: 'c', label: '"object"' },
        { key: 'd', label: '"undefined"' },
      ],
    },
    {
      id: 'tech-4',
      title: 'Architecture',
      prompt: 'Quel principe évite de bloquer un serveur sur des opérations I/O lentes ?',
      choices: [
        { key: 'a', label: 'Boucles while' },
        { key: 'b', label: 'Toujours multi-thread' },
        { key: 'c', label: 'CPU à 100%' },
        { key: 'd', label: 'Asynchronisme / non‑blocking I/O' },
      ],
    },
  ];

  readonly personalityQuestions: Array<{
    id: string;
    title: string;
    prompt: string;
    choices: Array<{ key: QuizChoice; label: string }>;
  }> = [
    {
      id: 'pers-1',
      title: 'Style d’apprentissage',
      prompt: 'Quand vous bloquez, vous préférez :',
      choices: [
        { key: 'a', label: 'Chercher seul + expérimenter' },
        { key: 'b', label: 'Demander vite un feedback' },
        { key: 'c', label: 'Revenir à une méthode structurée' },
        { key: 'd', label: 'Itérer rapidement (quick wins)' },
      ],
    },
    {
      id: 'pers-2',
      title: 'Organisation',
      prompt: 'Vous êtes le plus à l’aise quand :',
      choices: [
        { key: 'a', label: 'Le plan est clair (roadmap, étapes)' },
        { key: 'b', label: 'On adapte en continu' },
        { key: 'c', label: 'On travaille en binôme' },
        { key: 'd', label: 'On avance vite, quitte à refactor' },
      ],
    },
    {
      id: 'pers-3',
      title: 'Environnement',
      prompt: 'Le format idéal pour progresser :',
      choices: [
        { key: 'a', label: 'Groupe + rythme commun' },
        { key: 'b', label: 'Autonomie + objectifs hebdo' },
        { key: 'c', label: 'Cadre fort + exercices guidés' },
        { key: 'd', label: 'Projets courts + retours rapides' },
      ],
    },
  ];

  ngOnInit(): void {
    this.initForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectProfile(profile: OrientationProfileType): void {
    this.selectedProfile = profile;
    this.result = null;
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
    if (this.step === 3 && this.assessmentForm.invalid) {
      this.assessmentForm.markAllAsTouched();
      this.notifications.warning('Réponses incomplètes', 'Merci de répondre aux questions Logique & Technique.');
      return;
    }
    if (this.step === 4 && this.softSkillsForm.invalid) {
      this.softSkillsForm.markAllAsTouched();
      return;
    }
    this.step = Math.min(this.step + 1, 5);
  }

  previousStep(): void {
    this.step = Math.max(1, this.step - 1);
  }

  toggleTrainingNeed(need: string, checked: boolean): void {
    const current: string[] = (this.profileForm.value.trainingNeeds || []).slice();
    const next = checked ? Array.from(new Set([...current, need])) : current.filter((x) => x !== need);
    this.profileForm.patchValue({ trainingNeeds: next });
  }

  submit(): void {
    if (!this.selectedProfile || this.profileForm.invalid || this.assessmentForm.invalid || this.softSkillsForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.assessmentForm.markAllAsTouched();
      this.softSkillsForm.markAllAsTouched();
      this.notifications.warning('Formulaire incomplet', 'Veuillez compléter les champs requis.');
      return;
    }

    const payload = this.buildPayload();
    this.isSubmitting = true;

    this.api
      .submit(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.result = data;
          this.step = 5;
          this.isSubmitting = false;
          this.notifications.success('Test terminé', 'Vos résultats sont prêts.');
        },
        error: (err: Error) => {
          this.isSubmitting = false;
          this.notifications.error('Échec', err.message || 'Impossible de finaliser le test pour le moment.');
        },
      });
  }

  restart(): void {
    this.step = 1;
    this.selectedProfile = null;
    this.result = null;
    this.initForms();
  }

  get kpiList(): Array<{ label: string; value: number | null }> {
    if (!this.result) return [];
    return [
      { label: 'Digital', value: this.result.kpis.digitalScore },
      { label: 'Soft Skills', value: this.result.kpis.softSkillsScore },
      { label: 'Motivation', value: this.result.kpis.motivationScore },
      { label: 'Logique', value: this.result.kpis.logicExerciseScore },
      { label: 'Technique', value: this.result.kpis.technicalExerciseScore },
      { label: 'Style', value: this.result.kpis.personalitySignalScore },
      {
        label: 'Alternance',
        value: this.result.kpis.alternanceEligibility.applicable ? this.result.kpis.alternanceEligibility.score : null,
      },
      { label: 'Job Readiness', value: this.result.kpis.jobReadinessScore },
    ];
  }

  kpiHint(value: number | null | undefined): { label: string; tone: 'muted' | 'good' | 'mid' | 'bad' } {
    if (value == null) return { label: 'Non concerné', tone: 'muted' };
    if (value >= 85) return { label: 'Excellent', tone: 'good' };
    if (value >= 70) return { label: 'Très bon', tone: 'good' };
    if (value >= 55) return { label: 'Bon', tone: 'mid' };
    if (value >= 40) return { label: 'À renforcer', tone: 'bad' };
    return { label: 'Prioritaire', tone: 'bad' };
  }

  get aiReportSafeHtml(): SafeHtml {
    const raw = this.result?.aiReport || '';
    return this.sanitizer.bypassSecurityTrustHtml(this.formatMarkdownToHtml(raw));
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      // common "comfort"
      digitalComfort: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    });

    this.assessmentForm = this.fb.group({
      logic: this.fb.group(
        Object.fromEntries(this.logicQuestions.map((q) => [q.id, ['', [Validators.required]]]))
      ),
      technical: this.fb.group(
        Object.fromEntries(this.technicalQuestions.map((q) => [q.id, ['', [Validators.required]]]))
      ),
      personality: this.fb.group(
        Object.fromEntries(this.personalityQuestions.map((q) => [q.id, ['', [Validators.required]]]))
      ),
    });

    this.softSkillsForm = this.fb.group({
      logic: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      autonomy: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      creativity: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      patience: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      communication: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      techComfort: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    });
  }

  private buildProfileForm(profile: OrientationProfileType): void {
    // Base controls
    const base: Record<string, any> = {
      digitalComfort: [this.profileForm?.value?.digitalComfort ?? 3, [Validators.required, Validators.min(1), Validators.max(5)]],
      objective: [null, [Validators.required]],
    };

    if (profile === 'particulier') {
      this.profileForm = this.fb.group({
        ...base,
        age: [null],
        poleEmploi: [null],
        cpfDisponible: [null],
      });
      return;
    }

    if (profile === 'etudiant') {
      this.profileForm = this.fb.group({
        ...base,
        age: [null],
        currentStudies: [''],
      });
      return;
    }

    if (profile === 'entreprise') {
      this.profileForm = this.fb.group({
        ...base,
        companySize: ['', [Validators.required]],
        headcountToTrain: [null],
        trainingNeeds: [[], [Validators.required]],
        budgetLevel: ['moyen'],
      });
      return;
    }

    if (profile === 'porteur-projet') {
      this.profileForm = this.fb.group({
        ...base,
        projectType: ['', [Validators.required]],
      });
      return;
    }

    // etranger
    this.profileForm = this.fb.group({
      ...base,
      age: [null],
      visaStatus: [''],
      languageLevel: ['', [Validators.required]],
    });
  }

  private buildPayload(): OrientationRequestPayload {
    const profileType = this.selectedProfile!;
    const clamp15 = (v: unknown): number => {
      const n = Math.round(Number(v));
      if (!Number.isFinite(n)) return 3;
      return Math.max(1, Math.min(5, n));
    };

    const digitalComfort = clamp15(this.profileForm.value.digitalComfort);
    const softSkills = {
      logic: clamp15(this.softSkillsForm.value.logic),
      autonomy: clamp15(this.softSkillsForm.value.autonomy),
      creativity: clamp15(this.softSkillsForm.value.creativity),
      patience: clamp15(this.softSkillsForm.value.patience),
      communication: clamp15(this.softSkillsForm.value.communication),
      techComfort: clamp15(this.softSkillsForm.value.techComfort),
    };

    // Build per-profile answers (mirror `web/` contract: `profile` object)
    const profile: OrientationProfileAnswers = (() => {
      const v = this.profileForm.value;
      const common = { objective: v.objective as OrientationObjective, digitalComfort };

      if (profileType === 'particulier') {
        return {
          ...common,
          age: v.age ?? undefined,
          poleEmploi: v.poleEmploi ?? undefined,
          cpfDisponible: v.cpfDisponible ?? undefined,
        } as any;
      }
      if (profileType === 'etudiant') {
        return {
          ...common,
          age: v.age ?? undefined,
          currentStudies: v.currentStudies ?? undefined,
        } as any;
      }
      if (profileType === 'entreprise') {
        return {
          ...common,
          companySize: v.companySize,
          trainingNeeds: v.trainingNeeds || [],
          headcountToTrain: v.headcountToTrain ?? undefined,
          budgetLevel: v.budgetLevel ?? undefined,
        } as any;
      }
      if (profileType === 'porteur-projet') {
        return {
          ...common,
          projectType: v.projectType,
        } as any;
      }
      return {
        ...common,
        age: v.age ?? undefined,
        visaStatus: v.visaStatus ?? undefined,
        languageLevel: v.languageLevel,
      } as any;
    })();

    const mapAnswers = (sectionValue: Record<string, unknown> | null | undefined) => {
      const v = sectionValue || {};
      return Object.entries(v)
        .map(([id, choice]) => {
          const c = String(choice || '') as QuizChoice;
          if (!id || !(['a', 'b', 'c', 'd'] as string[]).includes(c)) return null;
          return { id, choice: c };
        })
        .filter(Boolean) as Array<{ id: string; choice: QuizChoice }>;
    };

    const assessmentValue = (this.assessmentForm?.value || {}) as Record<string, any>;
    const assessment = {
      logic: { answers: mapAnswers(assessmentValue['logic']) },
      technical: { answers: mapAnswers(assessmentValue['technical']) },
      personality: { answers: mapAnswers(assessmentValue['personality']) },
    };

    return {
      profileType,
      digitalComfort,
      profile,
      softSkills,
      assessment,
    };
  }

  private escapeHtml(s: string): string {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private formatMarkdownToHtml(markdown: string): string {
    if (!markdown) return '';
    const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');

    let html = '';
    let inUl = false;
    let inOl = false;
    let inCode = false;
    let codeBuf: string[] = [];

    const closeLists = () => {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
    };

    const flushCode = () => {
      if (!inCode) return;
      const code = this.escapeHtml(codeBuf.join('\n'));
      html += `<pre class="ui-orientation__report-code"><code>${code}</code></pre>`;
      inCode = false;
      codeBuf = [];
    };

    const safeUrl = (url: string): string | null => {
      const u = url.trim();
      if (!u) return null;
      if (u.startsWith('/')) return u;
      if (u.startsWith('http://') || u.startsWith('https://')) return u;
      return null;
    };

    const renderInline = (raw: string): string => {
      let s = this.escapeHtml(raw);
      s = s.replace(/`([^`]+)`/g, `<code class="ui-orientation__report-inline-code">$1</code>`);
      s = s.replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`);
      s = s.replace(/\*([^*]+)\*/g, `<em>$1</em>`);
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
        const safe = safeUrl(String(url || ''));
        if (!safe) return String(label || '');
        const safeLabel = String(label || '');
        return `<a class="ui-link" href="${this.escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
      });
      return s;
    };

    for (const rawLine of lines) {
      const line = rawLine ?? '';

      if (line.trim().startsWith('```')) {
        closeLists();
        if (inCode) {
          flushCode();
        } else {
          inCode = true;
        }
        continue;
      }
      if (inCode) {
        codeBuf.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) {
        closeLists();
        html += '<div class="ui-orientation__report-spacer"></div>';
        continue;
      }

      const h3 = trimmed.match(/^###\s+(.*)$/);
      const h2 = trimmed.match(/^##\s+(.*)$/);
      const h1 = trimmed.match(/^#\s+(.*)$/);
      if (h1 || h2 || h3) {
        closeLists();
        const text = renderInline((h1?.[1] || h2?.[1] || h3?.[1] || '').trim());
        const cls = h1 ? 'ui-orientation__report-h2' : h2 ? 'ui-orientation__report-h3' : 'ui-orientation__report-h4';
        html += `<div class="${cls}">${text}</div>`;
        continue;
      }

      const ol = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (ol) {
        if (inUl) {
          html += '</ul>';
          inUl = false;
        }
        if (!inOl) {
          html += '<ol class="ui-orientation__report-ol">';
          inOl = true;
        }
        html += `<li>${renderInline(ol[2])}</li>`;
        continue;
      }

      const ul = trimmed.match(/^[-•]\s+(.*)$/);
      if (ul) {
        if (inOl) {
          html += '</ol>';
          inOl = false;
        }
        if (!inUl) {
          html += '<ul class="ui-orientation__report-list">';
          inUl = true;
        }
        html += `<li>${renderInline(ul[1])}</li>`;
        continue;
      }

      closeLists();
      html += `<p class="ui-orientation__report-p">${renderInline(trimmed)}</p>`;
    }

    flushCode();
    closeLists();
    return html;
  }
}


