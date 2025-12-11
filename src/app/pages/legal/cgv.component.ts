import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-cgv',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="pt-24 pb-16 bg-background-1 dark:bg-background-8">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 space-y-10">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Légal</p>
          <h1 class="text-3xl sm:text-4xl font-bold text-secondary dark:text-accent">Conditions générales de vente</h1>
          <p class="text-secondary/70 dark:text-accent/70">Retrouvez les conditions générales de vente d'Unlock Formation.</p>
        </div>

        <div class="bg-white/80 dark:bg-background-8/80 border border-stroke-2 dark:border-stroke-6 rounded-2xl shadow-sm p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-secondary dark:text-accent">
          <p class="text-secondary dark:text-accent">
            Les conditions générales de vente sont disponibles en consultation dans le document PDF officiel.
          </p>
          <a
            href="/assets/files/CGV-Unlock-Formation.pdf"
            target="_blank"
            rel="noopener"
            class="btn btn-lg btn-outline w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <span class="leading-none">Télécharger les CGV</span>
          </a>
        </div>
      </div>
    </section>
  `,
})
export class CgvComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateSeoData({
      title: 'CGV - Conditions Générales de Vente | Unlock Formation',
      description: 'Conditions générales de vente Unlock Formation. Tarifs, modalités de paiement, annulation et remboursement des formations.',
      keywords: 'CGV unlock formation, conditions générales vente, tarifs formations, modalités paiement',
      url: '/cgv',
      noindex: true, // Pages légales généralement non indexées
      type: 'website'
    });
  }
}

