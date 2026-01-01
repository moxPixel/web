import { Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-quality-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quality-section.component.html',
  styleUrl: './quality-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QualitySectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('indicatorsSection', { static: false }) indicatorsSection?: ElementRef<HTMLElement>;
  private destroy$ = new Subject<void>();
  private io?: IntersectionObserver;
  private animated = new Set<HTMLElement>();

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !this.indicatorsSection) return;

    setTimeout(() => {
      const section = this.indicatorsSection?.nativeElement;
      if (!section) return;

      // Animate progress circles when they enter viewport
      if (typeof IntersectionObserver !== 'undefined') {
        this.io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                const progressCircle = entry.target as HTMLElement;
                if (!this.animated.has(progressCircle)) {
                  this.animated.add(progressCircle);
                  this.animateCircle(progressCircle);
                }
              }
            });
          },
          { threshold: [0.3] }
        );

        const progressCircles = section.querySelectorAll<HTMLElement>('.ui-quality__indicator-progress');
        progressCircles.forEach((circle) => {
          // Initialize with offset = full circumference (0% visible)
          const circumference = 2 * Math.PI * 44; // radius = 44 (for viewBox 100x100)
          circle.style.strokeDashoffset = `${circumference}`;
          this.io?.observe(circle);
        });
      }
    }, 100);
  }

  private animateCircle(circle: HTMLElement): void {
    const value = parseInt(circle.getAttribute('data-value') || '0', 10);
    const circumference = 2 * Math.PI * 44; // radius = 44 (for viewBox 100x100)
    const offset = circumference - (value / 100) * circumference;

    // Trigger animation by setting final offset
    requestAnimationFrame(() => {
      circle.style.strokeDashoffset = `${offset}`;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.io?.disconnect();
  }
}

