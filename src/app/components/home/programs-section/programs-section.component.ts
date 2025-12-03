import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-programs-section',
  standalone: true,
  imports: [CommonModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './programs-section.component.html',
  styleUrl: './programs-section.component.css'
})
export class ProgramsSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('carouselWrapper', { static: false }) carouselWrapper?: ElementRef<HTMLElement>;
  @ViewChild('carouselContainer', { static: false }) carouselContainer?: ElementRef<HTMLElement>;

  private scrollTriggerInstance?: ScrollTrigger;
  private cachedMaxScroll = 0; // Cache pour éviter les recalculs coûteux

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.waitForImages();
    });
  }

  private waitForImages(): void {
    const container = this.carouselContainer?.nativeElement;
    if (!container) {
      return;
    }

    const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    if (images.length === 0) {
      this.initScrollAnimation();
      return;
    }

    let loaded = 0;
    const total = images.length;

    const onDone = () => {
      loaded += 1;
      if (loaded === total) {
        this.initScrollAnimation();
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        onDone();
      } else {
        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
            }
          });
        }

  private initScrollAnimation(): void {
    const wrapper = this.carouselWrapper?.nativeElement;
    const container = this.carouselContainer?.nativeElement;

    if (!wrapper || !container) {
      return;
    }

    // Calculer maxScroll une seule fois et le mettre en cache
    const calculateMaxScroll = () => {
      this.cachedMaxScroll = container.scrollWidth - container.clientWidth;
      return this.cachedMaxScroll;
    };

    // Initialiser le cache
    calculateMaxScroll();

    const updateScroll = (progress: number) => {
      // Utiliser le cache au lieu de recalculer à chaque frame
      if (this.cachedMaxScroll > 0) {
        container.scrollLeft = progress * this.cachedMaxScroll;
      } else {
        container.scrollLeft = 0;
      }
    };

    this.scrollTriggerInstance?.kill();

    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.5, // Valeur réduite pour plus de fluidité
      // Pré-calculer immédiatement pour éviter les saccades au premier scroll
      immediateRender: true,
      onUpdate: (self) => updateScroll(self.progress),
      onRefresh: () => {
        // Recalculer le cache uniquement lors du refresh
        calculateMaxScroll();
      },
      invalidateOnRefresh: false, // Désactivé pour éviter les recalculs fréquents
      refreshPriority: -1 // Priorité basse pour éviter les conflits
    });
  }

  ngOnDestroy(): void {
    this.scrollTriggerInstance?.kill();
  }
}

