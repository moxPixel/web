import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-cgu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="pt-24 pb-16 bg-background-1 dark:bg-background-8">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 space-y-10">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">Légal</p>
          <h1 class="text-3xl sm:text-4xl font-bold text-secondary dark:text-accent">Conditions générales d’utilisation</h1>
          <p class="text-secondary/70 dark:text-accent/70">Retrouvez ici les conditions générales d'utilisation UNLOCK.</p>
        </div>

        <div class="bg-white/80 dark:bg-background-8/80 border border-stroke-2 dark:border-stroke-6 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-secondary dark:text-accent">
          <p>
            Ce site web est édité par : <strong>UNLOCK FORMATION</strong> Société à responsabilité limitée (SAS) au capital de 500 € - RCS Versailles B 911 877 520
            Code APE : 8559A SIRET : 91187752000013 N° de TVA intracommunautaire : FR63911877520
            <br><br>
            Siège social : 4 villa henri jeanson 78600 Maisons-laffitte Tél. : +33 (0)7 67 51 59 55
            Secteurs d’activités : Établissement d'enseignement supérieur technique privé | Formation continue |
            Formation initiale | Formation en alternance
            Hébergeur : IONOS
          </p>

          <p>
            <strong>Protection des données personnelles</strong><br>
            En conformité avec les dispositions de la loi du 6 janvier 1978 relative à l'informatique, aux fichiers et
            aux libertés, le traitement automatisé des données nominatives réalisé à partir de ce site web fait l'objet
            d'une déclaration auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) sous le numéro
            1056729. Les informations nominatives concernant l'utilisateur sont à usage interne de la société
            <strong>UNLOCK</strong>. En aucun cas, la société <strong>UNLOCK</strong> ne les divulguera à des tiers à des fins de publicité ou de
            promotion. L'utilisateur est toutefois informé que, conformément à l'article 27 de la loi Informatique et Libertés du 6 janvier 1978,
            les réponses données aux formulaires présents sur le site pourront être exploitées par la société
            <strong>UNLOCK</strong>, et qu'il dispose d'un droit d'accès et de rectification portant sur ces données en écrivant à :
            <strong>UNLOCK FORMATION</strong>, 4 villa henri jeanson, 78600 Maisons-laffitte ou par email : <strong>contact@unlock-technologies.fr</strong>
          </p>

          <p>
            <strong>Droit d’auteur</strong><br>
            Les données publiées et les marques citées sur le site unlock-formation.fr sont la propriété exclusive de leurs titulaires respectifs.
            Toute reproduction totale ou partielle de ces textes, marques et/ou logos, effectuée à partir des éléments du site sans l'autorisation
            expresse de leurs propriétaires est prohibée (article L. 713-2 du Code de la propriété intellectuelle).
          </p>

          <p>
            <strong>Crédits photos et vidéos</strong><br>
            Les photos et vidéos publiées sur le site sont la propriété exclusive de leurs auteurs (banques d'images ou <strong>UNLOCK</strong>).
            Toute reproduction totale ou partielle, effectuée à partir des éléments du site sans autorisation expresse des propriétaires est prohibée
            (article L. 713-2 du Code de la propriété intellectuelle).
          </p>

          <p>
            <strong>Décharge de responsabilité</strong><br>
            Certaines informations et données disponibles sur le site unlock-formation.fr sont produites par des tiers : la société <strong>UNLOCK</strong> s'engage
            à faire ses meilleurs efforts pour en garantir un caractère fiable, pertinent, exact et exhaustif, mais ne saurait être tenue pour responsable
            des erreurs, d'une absence de disponibilité des informations et/ou de la présence de virus sur son site. Le contenu des pages du site est
            présenté à titre informatif et ne constitue pas une offre de vente. <strong>UNLOCK</strong> et les tiers impliqués dans la création de ce site ne
            donnent aucune garantie et n'assument aucune responsabilité relative à l'utilisation de la présente publication en ligne.
          </p>

          <p>
            <strong>Politique des cookies</strong><br>
            Comme de nombreux sites Internet, nous pouvons créer des cookies sur votre ordinateur et y accéder. Le site unlock-formation.fr utilise Google Analytics
            pour mesurer et mieux connaître l'audience du site (fréquence, parcours, pages vues, sources des visites, navigateur utilisé…), afin d'améliorer
            l'expérience utilisateur.
          </p>

          <p>
            <strong>Conditions d'Utilisation du Site</strong><br>
            Consultez les conditions sur la protection des données personnelles et politiques de confidentialités à partir du 25 mai 2018.
          </p>
        </div>
      </div>
    </section>
  `,
})
export class CguComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    const breadcrumbSchema = this.seoService.generateBreadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'CGU', url: '/cgu' }
    ]);

    this.seoService.updateSeoData({
      title: 'CGU - Conditions Générales d\'Utilisation | Unlock Formation',
      description: 'Conditions générales d\'utilisation du site Unlock Formation. Mentions légales, protection des données personnelles, droits d\'auteur et politique cookies. Consultation libre et gratuite.',
      keywords: 'CGU unlock formation, mentions légales, conditions utilisation, protection données, RGPD',
      url: '/cgu',
      schema: breadcrumbSchema,
      noindex: true, // Pages légales généralement non indexées
      type: 'website'
    });
  }
}

