import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';

@Component({
  selector: 'app-eva-help-button',
  standalone: true,
  imports: [CommonModule, RouterLink, TablerIconComponent],
  templateUrl: './eva-help-button.component.html',
  styleUrl: './eva-help-button.component.css'
})
export class EvaHelpButtonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('button', { static: false }) button!: ElementRef<HTMLElement>;
  
  private scrollListener?: () => void;
  private rafId: number | null = null;
  private isVisible = false;
  private loaderListener?: () => void;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    // Never show / animate while the page loader is still visible.
    // Wait for the same global signal as cookie-consent/notifications.
    if (!document.getElementById('page-loader')) {
      this.setupScrollAnimation();
      return;
    }

    this.loaderListener = () => this.setupScrollAnimation();
    window.addEventListener('app-loader-hidden', this.loaderListener as any, { once: true } as any);
  }

  ngOnDestroy(): void {
    if (this.scrollListener && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollListener);
    }
    if (this.loaderListener && typeof window !== 'undefined') {
      window.removeEventListener('app-loader-hidden', this.loaderListener as any);
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private setupScrollAnimation(): void {
    if (typeof window === 'undefined' || !this.button?.nativeElement) {
      setTimeout(() => this.setupScrollAnimation(), 100);
      return;
    }

    const btn = this.button.nativeElement;
    
    // État initial : caché
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(20px) scale(0.95)';
    btn.style.pointerEvents = 'none';

    // Vérifier la position au scroll
    this.scrollListener = () => {
      if (this.rafId !== null) return;
      
      this.rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const shouldBeVisible = scrollY > 100;

        if (shouldBeVisible !== this.isVisible) {
          this.isVisible = shouldBeVisible;
          
          if (shouldBeVisible) {
            btn.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0) scale(1)';
            btn.style.pointerEvents = 'auto';
          } else {
            btn.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px) scale(0.95)';
            btn.style.pointerEvents = 'none';
          }
        }
        
        this.rafId = null;
      });
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
    
    // Vérifier l'état initial
    this.scrollListener();
  }
}

