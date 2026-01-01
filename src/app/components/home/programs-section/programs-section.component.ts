import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TablerIconComponent } from '../../../shared/icons/tabler-icon/tabler-icon.component';

type Slide = {
  title: string;
  alt: string;
  img: string;
  link: string;
};

@Component({
  selector: 'app-programs-section',
  standalone: true,
  imports: [CommonModule, RouterLink, TablerIconComponent],
  templateUrl: './programs-section.component.html',
  styleUrl: './programs-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramsSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('parallax', { static: true }) parallaxEl!: ElementRef<HTMLElement>;
  @ViewChild('stepsContainer', { static: false }) stepsContainer!: ElementRef<HTMLElement>;

  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private raf: number | null = null;
  private active = false;
  private currentY = 0;
  private targetY = 0;
  private currentScale = 1;
  private targetScale = 1;
  private readonly destroy$ = new Subject<void>();

  // Premium parallax config (subtle & elegant section-to-section effect)
  private readonly ENTER_OFFSET = 80; // px when entering viewport (refined depth)
  private readonly EXIT_OFFSET = -50; // px when leaving viewport (elegant)
  private readonly LERP_SPEED = 0.07; // Ultra-smooth and fluid

  readonly slides: Slide[] = [
    {
      title: 'Intelligence Artificielle',
      alt: 'Formation Intelligence Artificielle',
      img: '/assets/images/img/p1.jpg',
      link: '/trainings'
    },
    {
      title: 'Cybersécurité',
      alt: 'Formation Cybersécurité',
      img: '/assets/images/img/p2.jpg',
      link: '/trainings'
    },
    {
      title: 'Data Science',
      alt: 'Formation Data Science',
      img: '/assets/images/img/p7.jpg',
      link: '/trainings'
    },
    {
      title: 'Cloud & DevOps',
      alt: 'Formation Cloud & DevOps',
      img: '/assets/images/img/p10.jpg',
      link: '/trainings'
    },
    {
      title: 'Blockchain & Web3',
      alt: 'Formation Blockchain & Web3',
      img: '/assets/images/img/p18.jpg',
      link: '/trainings'
    },
    {
      title: 'Architecture Logicielle',
      alt: 'Formation Architecture Logicielle',
      img: '/assets/images/img/p6.jpg',
      link: '/trainings'
    }
  ];

  trackByIndex(index: number): number {
    return index;
  }

  ngAfterViewInit(): void {
    const el = this.parallaxEl?.nativeElement;
    if (!el || typeof window === 'undefined') return;

    // Start from clean state
    el.style.transform = '';
    el.style.willChange = 'transform';

    const onScroll = () => {
      if (!this.active) return;
      if (this.raf !== null) return;
      this.raf = requestAnimationFrame(() => {
        this.raf = null;
        this.updateParallax();
      });
    };
    (this as any)._onScroll = onScroll;

    const onResize = () => {
      if (!this.active) return;
      this.updateParallax(true); // Snap on resize
    };
    (this as any)._onResize = onResize;

    // IntersectionObserver: activate only when section is near/visible
    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const inView = !!entry?.isIntersecting;
          this.active = inView;

          if (inView) {
            window.addEventListener('scroll', onScroll, { passive: true } as any);
            window.addEventListener('resize', onResize, { passive: true } as any);
            this.updateParallax(true);
          } else {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            // Reset to base state (clean UX, no stuck transforms)
            this.currentY = 0;
            this.targetY = 0;
            this.currentScale = 1;
            this.targetScale = 1;
            el.style.transform = '';
          }
        },
        { root: null, rootMargin: '600px 0px', threshold: 0.01 }
      );
      this.io.observe(el);
    } else {
      // Fallback: always active
      this.active = true;
      window.addEventListener('scroll', onScroll, { passive: true } as any);
      window.addEventListener('resize', onResize, { passive: true } as any);
      this.updateParallax(true);
    }

    // ResizeObserver: handle layout shifts
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => {
        if (this.active) {
          this.updateParallax(true);
        }
      });
      this.ro.observe(el);
    }

    // Initialize steps progress animation
    this.initStepsProgress();
  }

  private initStepsProgress(): void {
    if (typeof window === 'undefined') return;
    
    setTimeout(() => {
      const stepsElement = this.stepsContainer?.nativeElement;
      if (!stepsElement) return;

      let rafId: number | null = null;
      let lastProgress = -1;

      const updateProgress = () => {
        const rect = stepsElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Calculate progress based on how much of the section has scrolled through viewport
        // Progress starts when section top enters viewport, completes when section center reaches viewport center
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const sectionBottom = rect.bottom;
        
        // Start progress when section enters viewport, complete when center reaches viewport center
        const scrollStart = viewportHeight; // When section top is at bottom of viewport
        const scrollEnd = viewportHeight * 0.5 - sectionHeight * 0.5; // When section center is at viewport center
        
        // Current scroll position relative to start
        const scrollPos = sectionTop;
        
        // Calculate raw progress (0 to 1)
        const scrollRange = scrollStart - scrollEnd;
        const rawProgress = (scrollStart - scrollPos) / scrollRange;
        let progress = Math.max(0, Math.min(1, rawProgress));
        
        // Smooth easing for fluid feel
        progress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Activate steps progressively (each step activates at 25% intervals)
        const steps = stepsElement.querySelectorAll<HTMLElement>('.ui-programs__step[data-step]');
        steps.forEach((step) => {
          const stepNumber = parseInt(step.getAttribute('data-step') || '1', 10);
          const stepThreshold = (stepNumber - 1) * 0.25;
          const stepEnd = stepNumber * 0.25;
          
          // Calculate step-specific progress for smooth animation
          let stepProgress = 0;
          if (progress >= stepEnd) {
            stepProgress = 1; // Fully active
          } else if (progress > stepThreshold) {
            // Partial activation based on progress within step range
            stepProgress = (progress - stepThreshold) / (stepEnd - stepThreshold);
          }
          
          // Apply smooth scale and brightness via CSS custom properties
          step.classList.toggle('is-active', stepProgress > 0);
          const circle = step.querySelector<HTMLElement>('.ui-programs__step-circle');
          if (circle) {
            // Interpolate scale from 0.85 to 1.0
            const scale = 0.85 + (stepProgress * 0.15);
            // Interpolate brightness from 0.7 to 1.1
            const brightness = 0.7 + (stepProgress * 0.4);
            // Interpolate saturation from 0.8 to 1.2
            const saturation = 0.8 + (stepProgress * 0.4);
            
            circle.style.setProperty('--step-scale', scale.toString());
            circle.style.setProperty('--step-brightness', brightness.toString());
            circle.style.setProperty('--step-saturation', saturation.toString());
            circle.style.transform = `scale(${scale})`;
            circle.style.filter = `brightness(${brightness}) saturate(${saturation})`;
          }
          
          // Animate number opacity
          const number = step.querySelector<HTMLElement>('.ui-programs__step-number');
          if (number) {
            const numberOpacity = 0.5 + (stepProgress * 0.5);
            const numberScale = 0.9 + (stepProgress * 0.1);
            number.style.opacity = numberOpacity.toString();
            number.style.transform = `scale(${numberScale})`;
          }
          
          // Animate rotating ring
          const rotating = step.querySelector<HTMLElement>('.ui-programs__step-circle-rotating');
          if (rotating) {
            const ringOpacity = 0.2 + (stepProgress * 0.4);
            const ringScale = 0.8 + (stepProgress * 0.2);
            rotating.style.opacity = ringOpacity.toString();
            rotating.style.transform = `scale(${ringScale})`;
          }
        });
        
        lastProgress = progress;
        rafId = null;
      };

      const onScroll = () => {
        // Always update immediately for instant response
        updateProgress();
      };

      // Use IntersectionObserver to only calculate when visible
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            window.addEventListener('scroll', onScroll, { passive: true });
            updateProgress();
          } else {
            window.removeEventListener('scroll', onScroll);
            // Reset when not visible
            stepsElement.querySelectorAll<HTMLElement>('.ui-programs__step[data-step]').forEach(step => {
              step.classList.remove('is-active');
              const circle = step.querySelector<HTMLElement>('.ui-programs__step-circle');
              const number = step.querySelector<HTMLElement>('.ui-programs__step-number');
              const rotating = step.querySelector<HTMLElement>('.ui-programs__step-circle-rotating');
              
              if (circle) {
                circle.style.transform = 'scale(0.85)';
                circle.style.filter = 'brightness(0.7) saturate(0.8)';
              }
              if (number) {
                number.style.opacity = '0.5';
                number.style.transform = 'scale(0.9)';
              }
              if (rotating) {
                rotating.style.opacity = '0.2';
                rotating.style.transform = 'scale(0.8)';
              }
            });
            lastProgress = -1;
          }
        },
        {
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
          rootMargin: '-20% 0px -20% 0px'
        }
      );

      observer.observe(stepsElement);
      
      // Initial check
      const initialRect = stepsElement.getBoundingClientRect();
      if (initialRect.top < window.innerHeight && initialRect.bottom > 0) {
        updateProgress();
      }

      this.destroy$.subscribe(() => {
        observer.disconnect();
        window.removeEventListener('scroll', onScroll);
      });
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    const onScroll = (this as any)._onScroll as (() => void) | undefined;
    const onResize = (this as any)._onResize as (() => void) | undefined;
    if (onScroll) window.removeEventListener('scroll', onScroll);
    if (onResize) window.removeEventListener('resize', onResize);
    this.io?.disconnect();
    this.ro?.disconnect();
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  private updateParallax(snap = false): void {
    const el = this.parallaxEl?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);
    const sectionHeight = Math.max(1, rect.height);

    // Calculate progress: 0 when below viewport, 1 when passed
    // Premium easing: smooth transition through viewport
    const rawProgress = (vh - rect.top) / (vh + sectionHeight);
    const progress = Math.max(0, Math.min(1, rawProgress));
    
    // EaseInOutCubic for ultra-smooth, elegant feel
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // Elegant parallax: starts lower, ends higher (creates refined depth)
    this.targetY = this.ENTER_OFFSET + (this.EXIT_OFFSET - this.ENTER_OFFSET) * eased;
    
    // Very subtle scale effect (barely perceptible, elegant)
    this.targetScale = 1 - (eased * 0.01); // Minimal scale for subtle depth

    // Smooth lerp
    if (snap) {
      this.currentY = this.targetY;
      this.currentScale = this.targetScale;
    } else {
      this.currentY += (this.targetY - this.currentY) * this.LERP_SPEED;
      this.currentScale += (this.targetScale - this.currentScale) * this.LERP_SPEED;
    }

    // Apply transform with scale (clean when at rest)
    if (Math.abs(this.currentY) < 0.5 && Math.abs(this.currentScale - 1) < 0.001) {
      el.style.transform = '';
    } else {
      el.style.transform = `translate3d(0, ${this.currentY.toFixed(2)}px, 0) scale(${this.currentScale.toFixed(4)})`;
    }
  }
}
