import { Component, inject, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { ContactsApiService } from '../../services/api/contacts-api.service';
import { NotificationService } from '../../services/notification.service';
import { SeoService } from '../../services/seo.service';
import {
  ContactType,
  RequestType,
  SubjectCategory,
  CreateContactDto,
} from '../../interfaces/contact.interface';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('contactParallax', { static: false }) contactParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();

  private contactsService = inject(ContactsApiService);
  private notify = inject(NotificationService);
  private gsapScroll = inject(GsapScrollService);
  private pageLoaderInline = inject(PageLoaderInlineService);
  private readonly seoService = inject(SeoService);

  // Étape actuelle du stepper
  currentStep = 1;
  totalSteps = 4;
  submitting = false;
  submitted = false;
  error = '';

  // Données du formulaire
  contactType: ContactType = ContactType.PARTICULIER;
  firstName = '';
  lastName = '';
  companyName = '';
  email = '';
  phone = '';
  requestType: RequestType = RequestType.FORMATION;
  subjectCategory: SubjectCategory = SubjectCategory.TECHNIQUE;
  message = '';
  consent = false;

  ngOnInit(): void {
    const breadcrumbSchema = this.seoService.generateBreadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'Contact', url: '/contact' }
    ]);

    // Configuration SEO pour la page Contact
    this.seoService.updateSeoData({
      title: 'Contactez-nous | Unlock Formation',
      description: 'Contactez Unlock Formation pour vos questions sur nos formations IT & IA, alternance, reconversion ou projets entreprises. Échangez avec nos conseillers experts. Réponse sous 24h.',
      keywords: 'contact unlock formation, devis formation, conseil formation IT, demande information formation, contact entreprise formation',
      image: '/assets/images/logo/main-logo.png',
      url: '/contact',
      type: 'website',
      schema: breadcrumbSchema
    });
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canGoToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.contactType !== null;
      case 2:
        if (this.contactType === 'entreprise') {
          return !!this.companyName && !!this.email;
        }
        return !!this.firstName && !!this.lastName && !!this.email;
      case 3:
        return !!this.requestType && !!this.subjectCategory;
      case 4:
        return !!this.message && this.consent;
      default:
        return false;
    }
  }

  onSubmit(): void {
    if (!this.canGoToNextStep() || this.submitting) {
      return;
    }

    this.submitting = true;
    this.error = '';

    const data: CreateContactDto = {
      contactType: this.contactType,
      firstName: this.firstName || undefined,
      lastName: this.lastName || undefined,
      companyName: this.companyName || undefined,
      email: this.email,
      phone: this.phone || undefined,
      requestType: this.requestType,
      subjectCategory: this.subjectCategory,
      message: this.message,
      consent: this.consent,
    };

    this.contactsService.create(data).subscribe({
      next: () => {
        this.submitted = true;
        this.submitting = false;
        this.notify.success('Message envoyé', 'Votre demande a été envoyée.');
        // Réinitialiser le formulaire après succès
        setTimeout(() => {
          this.resetForm();
        }, 3000);
      },
      error: (error) => {
        console.error('Error submitting contact form:', error);
        this.error = error.message || 'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.';
        this.notify.error('Erreur', this.error);
        this.submitting = false;
      },
    });
  }

  resetForm(): void {
    this.currentStep = 1;
    this.contactType = ContactType.PARTICULIER;
    this.firstName = '';
    this.lastName = '';
    this.companyName = '';
    this.email = '';
    this.phone = '';
    this.requestType = RequestType.FORMATION;
    this.subjectCategory = SubjectCategory.TECHNIQUE;
    this.message = '';
    this.consent = false;
    this.submitted = false;
    this.error = '';
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.contactParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.contactParallax.nativeElement,
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
