import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TablerIconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly columns: Array<{
    title: string;
    links: Array<{ label: string; routerLink?: string; href?: string }>;
  }> = [
    {
      title: 'Formations',
      links: [
        { label: 'Catalogue des formations', routerLink: '/trainings' },
        { label: 'Parler à un conseiller', routerLink: '/contact' }
      ]
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', routerLink: '/about' },
        { label: 'Notre approche', routerLink: '/approche' },
        { label: 'Recrutement', routerLink: '/recrutement' },
        { label: "Besoin d'expert", href: 'https://odyssee.life/' },
        { label: 'Contact', routerLink: '/contact' }
      ]
    },
    {
      title: 'Espace',
      links: [
        { label: 'Se connecter', routerLink: '/login' },
        { label: 'Nous écrire', href: 'mailto:contact@unlock-formation.fr' },
        { label: 'Appeler', href: 'tel:+33100000000' }
      ]
    },
    {
      title: 'Légal & support',
      links: [
        { label: 'CGU', routerLink: '/cgu' },
        { label: 'CGV', routerLink: '/cgv' },
        { label: 'FAQ', routerLink: '/faq' }
      ]
    }
  ];
}


