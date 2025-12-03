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

    const updateScroll = (progress: number) => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll > 0) {
        container.scrollLeft = progress * maxScroll;
      } else {
        container.scrollLeft = 0;
      }
    };

    this.scrollTriggerInstance?.kill();

    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => updateScroll(self.progress),
      onRefresh: (self) => updateScroll(self.progress),
      invalidateOnRefresh: true
    });
  }

  ngOnDestroy(): void {
    this.scrollTriggerInstance?.kill();
  }
}

