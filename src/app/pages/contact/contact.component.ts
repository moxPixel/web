import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatRippleModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  // Étape actuelle du stepper
  currentStep = 1;
  totalSteps = 4;

  // Données du formulaire
  contactType: 'particulier' | 'entreprise' | 'autre' = 'particulier';
  firstName = '';
  lastName = '';
  companyName = '';
  email = '';
  phone = '';
  requestType: 'formation' | 'devis' | 'information' | 'autre' = 'formation';
  subjectCategory: 'technique' | 'commercial' | 'pedagogique' | 'autre' = 'technique';
  message = '';
  consent = false;


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
    if (this.canGoToNextStep()) {
      // TODO: Implémenter la logique d'envoi du formulaire
      console.log('Contact form submitted:', {
        contactType: this.contactType,
        firstName: this.firstName,
        lastName: this.lastName,
        companyName: this.companyName,
        email: this.email,
        phone: this.phone,
        requestType: this.requestType,
        subjectCategory: this.subjectCategory,
        message: this.message,
        consent: this.consent
      });
    }
  }
}
