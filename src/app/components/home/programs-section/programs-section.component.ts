import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
  styleUrl: './programs-section.component.css'
})
export class ProgramsSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('programsHeroParallax', { static: false }) programsHeroParallax!: ElementRef;

  slides: Slide[] = [
    { link: '/formations/ia', img: '/assets/images/img/p1.jpg', alt: 'Intelligence Artificielle', title: 'Intelligence Artificielle', height: 'h-[340px]', width: 'w-[260px]' },
    { link: '/formations/cybersecurite', img: '/assets/images/img/p2.jpg', alt: 'Cybersécurité', title: 'Cybersécurité', height: 'h-[300px]', width: 'w-[220px]' },
    { link: '/formations/data-science', img: '/assets/images/img/p7.jpg', alt: 'Data Science', title: 'Data Science', height: 'h-[340px]', width: 'w-[260px]' },
    { link: '/formations/cloud-devops', img: '/assets/images/img/p10.jpg', alt: 'Cloud & DevOps', title: 'Cloud & DevOps', height: 'h-[280px]', width: 'w-[380px]' },
    { link: '/formations/blockchain', img: '/assets/images/img/p18.jpg', alt: 'Blockchain', title: 'Blockchain & Web3', height: 'h-[260px]', width: 'w-[260px]' },
    { link: '/formations/architecture', img: '/assets/images/img/p6.jpg', alt: 'Architecture Logicielle', title: 'Architecture Logicielle', height: 'h-[340px]', width: 'w-[260px]' }
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
