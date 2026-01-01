import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';

import { CreateContactDto, ContactType, RequestType, SubjectCategory } from '../../interfaces/contact.interface';
import { ContactsApiService } from '../../services/api/contacts-api.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TablerIconComponent, UiButtonDirective, UiCardDirective, UiInputDirective],
  templateUrl: './contact.page.html',
  styleUrl: './contact.page.css'
})
export class ContactPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ContactsApiService);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  step = 1;
  readonly totalSteps = 4;

  submitting = false;
  submitted = false;

  readonly contactTypes = [
    { value: ContactType.PARTICULIER, label: 'Particulier', desc: 'Projet perso / reconversion', icon: 'user' as const },
    { value: ContactType.ENTREPRISE, label: 'Entreprise', desc: 'Équipe / montée en compétences', icon: 'building' as const },
    { value: ContactType.AUTRE, label: 'Autre', desc: 'Partenariat / média / divers', icon: 'sparkles' as const },
  ];

  readonly requestTypes = [
    { value: RequestType.FORMATION, label: 'Demande de formation' },
    { value: RequestType.DEVIS, label: 'Demande de devis' },
    { value: RequestType.INFORMATION, label: "Demande d'information" },
    { value: RequestType.AUTRE, label: 'Autre' },
  ];

  readonly subjectCategories = [
    { value: SubjectCategory.TECHNIQUE, label: 'Question technique' },
    { value: SubjectCategory.COMMERCIAL, label: 'Question commerciale' },
    { value: SubjectCategory.PEDAGOGIQUE, label: 'Question pédagogique' },
    { value: SubjectCategory.AUTRE, label: 'Autre' },
  ];

  readonly form = this.fb.group({
    contactType: [ContactType.PARTICULIER as ContactType, Validators.required],
    firstName: [''],
    lastName: [''],
    companyName: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    requestType: [RequestType.FORMATION as RequestType, Validators.required],
    subjectCategory: [SubjectCategory.TECHNIQUE as SubjectCategory, Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
    consent: [false, Validators.requiredTrue],
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  previousStep(): void {
    this.step = Math.max(1, this.step - 1);
  }

  nextStep(): void {
    if (!this.canGoNext()) {
      this.form.markAllAsTouched();
      this.notifications.warning('Informations incomplètes', 'Veuillez compléter les champs requis avant de continuer.');
      return;
    }
    this.step = Math.min(this.totalSteps, this.step + 1);
  }

  canGoNext(): boolean {
    const v = this.form.value;
    if (this.step === 1) return !!v.contactType;

    if (this.step === 2) {
      const emailOk = !!v.email && this.form.get('email')?.valid;
      if (!emailOk) return false;
      if (v.contactType === ContactType.ENTREPRISE) return !!v.companyName;
      return !!v.firstName && !!v.lastName;
    }

    if (this.step === 3) return !!v.requestType && !!v.subjectCategory;

    if (this.step === 4) return !!v.message && !!v.consent && !!this.form.get('message')?.valid;

    return false;
  }

  onSubmit(): void {
    if (this.submitting || this.submitted) return;
    if (!this.canGoNext()) {
      this.form.markAllAsTouched();
      this.notifications.warning('Formulaire incomplet', 'Veuillez compléter les champs requis avant l’envoi.');
      return;
    }

    const v = this.form.value;
    const payload: CreateContactDto = {
      contactType: v.contactType!,
      firstName: v.firstName || undefined,
      lastName: v.lastName || undefined,
      companyName: v.companyName || undefined,
      email: v.email!,
      phone: v.phone || undefined,
      requestType: v.requestType!,
      subjectCategory: v.subjectCategory!,
      message: v.message!,
      consent: !!v.consent,
    };

    this.submitting = true;

    this.api.create(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.notifications.success('Message envoyé', 'Merci — on revient vers vous très vite.');
        // reset after a short delay, like web
        window.setTimeout(() => this.reset(), 2500);
      },
      error: (err: Error) => {
        this.submitting = false;
        this.notifications.error('Envoi impossible', err.message || "Une erreur est survenue lors de l'envoi.");
      },
    });
  }

  reset(): void {
    this.step = 1;
    this.submitted = false;
    this.submitting = false;
    this.form.reset({
      contactType: ContactType.PARTICULIER,
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      requestType: RequestType.FORMATION,
      subjectCategory: SubjectCategory.TECHNIQUE,
      message: '',
      consent: false,
    });
  }
}


