import { Component, HostListener, OnDestroy, Inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { GsapAnimationService } from '../../services/gsap-animation.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { gsap } from 'gsap';

@Component({
  selector: 'app-header-backoffice',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatRippleModule, MatIconModule],
  templateUrl: './header-backoffice.component.html',
  styleUrl: './header-backoffice.component.css'
})
export class HeaderBackofficeComponent implements OnDestroy, AfterViewInit {
  isMobileMenuOpen = false;
  isDarkMode = false;
  @ViewChild('headerContainer', { static: false }) headerContainer!: ElementRef;
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private gsapAnimation: GsapAnimationService,
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService
  ) {
    this.checkDarkMode();
  }

  ngAfterViewInit() {
    if (!this.headerContainer) {
      return;
    }

    if (this.headerContainer?.nativeElement) {
      gsap.set(this.headerContainer.nativeElement, {
        opacity: 0,
        y: -60,
        xPercent: -50,
        force3D: true
      });
    }

    this.pageLoaderInline.loaderHidden$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isHidden) => {
      if (isHidden) {
        setTimeout(() => {
          gsap.to(this.headerContainer.nativeElement, {
            opacity: 1,
            y: 0,
            xPercent: -50,
            duration: 0.9,
            ease: 'power3.out',
            delay: 0.05,
            force3D: true
          });

          setTimeout(() => {
            this.gsapScroll.initHeaderScroll(
              this.headerContainer.nativeElement,
              () => this.isDarkMode
            );
          }, 500);
        }, 50);
      }
    });
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
    if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
      this.closeMobileMenu();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    if (!this.document?.documentElement || !this.document?.body) {
      setTimeout(() => this.checkDarkMode(), 0);
      return;
    }

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

