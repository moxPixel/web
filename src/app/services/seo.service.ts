import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  author?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  schema?: any; // JSON-LD structured data
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly defaultSiteName = 'Unlock Formation';
  private readonly defaultImage = '/assets/images/logo/main-logo.png';
  readonly baseUrl = 'https://www.unlock-technologies.fr';

  constructor() {
    // Écouter les changements de route pour mettre à jour les meta tags
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Les meta tags seront mis à jour par chaque composant via updateSeoData
      });
  }

  /**
   * Met à jour toutes les balises SEO pour la page courante
   */
  updateSeoData(data: SeoData): void {
    const url = data.url || this.router.url;
    const fullUrl = `${this.baseUrl}${url}`;
    const imageUrl = data.image ? (data.image.startsWith('http') ? data.image : `${this.baseUrl}${data.image}`) : `${this.baseUrl}${this.defaultImage}`;

    // Title
    const title = data.title ? `${data.title} | ${this.defaultSiteName}` : this.defaultSiteName;
    this.titleService.setTitle(title);

    // Meta Description
    this.updateMetaTag('description', data.description);

    // Meta Keywords (optionnel mais utile pour certains moteurs)
    if (data.keywords) {
      this.updateMetaTag('keywords', data.keywords);
    }

    // Canonical URL
    const canonicalUrl = data.canonical || fullUrl;
    this.updateCanonical(canonicalUrl);

    // Robots
    if (data.noindex || data.nofollow) {
      const robotsContent = [
        data.noindex ? 'noindex' : 'index',
        data.nofollow ? 'nofollow' : 'follow'
      ].join(', ');
      this.updateMetaTag('robots', robotsContent);
    } else {
      this.updateMetaTag('robots', 'index, follow');
    }

    // Open Graph Tags
    this.updateMetaTag('og:title', title);
    this.updateMetaTag('og:description', data.description);
    this.updateMetaTag('og:image', imageUrl);
    this.updateMetaTag('og:url', fullUrl);
    this.updateMetaTag('og:type', data.type || 'website');
    this.updateMetaTag('og:site_name', data.siteName || this.defaultSiteName);
    this.updateMetaTag('og:locale', 'fr_FR');

    // Twitter Card Tags
    this.updateMetaTag('twitter:card', 'summary_large_image');
    this.updateMetaTag('twitter:title', title);
    this.updateMetaTag('twitter:description', data.description);
    this.updateMetaTag('twitter:image', imageUrl);

    // Author
    if (data.author) {
      this.updateMetaTag('author', data.author);
    }

    // Schema.org JSON-LD
    if (data.schema) {
      this.updateSchema(data.schema);
    }
  }

  /**
   * Met à jour une balise meta spécifique
   */
  private updateMetaTag(property: string, content: string): void {
    // Vérifier si c'est une propriété Open Graph ou Twitter
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      this.metaService.updateTag({ property, content });
    } else {
      // Meta tag standard
      this.metaService.updateTag({ name: property, content });
    }
  }

  /**
   * Met à jour la balise canonical
   */
  private updateCanonical(url: string): void {
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    
    link.setAttribute('href', url);
  }

  /**
   * Met à jour les données structurées Schema.org (JSON-LD)
   */
  private updateSchema(schema: any): void {
    // Supprimer tous les anciens scripts JSON-LD
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Si c'est un objet avec @graph, créer un script pour chaque élément
    if (schema['@graph'] && Array.isArray(schema['@graph'])) {
      schema['@graph'].forEach((item: any) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(item);
        document.head.appendChild(script);
      });
    } else {
      // Créer le nouveau script JSON-LD
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }

  /**
   * Génère les données Schema.org pour une organisation
   */
  generateOrganizationSchema(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Unlock Formation',
      description: 'Centre de formation expert en IT, IA, cybersécurité, développement, cloud et data. Formations certifiantes, alternance et reconversion.',
      url: this.baseUrl,
      logo: `${this.baseUrl}/assets/images/logo/main-logo.png`,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'FR'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Service client',
        availableLanguage: 'French'
      },
      sameAs: [
        // Ajouter les réseaux sociaux si disponibles
      ]
    };
  }

  /**
   * Génère les données Schema.org pour une formation
   */
  generateCourseSchema(courseData: {
    name: string;
    description: string;
    provider: string;
    url: string;
    image?: string;
    category?: string;
    level?: string;
    durationHours?: number;
    durationDays?: number;
    priceFrom?: number;
  }): any {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: courseData.name,
      description: courseData.description,
      provider: {
        '@type': 'Organization',
        name: courseData.provider,
        url: this.baseUrl,
        logo: `${this.baseUrl}/assets/images/logo/main-logo.png`,
        sameAs: this.baseUrl
      },
      url: courseData.url,
      image: courseData.image || `${this.baseUrl}/assets/images/logo/main-logo.png`,
      inLanguage: 'fr-FR',
      courseCode: courseData.name.toLowerCase().replace(/\s+/g, '-'),
      educationalCredentialAwarded: 'Certificat de formation',
      teaches: courseData.description,
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student'
      }
    };

    if (courseData.category) {
      schema.about = {
        '@type': 'Thing',
        name: courseData.category
      };
    }

    if (courseData.level) {
      schema.educationalLevel = courseData.level;
    }

    if (courseData.durationHours) {
      schema.timeRequired = `PT${courseData.durationHours}H`;
    }

    if (courseData.priceFrom) {
      schema.offers = {
        '@type': 'Offer',
        price: courseData.priceFrom,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: courseData.url
      };
    }

    return schema;
  }

  /**
   * Génère les données Schema.org pour un BreadcrumbList
   */
  generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`
      }))
    };
  }

  /**
   * Génère les données Schema.org pour une page FAQ
   */
  generateFAQSchema(faqItems: Array<{ question: string; answer: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    };
  }
}
