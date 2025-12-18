import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { AboutComponent } from '../../components/about/about.component';
import { ProgramsSectionComponent } from '../../components/home/programs-section/programs-section.component';
import { ApprenticeshipSectionComponent } from '../../components/home/apprenticeship-section/apprenticeship-section.component';
import { BusinessSolutionsSectionComponent } from '../../components/home/business-solutions-section/business-solutions-section.component';
import { KeyBenefitsSectionComponent } from '../../components/home/key-benefits-section/key-benefits-section.component';
import { TestimonialsSectionComponent } from '../../components/home/testimonials-section/testimonials-section.component';
import { EnrollmentStepsSectionComponent } from '../../components/home/enrollment-steps-section/enrollment-steps-section.component';
import { BlogPreviewSectionComponent } from '../../components/home/blog-preview-section/blog-preview-section.component';
import { ReviewsSectionComponent } from '../../components/home/reviews-section/reviews-section.component';
import { QualitySectionComponent } from '../../components/home/quality-section/quality-section.component';
import { PressSectionComponent } from '../../components/home/press-section/press-section.component';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroComponent,
    AboutComponent,
    ProgramsSectionComponent,
    ApprenticeshipSectionComponent,
    BusinessSolutionsSectionComponent,
    KeyBenefitsSectionComponent,
    TestimonialsSectionComponent,
    EnrollmentStepsSectionComponent,
    BlogPreviewSectionComponent,
    ReviewsSectionComponent,
    QualitySectionComponent,
    PressSectionComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    // Configuration SEO pour la page d'accueil
    this.seoService.updateSeoData({
      title: 'Formations IT & IA par des experts | Unlock Formation',
      description: 'Unlock Formation : centre expert en formations IT & IA. Formations certifiantes en développement web, cybersécurité, data science, cloud et DevOps. Alternance et reconversion professionnelle. Experts reconnus et assistant IA EVA.',
      keywords: 'formation IT, formation IA, formation cybersécurité, formation développement web, formation data science, formation cloud, alternance IT, reconversion IT, formation professionnelle, certification IT',
      image: '/assets/images/logo/main-logo.png',
      url: '/',
      type: 'website',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${this.seoService.baseUrl}/#webpage`,
        url: `${this.seoService.baseUrl}/`,
        name: 'Unlock Formation - Formations IT & IA',
        description: 'Centre expert en formations IT & IA. Formations certifiantes en développement web, cybersécurité, data science, cloud et DevOps.',
        inLanguage: 'fr-FR',
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${this.seoService.baseUrl}/#website`,
          url: this.seoService.baseUrl,
          name: 'Unlock Formation'
        },
        breadcrumb: {
          '@id': `${this.seoService.baseUrl}/#breadcrumb`
        },
        mainEntity: {
          '@type': 'EducationalOrganization',
          name: 'Unlock Formation',
          description: 'Centre de formation expert en IT, IA, cybersécurité, développement, cloud et data.'
        }
      }
    });
  }
}

