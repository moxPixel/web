import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ThreeSceneComponent } from '../three-scene/three-scene.component';
import { GsapAnimationService } from '../../services/gsap-animation.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { GsapHelpers } from '../../utils/gsap-helpers';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { Training } from '../../interfaces/training.interface';
import { gsap } from 'gsap';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ThreeSceneComponent, MatRippleModule, MatIconModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroContent', { static: false }) heroContent!: ElementRef;
  @ViewChild('heroParallax', { static: false }) heroParallax!: ElementRef;
  @ViewChild('logoContainer', { static: false }) logoContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('h1Mobile', { static: false }) h1Mobile!: ElementRef<HTMLHeadingElement>;
  @ViewChild('h1Desktop', { static: false }) h1Desktop!: ElementRef<HTMLHeadingElement>;

  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();
  countdownText = 'Date à venir';
  nextSessionDate?: Date;
  private countdownTimer?: any;

  constructor(
    private gsapAnimation: GsapAnimationService,
    private gsapScroll: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService,
    private trainingsService: TrainingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.trainingsService.getTrainings().pipe(takeUntil(this.destroy$)).subscribe((trainings) => {
      const next = this.getGlobalNextSessionDate(trainings);
      if (next) {
        this.nextSessionDate = next;
        this.updateCountdown();
        this.countdownTimer = setInterval(() => this.updateCountdown(), 1000);
      } else {
        this.countdownText = 'Date à venir';
      }
      this.markForCheckSafe();
    });
  }

  ngAfterViewInit() {
    // Attendre que le loader soit complètement caché avant de démarrer les animations
    this.pageLoaderInline.loaderHidden$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isHidden) => {
      if (isHidden) {
        // Attendre un court délai après la disparition du loader pour garantir la transition
        setTimeout(() => {
          this.startHeroAnimations();
        }, 50);
      }
    });
  }
  private startHeroAnimations(): void {
    if (this.heroParallax) {
      this.heroParallaxTween = this.gsapScroll.createParallax(
        this.heroParallax.nativeElement,
        -0.25,
        'top top',
        'bottom top'
      );
    }

    const masterTimeline = gsap.timeline({ delay: 0.1 });

    if (this.logoContainer?.nativeElement) {
      gsap.set(this.logoContainer.nativeElement, {
        opacity: 0,
        filter: 'blur(16px)',
        scale: 0.95
      });
      masterTimeline.to(this.logoContainer.nativeElement, {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: 1.0,
        ease: 'power3.out'
      }, 0);
    }

    setTimeout(() => {
      if (this.h1Mobile?.nativeElement) {
        this.gsapAnimation.textLetterByLetter(this.h1Mobile.nativeElement, {
          duration: 0.7,
          delay: 0.4,
          stagger: 0.025,
          blur: 12,
          ease: 'power2.out'
        });
      }

      if (this.h1Desktop?.nativeElement) {
        this.gsapAnimation.textLetterByLetter(this.h1Desktop.nativeElement, {
          duration: 0.7,
          delay: 0.4,
          stagger: 0.025,
          blur: 12,
          ease: 'power2.out'
        });
      }
    }, 100);

    setTimeout(() => {
      if (this.heroContent) {
        const paragraphs = this.heroContent.nativeElement.querySelectorAll('p');
        paragraphs.forEach((p: HTMLElement, index: number) => {
          gsap.set(p, {
            opacity: 0,
            filter: 'blur(18px)',
            scale: 0.98
          });
          this.gsapAnimation.defloutage(p, {
            duration: 1.0,
            delay: 0.7 + (index * 0.2),
            blur: 18,
            scale: 0.98,
            ease: 'power2.out'
          });
        });

        // Countdown block
        const countdown = this.heroContent.nativeElement.querySelector('.hero-countdown') as HTMLElement | null;
        if (countdown) {
          gsap.set(countdown, {
            opacity: 0,
            filter: 'blur(18px)',
            scale: 0.98
          });
          this.gsapAnimation.defloutage(countdown, {
            duration: 1.0,
            delay: 0.7 + (paragraphs.length * 0.2),
            blur: 18,
            scale: 0.98,
            ease: 'power2.out'
          });
        }

        // Utiliser le helper réutilisable pour les boutons
        const buttons = this.heroContent.nativeElement.querySelectorAll('.btn');
        GsapHelpers.animateButtons(buttons, {
          delay: 1.0,
          stagger: 0.15,
          duration: 1.1
        });
      }
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.heroParallaxTween?.scrollTrigger?.kill();
    this.heroParallaxTween?.kill();
    this.heroParallaxTween = undefined;
  }

  private getGlobalNextSessionDate(trainings: Training[]): Date | undefined {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessions = trainings
      .flatMap(t => t.sessions || [])
      .map(s => new Date(s.startDate))
      .filter(d => !isNaN(d.getTime()) && d.getTime() >= today.getTime())
      .sort((a, b) => a.getTime() - b.getTime());
    return sessions[0];
  }

  private updateCountdown(): void {
    if (!this.nextSessionDate) return;
    const now = Date.now();
    const diff = this.nextSessionDate.getTime() - now;
    if (diff <= 0) {
      this.countdownText = 'Bientôt en cours';
      this.clearTimer();
      this.markForCheckSafe();
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}j`);
    parts.push(`${hours.toString().padStart(2, '0')}h`);
    parts.push(`${minutes.toString().padStart(2, '0')}m`);
    parts.push(`${seconds.toString().padStart(2, '0')}s`);
    this.countdownText = parts.join(' ');
    this.markForCheckSafe();
  }

  private clearTimer(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  private markForCheckSafe(): void {
    try {
      this.cdr.markForCheck();
    } catch (_) {
      // no-op
    }
  }
}

