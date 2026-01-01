import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { ProgramsSectionComponent } from '../../components/home/programs-section/programs-section.component';
import { AboutSectionComponent } from '../../components/home/about-section/about-section.component';
import { LockyGamesSectionComponent } from '../../components/home/locky-games-section/locky-games-section.component';
import { EventsSectionComponent } from '../../components/home/events-section/events-section.component';
import { ApprenticeshipSectionComponent } from '../../components/home/apprenticeship-section/apprenticeship-section.component';
import { BusinessSolutionsSectionComponent } from '../../components/home/business-solutions-section/business-solutions-section.component';
import { ReviewsSectionComponent } from '../../components/home/reviews-section/reviews-section.component';
import { QualitySectionComponent } from '../../components/home/quality-section/quality-section.component';
import { PressSectionComponent } from '../../components/home/press-section/press-section.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroComponent,
    ProgramsSectionComponent,
    AboutSectionComponent,
    LockyGamesSectionComponent,
    EventsSectionComponent,
    ApprenticeshipSectionComponent,
    BusinessSolutionsSectionComponent,
    ReviewsSectionComponent,
    QualitySectionComponent,
    PressSectionComponent
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css'
})
export class HomePage {}


