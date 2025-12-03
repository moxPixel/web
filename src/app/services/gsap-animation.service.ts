import { Injectable, NgZone } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface FadeUpOptions {
  duration?: number;
  delay?: number;
  y?: number;
  opacity?: number;
  ease?: string;
}

export interface DefloutageOptions {
  duration?: number;
  delay?: number;
  blur?: number;
  opacity?: number;
  scale?: number;
  ease?: string;
}

export interface TextLetterByLetterOptions {
  duration?: number;
  delay?: number;
  stagger?: number;
  opacity?: number;
  blur?: number;
  ease?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GsapAnimationService {

  constructor(
    private ngZone: NgZone
  ) {}

  /**
   * Animation utilitaire inspirée de la doc GSAP Scroll (gsap.com/scroll)
   * Permet d'animer l'apparition d'un bloc avec un léger mouvement vers le haut.
   */
  fadeUp(element: HTMLElement, options?: FadeUpOptions): void {
    if (!element) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      gsap.from(element, {
        duration: options?.duration ?? 1.0,
        delay: options?.delay ?? 0,
        y: options?.y ?? 60,
        opacity: options?.opacity ?? 0,
        ease: options?.ease ?? 'power3.out'
      });
    });
  }

  /**
   * Crée une animation de reveal synchronisée au scroll avec ScrollTrigger.
   */
  revealOnScroll(element: HTMLElement, options?: FadeUpOptions): ScrollTrigger | null {
    if (!element) {
      return null;
    }

    return this.ngZone.runOutsideAngular(() => {
      const tween = gsap.from(element, {
        duration: options?.duration ?? 1,
        y: options?.y ?? 80,
        opacity: options?.opacity ?? 0,
        ease: options?.ease ?? 'power2.out',
        paused: true
      });

      return ScrollTrigger.create({
        trigger: element,
        start: 'top 85%',
        onEnter: () => tween.play(),
        onLeaveBack: () => tween.reverse(),
        once: true
      });
    });
  }

  /**
   * Pinne une section pendant qu'on la scrolle (effet slide/stage).
   */
  pinSection(section: HTMLElement, options?: { start?: string; end?: string; pinSpacing?: boolean }): ScrollTrigger | null {
    if (!section) {
      return null;
    }

    return this.ngZone.runOutsideAngular(() => {
      return ScrollTrigger.create({
        trigger: section,
        start: options?.start ?? 'top top',
        end: options?.end ?? '+=150%',
        pin: true,
        pinSpacing: options?.pinSpacing ?? true,
        scrub: true
      });
    });
  }

  /**
   * Animation de défloutage fluide : blur qui se dissipe avec fade-in et scale léger
   * Parfait pour les objets 3D, images et textes
   */
  defloutage(element: HTMLElement, options?: DefloutageOptions): void {
    if (!element) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const initialBlur = options?.blur ?? 20;
      const initialOpacity = options?.opacity ?? 0;
      const initialScale = options?.scale ?? 0.85;

      gsap.set(element, {
        filter: `blur(${initialBlur}px)`,
        opacity: initialOpacity,
        scale: initialScale
      });

      gsap.to(element, {
        filter: 'blur(0px)',
        opacity: 1,
        scale: 1,
        duration: options?.duration ?? 1.2,
        delay: options?.delay ?? 0,
        ease: options?.ease ?? 'power3.out'
      });
    });
  }

  /**
   * Animation de texte lettre par lettre avec défloutage
   * Enveloppe chaque lettre dans un span et les anime progressivement
   * Préserve les balises HTML comme <strong>, <br />, etc.
   */
  textLetterByLetter(element: HTMLElement, options?: TextLetterByLetterOptions): void {
    if (!element) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const computedStyle = window.getComputedStyle(element);
      const inlineOpacity = element.style.opacity;
      const currentOpacity = inlineOpacity ? parseFloat(inlineOpacity) : parseFloat(computedStyle.opacity);
      const shouldHide = currentOpacity > 0;
      
      if (shouldHide) {
        gsap.set(element, { opacity: 0 });
      }

      const letters: HTMLElement[] = [];

      const processNode = (node: Node): void => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (text.trim()) {
            const fragment = document.createDocumentFragment();
            
            text.split('').forEach((char) => {
              if (char === ' ') {
                const spaceText = document.createTextNode(' ');
                fragment.appendChild(spaceText);
              } else {
                const span = document.createElement('span');
                span.textContent = char;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.filter = `blur(${options?.blur ?? 10}px)`;
                fragment.appendChild(span);
                letters.push(span);
              }
            });
            
            if (node.parentNode) {
              node.parentNode.replaceChild(fragment, node);
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (el.tagName === 'BR') {
            return;
          }
          const children = Array.from(el.childNodes);
          children.forEach(child => processNode(child));
        }
      };

      const children = Array.from(element.childNodes);
      children.forEach(child => processNode(child));

      if (letters.length > 0) {
        gsap.to(element, {
          opacity: 1,
          duration: 0.01,
          delay: options?.delay ?? 0
        });

        gsap.to(letters, {
          opacity: 1,
          filter: 'blur(0px)',
          duration: options?.duration ?? 0.6,
          stagger: options?.stagger ?? 0.03,
          delay: options?.delay ?? 0,
          ease: options?.ease ?? 'power3.out'
        });
      } else {
        gsap.set(element, { opacity: 1 });
      }
    });
  }
}

