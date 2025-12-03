import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { AboutComponent } from '../../components/about/about.component';
import { ProgramsSectionComponent } from '../../components/home/programs-section/programs-section.component';
import { ApprenticeshipSectionComponent } from '../../components/home/apprenticeship-section/apprenticeship-section.component';
import { BusinessSolutionsSectionComponent } from '../../components/home/business-solutions-section/business-solutions-section.component';
import { KeyBenefitsSectionComponent } from '../../components/home/key-benefits-section/key-benefits-section.component';
import { TestimonialsSectionComponent } from '../../components/home/testimonials-section/testimonials-section.component';
import { EnrollmentStepsSectionComponent } from '../../components/home/enrollment-steps-section/enrollment-steps-section.component';
import { BlogPreviewSectionComponent } from '../../components/home/blog-preview-section/blog-preview-section.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
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
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}

