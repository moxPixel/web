import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { ThreeSceneComponent } from '../three-scene/three-scene.component';
import { GsapAnimationService } from '../../services/gsap-animation.service';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { gsap } from 'gsap';
import { AnimationGateService } from '../../services/animation-gate.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ThreeSceneComponent, MatRippleModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroContent', { static: false }) heroContent!: ElementRef;
  @ViewChild('heroParallax', { static: false }) heroParallax!: ElementRef;
  @ViewChild('logoContainer', { static: false }) logoContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('h1Mobile', { static: false }) h1Mobile!: ElementRef<HTMLHeadingElement>;
  @ViewChild('h1Desktop', { static: false }) h1Desktop!: ElementRef<HTMLHeadingElement>;

  private heroParallaxTween?: gsap.core.Tween;

  constructor(
    private gsapAnimation: GsapAnimationService,
    private gsapScroll: GsapScrollService,
    private animationGate: AnimationGateService
  ) {}

  ngAfterViewInit() {
    this.animationGate.run(() => this.startHeroAnimations());
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

        const buttons = this.heroContent.nativeElement.querySelectorAll('.btn');
        buttons.forEach((btn: HTMLElement, index: number) => {
          const originalTransition = btn.style.transition;
          btn.style.transition = 'none';
          
          gsap.set(btn, { 
            opacity: 0, 
            filter: 'blur(20px)',
            scale: 0.96,
            force3D: true
          });
          
          gsap.to(btn, {
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            duration: 1.1,
            delay: 1.0 + (index * 0.15),
            ease: 'none',
            force3D: true,
            onComplete: () => {
              btn.style.transition = originalTransition || '';
            }
          });
        });
      }
    }, 150);
  }

  ngOnDestroy(): void {
    this.heroParallaxTween?.scrollTrigger?.kill();
    this.heroParallaxTween?.kill();
    this.heroParallaxTween = undefined;
  }
}

