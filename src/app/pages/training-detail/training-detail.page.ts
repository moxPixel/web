import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, Subject, catchError, map, of, startWith, switchMap, takeUntil } from 'rxjs';

import { Training } from '../../interfaces/training.interface';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { UploadApiService } from '../../services/api/upload-api.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';
import { QualitySectionComponent } from '../../components/home/quality-section/quality-section.component';
import { TrainingSuggestionsComponent } from '../../components/training-suggestions/training-suggestions.component';
import { SeoService } from '../../shared/services/seo/seo.service';
import { getSiteBaseUrl } from '../../shared/config/site-url';

@Component({
  selector: 'app-training-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective, QualitySectionComponent, TrainingSuggestionsComponent],
  templateUrl: './training-detail.page.html',
  styleUrl: './training-detail.page.css'
})
export class TrainingDetailPage implements OnDestroy {
  readonly vm$: Observable<{ state: 'loading' | 'ready' | 'not_found' | 'error'; training?: Training; error?: string }>;
  readonly slug$: Observable<string>;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private trainings: TrainingsService,
    private upload: UploadApiService,
    private seo: SeoService,
  ) {
    this.slug$ = this.route.paramMap.pipe(map((p) => p.get('slug') ?? ''));
    this.vm$ = this.slug$.pipe(
      switchMap((slug) =>
        this.trainings.getTrainingBySlug(slug).pipe(
          map((training) => {
            if (!training) return { state: 'not_found' as const };
            // Dynamic SEO (title/description/canonical/OG/JSON-LD)
            const baseUrl = getSiteBaseUrl();
            const canonicalPath = `/trainings/${training.slug}`;
            const desc =
              (training.tagline || training.description || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 180) || 'Détails de la formation Unlock.';
            this.seo.set({
              title: training.title,
              description: desc,
              canonicalPath,
              ogType: 'article',
              image: training.heroImage ? this.upload.getImageUrlFromPath(training.heroImage) : `${baseUrl}/assets/images/img/p1.jpg`,
              jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'Course',
                name: training.title,
                description: desc,
                provider: {
                  '@type': 'Organization',
                  name: 'Unlock Formation',
                  url: baseUrl,
                },
                url: `${baseUrl}${canonicalPath}`,
              },
            });
            return { state: 'ready' as const, training };
          }),
          catchError(() => of({ state: 'error' as const, error: 'Erreur lors du chargement de la formation' })),
          startWith({ state: 'loading' as const }),
        ),
      ),
      takeUntil(this.destroy$),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getNextSessionLabel(training?: Training): string {
    if (!training) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = (training.sessions || [])
      .map((s) => ({ start: new Date(s.startDate), raw: s }))
      .filter((s) => !Number.isNaN(s.start.getTime()) && s.start.getTime() >= today.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const next = sessions[0];
    if (!next) {
      // Si pas de session, retourner juste le texte de highlight sans préfixe
      return training.nextSessionHighlight || 'Date à venir';
    }

    // Format: "le [jour] [date] [mois] [année]" (ex: "le lundi 15 janvier 2025")
    const label = next.start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `le ${label}`;
  }

  getImageUrl(path?: string): string {
    if (!path) return '/assets/images/img/p1.jpg';
    return this.upload.getImageUrlFromPath(path);
  }

  downloadProgramPdf(training: Training): void {
    // Client-side "PDF": generate a print-optimized document and let the user "Save as PDF".
    // IMPORTANT: browsers do NOT allow silent direct PDF downloads without a PDF generator library.
    // To avoid opening an empty about:blank tab (popup blocked), we render into a hidden iframe.
    if (typeof window === 'undefined') return;

    const nextSessionLabel = this.getNextSessionLabel(training);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toAbsoluteUrl = (url: string): string => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      if (url.startsWith('/')) return `${origin}${url}`;
      return `${origin}/${url}`;
    };

    const heroImageUrl = toAbsoluteUrl(this.getImageUrl(training.heroImage));

    const escapeHtml = (s: string) =>
      String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const modulesHtml = (training.program || [])
      .map((m, i) => {
        const topics = (m.topics || [])
          .map((t) => `<li>${escapeHtml(t)}</li>`)
          .join('');
        return `
          <section class="module">
            <div class="module__head">
              <div class="module__k">Module ${i + 1}</div>
              <div class="module__t">${escapeHtml(m.title)}</div>
              <div class="module__h">~ ${Math.round(m.durationHours || 0)}h</div>
            </div>
            ${topics ? `<ul class="module__list">${topics}</ul>` : `<div class="muted">Contenu à venir</div>`}
          </section>
        `;
      })
      .join('');

    const list = (items?: string[]) =>
      (items || []).length
        ? `<ul class="list">${(items || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`
        : `<div class="muted">—</div>`;

    const formatDateShort = (d: Date) => {
      try {
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch {
        return d.toLocaleDateString('fr-FR');
      }
    };

    const futureSessions = (training.sessions || [])
      .map((s) => ({ s, start: new Date(s.startDate), end: new Date(s.endDate) }))
      .filter((x) => !Number.isNaN(x.start.getTime()) && x.start.getTime() >= today.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const sessionsHtml = futureSessions.length
      ? `
        <table class="table">
          <thead>
            <tr>
              <th>Dates</th>
              <th>Format</th>
              <th>Lieu</th>
              <th class="tr">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${futureSessions
              .slice(0, 8)
              .map(({ s, start, end }, idx) => {
                const isFirst = idx === 0;
                const dates = `${escapeHtml(formatDateShort(start))} → ${escapeHtml(formatDateShort(end))}`;
                const format = escapeHtml(String(s.format || '').toUpperCase());
                const location = escapeHtml(String(s.location || '—'));
                const price = s.priceExclTax ? `${Math.round(s.priceExclTax)} € HT` : '—';
                return `
                  <tr class="${isFirst ? 'is-next' : ''}">
                    <td>${dates}${isFirst ? ` <span class="pill">Prochaine</span>` : ''}</td>
                    <td>${format}</td>
                    <td>${location}</td>
                    <td class="tr">${escapeHtml(price)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
        ${futureSessions.length > 8 ? `<div class="muted">+ ${futureSessions.length - 8} autres sessions à venir.</div>` : ''}
      `
      : `<div class="muted">Aucune session planifiée pour le moment.</div>`;

    const fundingHtml =
      (training.fundingOptions || []).length > 0
        ? `<ul class="mini">${training.fundingOptions.map((f) => `<li>• ${escapeHtml(f)}</li>`).join('')}</ul>`
        : `<ul class="mini"><li>• Entreprise (OPCO) / plan de développement des compétences</li><li>• CPF ou dispositifs publics selon profil</li><li>• Paiement en plusieurs fois possible (sur étude)</li></ul>`;

    const links = {
      register: toAbsoluteUrl(`/trainings/${training.slug}/register`),
      trainings: toAbsoluteUrl('/trainings'),
      contact: toAbsoluteUrl('/contact'),
      orientation: toAbsoluteUrl('/orientation'),
    };

    const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(training.title)} — Programme (PDF)</title>
    <style>
      @page { size: A4; margin: 14mm; }
      :root{
        --fg:#0b1220;
        --muted:#556079;
        --line:#e6e9f2;
        --accent:#2f6bff;
        --card:#f7f8fc;
        --card2:#ffffff;
      }
      *{ box-sizing:border-box; }
      body{
        margin:0;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        color:var(--fg);
        line-height:1.35;
        background:white;
      }
      .wrap{ width:100%; }
      .cover{
        border:1px solid var(--line);
        background:linear-gradient(180deg, var(--card) 0%, var(--card2) 100%);
        border-radius:14px;
        padding:14px;
        margin-bottom:12px;
      }
      .top{
        display:grid;
        grid-template-columns: 1.25fr 0.75fr;
        gap:14px;
        align-items:start;
      }
      .brand{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        font-weight:850;
        letter-spacing:-0.02em;
        font-size:12px;
        color:var(--muted);
      }
      .logo{
        display:flex; align-items:center; gap:10px;
      }
      .dot{
        width:10px; height:10px; border-radius:999px;
        background:var(--accent);
        box-shadow:0 10px 30px rgba(47,107,255,0.35);
      }
      .h1{
        font-size:24px;
        margin:8px 0 6px;
        letter-spacing:-0.03em;
        line-height:1.12;
      }
      .tagline{ color:var(--muted); margin:0; font-size:13px; }
      .pill{
        display:inline-flex;
        align-items:center;
        padding:2px 8px;
        border-radius:999px;
        font-size:10px;
        border:1px solid var(--line);
        color:var(--muted);
        background:#fff;
        margin-left:6px;
        vertical-align:middle;
      }
      .img{
        border-radius:12px;
        overflow:hidden;
        border:1px solid var(--line);
        background:#fff;
      }
      .img img{
        width:100%;
        height:220px;
        object-fit:cover;
        display:block;
      }
      .watermark{
        margin-top:10px;
        color:var(--muted);
        font-size:11px;
        display:flex;
        align-items:center;
        gap:8px;
        justify-content:flex-end;
      }
      .watermark img{ height:18px; width:auto; opacity:0.85; }
      .meta{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap:10px;
        margin-top:12px;
      }
      .meta__item{
        background:#fff;
        border:1px solid var(--line);
        border-radius:12px;
        padding:10px 12px;
      }
      .meta__k{ font-size:11px; color:var(--muted); margin-bottom:4px; }
      .meta__v{ font-size:13px; font-weight:700; }
      .section{ margin:14px 0 0; break-inside:avoid; }
      .h2{
        font-size:14px;
        margin:0 0 8px;
        letter-spacing:-0.01em;
      }
      .line{ height:1px; background:var(--line); margin:12px 0; }
      .list, .module__list{ margin:0; padding-left:18px; }
      .list li, .module__list li{ margin:0 0 4px; }
      .muted{ color:var(--muted); font-size:12px; }
      .grid2{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap:12px;
      }
      .box{
        border:1px solid var(--line);
        border-radius:12px;
        padding:12px;
        background:#fff;
      }
      .box .h2{ margin-bottom:6px; }
      .mini{ margin:0; padding:0; list-style:none; color:var(--muted); font-size:12px; }
      .mini li{ margin:0 0 4px; }
      .table{
        width:100%;
        border-collapse:separate;
        border-spacing:0;
        border:1px solid var(--line);
        border-radius:12px;
        overflow:hidden;
        background:#fff;
        font-size:12px;
      }
      .table th, .table td{
        padding:10px 10px;
        border-bottom:1px solid var(--line);
        vertical-align:top;
      }
      .table th{
        text-align:left;
        background:var(--card);
        color:var(--muted);
        font-weight:750;
        font-size:11px;
      }
      .table tr:last-child td{ border-bottom:0; }
      .table .tr{ text-align:right; }
      .table tr.is-next td{ background:rgba(47,107,255,0.06); }
      .modules{ display:flex; flex-direction:column; gap:10px; }
      .module{
        border:1px solid var(--line);
        border-radius:12px;
        padding:12px;
        break-inside:avoid;
        background:#fff;
      }
      .module__head{
        display:grid;
        grid-template-columns:auto 1fr auto;
        gap:10px;
        align-items:baseline;
        margin-bottom:8px;
      }
      .module__k{ font-size:11px; color:var(--muted); }
      .module__t{ font-size:13px; font-weight:750; letter-spacing:-0.01em; }
      .module__h{ font-size:12px; color:var(--muted); }
      .footer{
        margin-top:14px;
        padding-top:12px;
        border-top:1px solid var(--line);
        display:flex;
        justify-content:space-between;
        gap:12px;
        color:var(--muted);
        font-size:11px;
      }
      .accent{ color:var(--accent); }
      a{ color:var(--accent); text-decoration:none; }
      .links{ display:flex; gap:10px; flex-wrap:wrap; }
      .link{
        display:inline-flex; align-items:center; gap:6px;
        padding:6px 10px;
        border:1px solid var(--line);
        border-radius:999px;
        font-size:11px;
        color:var(--fg);
        background:#fff;
      }
      /* Ensure colors print */
      @media print {
        body{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="cover">
        <div class="top">
          <div>
            <div class="brand">
              <div class="logo"><span class="dot"></span><span>UNLOCK • Programme de formation</span></div>
              <div>${escapeHtml(training.category || '')}</div>
            </div>
            <h1 class="h1">${escapeHtml(training.title)}</h1>
            <p class="tagline">${escapeHtml(training.tagline || '')}</p>

            <div class="meta">
              <div class="meta__item">
                <div class="meta__k">Niveau</div>
                <div class="meta__v">${escapeHtml(training.level || '')}</div>
              </div>
              <div class="meta__item">
                <div class="meta__k">Durée</div>
                <div class="meta__v">${escapeHtml(String(training.durationDays))} jours • ${escapeHtml(String(training.durationHours))} h</div>
              </div>
              <div class="meta__item">
                <div class="meta__k">Format</div>
                <div class="meta__v">${escapeHtml(training.format || '—')}</div>
              </div>
              <div class="meta__item">
                <div class="meta__k">Prochaine session</div>
                <div class="meta__v"><span class="accent">${escapeHtml(nextSessionLabel || 'Date à venir')}</span></div>
              </div>
            </div>

            <div class="section" style="margin-top:12px;">
              <div class="h2">Liens utiles</div>
              <div class="links">
                <a class="link" href="${escapeHtml(links.register)}">Inscription</a>
                <a class="link" href="${escapeHtml(links.contact)}">Contact</a>
                <a class="link" href="${escapeHtml(links.trainings)}">Toutes les formations</a>
                <a class="link" href="${escapeHtml(links.orientation)}">Test d’orientation</a>
              </div>
              <div class="muted" style="margin-top:6px;">Astuce: dans la fenêtre d’impression, choisir “Enregistrer en PDF”.</div>
            </div>
          </div>

            <div>
            <div class="img">
              <img src="${escapeHtml(heroImageUrl)}" alt="${escapeHtml(training.shortTitle || training.title)}" />
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="box">
          <div class="h2">Objectifs</div>
          ${list(training.objectives)}
        </div>
      </section>

      <div class="line"></div>

      <section class="section">
        <div class="box">
          <div class="h2">Public cible</div>
          ${list(training.targetAudience)}
        </div>
      </section>

      <section class="section">
        <div class="box">
          <div class="h2">Prérequis</div>
          ${list(training.prerequisites)}
        </div>
      </section>

      <section class="section">
        <div class="box">
          <div class="h2">À l’issue</div>
          ${list(training.outcomes)}
        </div>
      </section>

      <div class="line"></div>

      <section class="section">
        <div class="grid2">
          <div class="box">
            <div class="h2">Sessions à venir</div>
            ${sessionsHtml}
          </div>
          <div class="box">
            <div class="h2">Tarif & financement</div>
            <ul class="mini">
              <li><strong>${escapeHtml(String(training.priceFrom))} € HT</strong> / participant (indicatif)</li>
              <li>Formats: ${escapeHtml((training.locationTypes || []).join(' • ') || '—')}</li>
              <li>Pace: ${escapeHtml(training.pace || '—')}</li>
              ${training.trainingType ? `<li>Type: ${escapeHtml(training.trainingType)}</li>` : ''}
              ${training.audienceType ? `<li>Public: ${escapeHtml(training.audienceType)}</li>` : ''}
            </ul>
            <div class="line" style="margin:10px 0;"></div>
            <div class="h2">Financement</div>
            ${fundingHtml}
          </div>
        </div>
      </section>

      <div class="line"></div>

      <section class="section">
        <div class="h2">Programme détaillé</div>
        <div class="modules">
          ${modulesHtml || '<div class="muted">Programme à venir.</div>'}
        </div>
      </section>

      <footer class="footer">
        <div>Programme généré le ${escapeHtml(new Date().toLocaleDateString('fr-FR'))}</div>
        <div>${escapeHtml(links.trainings)}</div>
      </footer>
    </div>
    <script>
      // Auto-open print dialog once assets/styles are ready
      window.addEventListener('load', () => {
        setTimeout(() => window.print(), 120);
      });
    </script>
  </body>
</html>`;

    // Render into a hidden iframe to avoid popups and blank windows
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Cleanup after print
    const cleanup = () => {
      // some browsers fire afterprint on the iframe window
      try {
        iframe.contentWindow?.removeEventListener('afterprint', cleanup as any);
      } catch {}
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    // Trigger print once iframe is ready
    iframe.onload = () => {
      try {
        iframe.contentWindow?.addEventListener('afterprint', cleanup as any);
      } catch {}
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // fallback cleanup
        setTimeout(cleanup, 1500);
      }, 120);
    };
  }
}


