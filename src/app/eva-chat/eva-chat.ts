import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'eva-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, MatRippleModule, MatIconModule],
  templateUrl: './eva-chat.html',
  styleUrls: ['./eva-chat.css']
})
export class EvaChat implements AfterViewInit, OnDestroy {
  @ViewChild('chatButton', { static: false }) chatButton!: ElementRef;
  isOpen = false;
  private scrollTrigger?: ScrollTrigger;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.setupScrollAnimation();
  }

  ngOnDestroy(): void {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  }

  private setupScrollAnimation(): void {
    if (!this.chatButton?.nativeElement) return;
    
    this.ngZone.runOutsideAngular(() => {
      const btn = this.chatButton.nativeElement;
      
      // État initial : caché
      gsap.set(btn, {
        opacity: 0,
        y: 20,
        scale: 0.95
      });

      // Apparaître au scroll avec ScrollTrigger
      this.scrollTrigger = ScrollTrigger.create({
        trigger: 'body',
        start: 'top -100',
        end: 'max',
        onEnter: () => {
          gsap.to(btn, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
          });
        },
        onLeaveBack: () => {
          gsap.to(btn, {
            opacity: 0,
            y: 20,
            scale: 0.95,
            duration: 0.3,
            ease: 'power2.in'
          });
        }
      });
    });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    console.log('Eva Chat toggled:', this.isOpen);
  }
}
