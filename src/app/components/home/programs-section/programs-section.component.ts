import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { GsapScrollService } from '../../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../../services/page-loader-inline.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type Slide = {
  link: string;
  img: string;
  alt: string;
  title: string;
  height: string;
  width: string;
};

@Component({
  selector: 'app-programs-section',
  standalone: true,
  imports: [CommonModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './programs-section.component.html',
  styleUrl: './programs-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramsSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('programsHeroParallax', { static: false }) programsHeroParallax!: ElementRef;

  slides: Slide[] = [
    { link: '/trainings', img: '/assets/images/img/p1.jpg', alt: 'Intelligence Artificielle', title: 'Intelligence Artificielle', height: 'h-[380px]', width: 'w-[300px]' },
    { link: '/trainings', img: '/assets/images/img/p2.jpg', alt: 'Cybersécurité', title: 'Cybersécurité', height: 'h-[340px]', width: 'w-[280px]' },
    { link: '/trainings', img: '/assets/images/img/p7.jpg', alt: 'Data Science', title: 'Data Science', height: 'h-[400px]', width: 'w-[320px]' },
    { link: '/trainings', img: '/assets/images/img/p10.jpg', alt: 'Cloud & DevOps', title: 'Cloud & DevOps', height: 'h-[360px]', width: 'w-[350px]' },
    { link: '/trainings', img: '/assets/images/img/p18.jpg', alt: 'Blockchain', title: 'Blockchain & Web3', height: 'h-[320px]', width: 'w-[280px]' },
    { link: '/trainings', img: '/assets/images/img/p6.jpg', alt: 'Architecture Logicielle', title: 'Architecture Logicielle', height: 'h-[380px]', width: 'w-[300px]' }
  ];

  private heroParallaxTween?: any;
  private destroy$ = new Subject<void>();

  constructor(
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService
  ) {}

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isHidden) => {
      if (isHidden) {
        setTimeout(() => {
          if (this.programsHeroParallax) {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.programsHeroParallax.nativeElement,
              -0.25,
              'top top',
              'bottom top'
            );
          }
        }, 50);
            }
          });
        }

  trackByIndex(index: number): number {
    return index;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.heroParallaxTween) {
      this.heroParallaxTween.scrollTrigger?.kill();
      this.heroParallaxTween.kill();
      this.heroParallaxTween = undefined;
  }
}
}
