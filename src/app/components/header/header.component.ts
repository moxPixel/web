import { Component, HostListener, OnDestroy, Inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { GsapAnimationService } from '../../services/gsap-animation.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatRippleModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnDestroy, AfterViewInit {
  isMobileMenuOpen = false;
  isDarkMode = false;
  @ViewChild('headerContainer', { static: false }) headerContainer!: ElementRef;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private gsapAnimation: GsapAnimationService,
    private gsapScroll: GsapScrollService
  ) {
    // Vérifier le thème au chargement
    this.checkDarkMode();
  }

  ngAfterViewInit() {
    if (!this.headerContainer) {
      return;
    }

    this.gsapAnimation.fadeUp(this.headerContainer.nativeElement, {
      duration: 0.9,
      y: -60,
      ease: 'power3.out',
      delay: 0.05
    });

    // Initialiser l'animation du header au scroll
    setTimeout(() => {
      this.gsapScroll.initHeaderScroll(
        this.headerContainer.nativeElement,
        () => this.isDarkMode
      );
    }, 500);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.updateBodyOverflow();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.updateBodyOverflow();
  }

  private updateBodyOverflow() {
    if (this.isMobileMenuOpen) {
      this.document.body.classList.add('overflow-hidden');
    } else {
      this.document.body.classList.remove('overflow-hidden');
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined' && window.innerWidth >= 1280) { // xl breakpoint
      this.closeMobileMenu();
    }
  }

  ngOnDestroy() {
    if (this.document?.body) {
      this.document.body.classList.remove('overflow-hidden');
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (!this.document?.documentElement || !this.document?.body) return;

    if (this.isDarkMode) {
      this.document.documentElement.classList.add('dark');
      this.document.documentElement.style.backgroundColor = '#070b10';
      this.document.body.style.backgroundColor = '#070b10';
      localStorage.setItem('theme', 'dark');
    } else {
      this.document.documentElement.classList.remove('dark');
      this.document.documentElement.style.backgroundColor = '#ffffff';
      this.document.body.style.backgroundColor = '#ffffff';
      localStorage.setItem('theme', 'light');
    }
  }

  private checkDarkMode() {
    // Vérifier que le document est disponible
    if (!this.document?.documentElement || !this.document?.body) {
      // Si le document n'est pas encore disponible, réessayer après un court délai
      setTimeout(() => this.checkDarkMode(), 0);
      return;
    }

    // Vérifier le localStorage ou la préférence système
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.isDarkMode = true;
      this.document.documentElement.classList.add('dark');
      this.document.documentElement.style.backgroundColor = '#070b10';
      this.document.body.style.backgroundColor = '#070b10';
    } else {
      this.isDarkMode = false;
      this.document.documentElement.classList.remove('dark');
      this.document.documentElement.style.backgroundColor = '#ffffff';
      this.document.body.style.backgroundColor = '#ffffff';
    }
  }
}

