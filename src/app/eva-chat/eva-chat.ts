import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-eva-chat',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule],
  templateUrl: './eva-chat.html',
  styleUrl: './eva-chat.css',
})
export class EvaChat implements AfterViewInit, OnDestroy {
  @ViewChild('chatButton', { static: false }) chatButton!: ElementRef<HTMLElement>;

  isOpen = false;
  private scrollTrigger?: ScrollTrigger;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    if (this.chatButton) {
      this.setupScrollAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  }

  private setupScrollAnimation(): void {
    this.ngZone.runOutsideAngular(() => {
      // Initialiser le bouton comme caché
      gsap.set(this.chatButton.nativeElement, {
        opacity: 0,
        y: 20,
        scale: 0.8
      });

      // Créer l'animation au scroll
      this.scrollTrigger = ScrollTrigger.create({
        trigger: 'body',
        start: 'top -100',
        onEnter: () => {
          gsap.to(this.chatButton.nativeElement, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
          });
        },
        onLeaveBack: () => {
          gsap.to(this.chatButton.nativeElement, {
            opacity: 0,
            y: 20,
            scale: 0.8,
            duration: 0.3,
            ease: 'power2.in'
          });
        }
      });
    });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }
}
