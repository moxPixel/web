import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThreeParticlesSimpleComponent } from '../../shared/components/three-particles-simple/three-particles-simple.component';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { take } from 'rxjs';
import { Training } from '../../interfaces/training.interface';
import { TrainingsService } from '../../services/trainings/trainings.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, ThreeParticlesSimpleComponent, TablerIconComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  // Real data (same source of truth as Trainings page).
  nextSessionLabel = 'Date à venir';

  private readonly trainings = inject(TrainingsService);

  @ViewChild('heroContent', { static: false }) heroContent!: ElementRef;
  @ViewChild('heroParallax', { static: false }) heroParallax!: ElementRef;
  @ViewChild('h1Mobile', { static: false }) h1Mobile!: ElementRef<HTMLHeadingElement>;
  @ViewChild('h1Desktop', { static: false }) h1Desktop!: ElementRef<HTMLHeadingElement>;
  @ViewChild(ThreeParticlesSimpleComponent, { static: false }) threeComponent!: ThreeParticlesSimpleComponent;

  private scrollRaf: number | null = null;
  private settleRaf: number | null = null;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private scrollListenerActive = false;
  private cardRevealTimer: number | null = null;

  // Hero metrics (recomputed on resize/layout shift)
  private heroTop = 0;
  private heroHeight = 0;

  // Premium parallax: smooth lerp with easing - Multi-layer depth effect
  private contentOffsetTarget = 0;
  private contentOffsetCurrent = 0;
  private contentScaleCurrent = 1;
  private contentScaleTarget = 1;
  private scrollProgressTarget = 0;
  private scrollProgressCurrent = 0;
  
  // Multi-layer depth parallax (different speeds for different elements)
  private h1OffsetTarget = 0;
  private h1OffsetCurrent = 0;
  private descriptionOffsetTarget = 0;
  private descriptionOffsetCurrent = 0;
  private actionsOffsetTarget = 0;
  private actionsOffsetCurrent = 0;

  // NOTE: Three.js stage positioning is controlled by CSS only (SSOT).
  // Any JS “force fixed” logic here risks aspect-ratio mismatch -> visible deformation.

  // Parallax config (premium fluid depth effect)
  private readonly CONTENT_PARALLAX_SPEED = 0.5; // Base speed
  private readonly MAX_CONTENT_OFFSET = 80; // px max movement
  
  // Multi-layer depth speeds (different layers move at different speeds)
  private readonly H1_PARALLAX_SPEED = 0.7; // Title moves faster (foreground)
  private readonly DESCRIPTION_PARALLAX_SPEED = 0.5; // Description moves at base speed (middle)
  private readonly ACTIONS_PARALLAX_SPEED = 0.35; // Actions move slower (background)

  ngOnInit(): void {
    this.loadRealNextSessionLabel();
  }

  ngAfterViewInit(): void {
    // SEO: S'assurer qu'un seul H1 est visible pour les bots (aria-hidden sur celui caché par CSS)
    this.setH1AriaHidden();
    
    // CRITICAL: Cacher TOUS les éléments IMMÉDIATEMENT avant toute animation
    this.hideAllElementsImmediately();
    // Ensuite attendre le loader
    this.waitForLoaderThenStart();
  }

  /**
   * SEO: Définit aria-hidden sur le H1 qui est caché par CSS pour éviter les H1 dupliqués
   */
  private setH1AriaHidden(): void {
    if (typeof window === 'undefined') return;
    
    const updateAriaHidden = () => {
      if (!this.h1Mobile?.nativeElement || !this.h1Desktop?.nativeElement) return;
      
      // Sur mobile (< 768px), le H1 desktop est caché -> aria-hidden="true"
      // Sur desktop (>= 768px), le H1 mobile est caché -> aria-hidden="true"
      const isMobile = window.innerWidth < 768;
      this.h1Mobile.nativeElement.setAttribute('aria-hidden', isMobile ? 'false' : 'true');
      this.h1Desktop.nativeElement.setAttribute('aria-hidden', isMobile ? 'true' : 'false');
    };
    
    updateAriaHidden();
    window.addEventListener('resize', updateAriaHidden, { passive: true });
    
    // Cleanup dans ngOnDestroy
    (this as any)._updateAriaHidden = updateAriaHidden;
  }

  /**
   * Cache TOUS les éléments IMMÉDIATEMENT (avant toute animation)
   * Utilise visibility: hidden pour vraiment les cacher
   * Note: Les H1 seront traités différemment par textLetterByLetter
   */
  private hideAllElementsImmediately(): void {
    // H1 Mobile & Desktop - juste cacher, textLetterByLetter gérera l'animation
    if (this.h1Mobile?.nativeElement) {
      const el = this.h1Mobile.nativeElement;
      el.style.cssText = 'opacity: 0 !important; visibility: hidden !important; transition: none !important;';
    }
    if (this.h1Desktop?.nativeElement) {
      const el = this.h1Desktop.nativeElement;
      el.style.cssText = 'opacity: 0 !important; visibility: hidden !important; transition: none !important;';
    }

    // Descriptions, next session, boutons
    if (this.heroContent?.nativeElement) {
      const descriptions = this.heroContent.nativeElement.querySelectorAll('.ui-hero-description');
      descriptions.forEach((el: Element) => {
        (el as HTMLElement).style.cssText = 'opacity: 0 !important; filter: blur(20px) !important; transform: scale(0.98) translateZ(0) !important; visibility: hidden !important; transition: none !important;';
      });

      const nextSession = this.heroContent.nativeElement.querySelector('.ui-hero-nextline');
      if (nextSession) {
        (nextSession as HTMLElement).style.cssText = 'opacity: 0 !important; filter: blur(20px) !important; transform: scale(0.98) translateZ(0) !important; visibility: hidden !important; transition: none !important;';
      }

      const buttons = this.heroContent.nativeElement.querySelectorAll('.ui-hero-actions a');
      buttons.forEach((el: Element) => {
        (el as HTMLElement).style.cssText = 'opacity: 0 !important; filter: blur(20px) !important; transform: scale(0.96) translateZ(0) !important; visibility: hidden !important; transition: none !important;';
      });
    }
  }

  ngOnDestroy(): void {
    // Cleanup aria-hidden listener
    const updateAriaHidden = (this as any)._updateAriaHidden;
    if (updateAriaHidden && typeof window !== 'undefined') {
      window.removeEventListener('resize', updateAriaHidden);
    }
    
    if (this.cardRevealTimer !== null) {
      window.clearTimeout(this.cardRevealTimer);
      this.cardRevealTimer = null;
    }
    this.cleanup();
  }

  private loadRealNextSessionLabel(): void {
    this.trainings
      .getTrainings()
      .pipe(take(1))
      .subscribe({
        next: (trainings) => {
          this.nextSessionLabel = this.computeNextSessionLabelFromTrainings(trainings);
        },
        error: () => {
          this.nextSessionLabel = 'Date à venir';
        },
      });
  }

  private computeNextSessionLabelFromTrainings(trainings: Training[]): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = trainings
      .flatMap((t) => t.sessions || [])
      .map((s) => new Date(s.startDate))
      .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= today.getTime())
      .sort((a, b) => a.getTime() - b.getTime());

    const next = sessions[0];
    if (!next) return 'Date à venir';

    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(next);
    } catch {
      return next.toLocaleDateString('fr-FR');
    }
  }

  private cleanup(): void {
    if (this.scrollRaf !== null) {
      cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = null;
    }
    if (this.settleRaf !== null) {
      cancelAnimationFrame(this.settleRaf);
      this.settleRaf = null;
    }
    this.disableScrollListener();
    window.removeEventListener('resize', this.onResize);
    this.io?.disconnect();
    this.ro?.disconnect();
  }

  private onScroll = (): void => {
    if (this.scrollRaf !== null) return;
    this.scrollRaf = requestAnimationFrame(() => {
      this.updateParallax();
      this.scrollRaf = null;
    });
  };

  private onResize = (): void => {
    this.computeHeroMetrics();
    this.updateParallax(true); // Snap on resize
  };

  private initParallax(): void {
    const heroEl = this.heroParallax?.nativeElement;
    if (!heroEl) return;

    this.computeHeroMetrics();

    // IntersectionObserver: activate only when hero is near/visible
    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            this.enableScrollListener();
            this.computeHeroMetrics();
            this.updateParallax(true);
          } else {
            this.disableScrollListener();
            this.resetToRest();
          }
        },
        { rootMargin: '300px' }
      );
      this.io.observe(heroEl);
    } else {
      this.enableScrollListener();
    }

    // ResizeObserver: recompute metrics on layout shift
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => {
        this.computeHeroMetrics();
        this.updateParallax(true);
      });
      this.ro.observe(heroEl);
    }

    window.addEventListener('resize', this.onResize, { passive: true } as any);

    // Initialize to rest state
    this.resetToRest();
    this.updateParallax(true);
  }

  private computeHeroMetrics(): void {
    const heroEl = this.heroParallax?.nativeElement as HTMLElement | undefined;
    if (!heroEl) return;
    const rect = heroEl.getBoundingClientRect();
    this.heroTop = rect.top + window.scrollY;
    this.heroHeight = Math.max(1, rect.height);
  }

  private enableScrollListener(): void {
    if (this.scrollListenerActive) return;
    window.addEventListener('scroll', this.onScroll, { passive: true } as any);
    this.scrollListenerActive = true;
  }

  private disableScrollListener(): void {
    if (!this.scrollListenerActive) return;
    window.removeEventListener('scroll', this.onScroll);
    this.scrollListenerActive = false;
  }

  private resetToRest(): void {
    this.contentOffsetTarget = 0;
    this.contentScaleTarget = 1;
    this.scrollProgressTarget = 0;
    this.h1OffsetTarget = 0;
    this.descriptionOffsetTarget = 0;
    this.actionsOffsetTarget = 0;
    this.startSettleLoop();
  }

  private startSettleLoop(): void {
    if (this.settleRaf !== null) return;
    const tick = () => {
      this.settleRaf = requestAnimationFrame(tick);
      this.stepSmooth();

      const done =
        Math.abs(this.contentOffsetCurrent) < 0.1 &&
        Math.abs(this.contentScaleCurrent - 1) < 0.001 &&
        Math.abs(this.scrollProgressCurrent) < 0.001 &&
        Math.abs(this.h1OffsetCurrent) < 0.1 &&
        Math.abs(this.descriptionOffsetCurrent) < 0.1 &&
        Math.abs(this.actionsOffsetCurrent) < 0.1;

      if (done) {
        // Snap to exact rest
        this.contentOffsetCurrent = 0;
        this.contentScaleCurrent = 1;
        this.scrollProgressCurrent = 0;
        this.h1OffsetCurrent = 0;
        this.descriptionOffsetCurrent = 0;
        this.actionsOffsetCurrent = 0;
        this.applyTransforms();
        if (this.settleRaf !== null) cancelAnimationFrame(this.settleRaf);
        this.settleRaf = null;
      }
    };
    this.settleRaf = requestAnimationFrame(tick);
  }

  private updateParallax(snap = false): void {
    const scrollY = window.scrollY;
    const heroEl = this.heroParallax?.nativeElement;
    const contentEl = this.heroContent?.nativeElement;

    if (!heroEl) return;

    // Calculate scroll progress through hero (0 = top, 1 = bottom)
    // At default state (page top), progress = 0 (text stays below Three)
    const scrollProgress = Math.max(0, Math.min(1, (scrollY - this.heroTop) / this.heroHeight));
    
    // Premium easing: easeInOutCubic for ultra-smooth, elegant motion
    const eased = scrollProgress < 0.5
      ? 4 * scrollProgress * scrollProgress * scrollProgress
      : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;
    this.scrollProgressTarget = eased;

    // Multi-layer depth parallax: each element moves at different speeds
    const maxOffset = this.MAX_CONTENT_OFFSET;
    
    // Very subtle scale effect for overall depth
    this.contentScaleTarget = 1 - (eased * 0.01);
    
    // Base content offset
    this.contentOffsetTarget = -eased * maxOffset * this.CONTENT_PARALLAX_SPEED;
    
    // H1 (title) - moves faster (foreground layer)
    this.h1OffsetTarget = -eased * maxOffset * this.H1_PARALLAX_SPEED;
    
    // Description - moves at base speed (middle layer)
    this.descriptionOffsetTarget = -eased * maxOffset * this.DESCRIPTION_PARALLAX_SPEED;
    
    // Actions (buttons) - moves slower (background layer)
    this.actionsOffsetTarget = -eased * maxOffset * this.ACTIONS_PARALLAX_SPEED;

    if (snap) {
      this.contentOffsetCurrent = this.contentOffsetTarget;
      this.contentScaleCurrent = this.contentScaleTarget;
      this.scrollProgressCurrent = this.scrollProgressTarget;
      this.h1OffsetCurrent = this.h1OffsetTarget;
      this.descriptionOffsetCurrent = this.descriptionOffsetTarget;
      this.actionsOffsetCurrent = this.actionsOffsetTarget;
    }

    this.stepSmooth();
  }

  private stepSmooth(): void {
    // Premium lerp: ultra-smooth and fluid (elegant motion)
    const lerp = 0.1; // Smooth lerp for fluid motion
    this.contentOffsetCurrent += (this.contentOffsetTarget - this.contentOffsetCurrent) * lerp;
    this.contentScaleCurrent += (this.contentScaleTarget - this.contentScaleCurrent) * lerp;
    this.scrollProgressCurrent += (this.scrollProgressTarget - this.scrollProgressCurrent) * lerp;
    
    // Multi-layer depth parallax lerp
    this.h1OffsetCurrent += (this.h1OffsetTarget - this.h1OffsetCurrent) * lerp;
    this.descriptionOffsetCurrent += (this.descriptionOffsetTarget - this.descriptionOffsetCurrent) * lerp;
    this.actionsOffsetCurrent += (this.actionsOffsetTarget - this.actionsOffsetCurrent) * lerp;
    
    this.applyTransforms();
  }

  private applyTransforms(): void {
    const contentStackEl = this.heroContent?.nativeElement as HTMLElement | undefined;
    
    // Also ensure .ui-hero-content container never moves
    const contentContainerEl = this.heroParallax?.nativeElement?.querySelector('.ui-hero-content') as HTMLElement | null;
    if (contentContainerEl) {
      contentContainerEl.style.setProperty('transform', 'translateZ(0)', 'important');
      contentContainerEl.style.setProperty('position', 'relative', 'important');
    }

    // Apply base container parallax with scale effect
    if (contentStackEl) {
      // Clean transform when at rest
      if (Math.abs(this.contentOffsetCurrent) < 0.1 && Math.abs(this.contentScaleCurrent - 1) < 0.001) {
        contentStackEl.style.transform = '';
      } else {
        contentStackEl.style.transform = `translate3d(0, ${this.contentOffsetCurrent.toFixed(2)}px, 0) scale(${this.contentScaleCurrent.toFixed(4)})`;
      }
    }
    
    // Multi-layer depth parallax: apply different speeds to different elements
    
    // H1 (title) - foreground layer (moves faster)
    const h1MobileEl = this.h1Mobile?.nativeElement;
    const h1DesktopEl = this.h1Desktop?.nativeElement;
    if (h1MobileEl) {
      if (Math.abs(this.h1OffsetCurrent) < 0.1) {
        h1MobileEl.style.transform = '';
      } else {
        h1MobileEl.style.transform = `translate3d(0, ${this.h1OffsetCurrent.toFixed(2)}px, 0)`;
      }
    }
    if (h1DesktopEl) {
      if (Math.abs(this.h1OffsetCurrent) < 0.1) {
        h1DesktopEl.style.transform = '';
      } else {
        h1DesktopEl.style.transform = `translate3d(0, ${this.h1OffsetCurrent.toFixed(2)}px, 0)`;
      }
    }
    
    // Description - middle layer
    const descriptionEls = this.heroParallax?.nativeElement?.querySelectorAll('.ui-hero-description') as NodeListOf<HTMLElement> | null;
    if (descriptionEls) {
      descriptionEls.forEach(el => {
        if (Math.abs(this.descriptionOffsetCurrent) < 0.1) {
          el.style.transform = '';
        } else {
          el.style.transform = `translate3d(0, ${this.descriptionOffsetCurrent.toFixed(2)}px, 0)`;
        }
      });
    }
    
    // Actions (buttons) - background layer (moves slower)
    const actionsEl = this.heroParallax?.nativeElement?.querySelector('.ui-hero-actions') as HTMLElement | null;
    if (actionsEl) {
      if (Math.abs(this.actionsOffsetCurrent) < 0.1) {
        actionsEl.style.transform = '';
      } else {
        actionsEl.style.transform = `translate3d(0, ${this.actionsOffsetCurrent.toFixed(2)}px, 0)`;
      }
    }

  }

  private animationsStarted = false; // Garde pour éviter les animations multiples
  private animatedElements = new Set<HTMLElement>(); // Track des éléments déjà animés

  private startHeroAnimations(): void {
    // Éviter les animations multiples
    if (this.animationsStarted) return;
    this.animationsStarted = true;

    // H1: effet typing lettre par lettre avec deblur (comme l'exemple web)
    // Utiliser un petit délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
      if (this.h1Mobile?.nativeElement && !this.animatedElements.has(this.h1Mobile.nativeElement)) {
        this.animatedElements.add(this.h1Mobile.nativeElement);
        this.textLetterByLetter(this.h1Mobile.nativeElement, {
          delay: 0,
          blur: 12,
          duration: 0.7,
          stagger: 0.025
        });
      }

      if (this.h1Desktop?.nativeElement && !this.animatedElements.has(this.h1Desktop.nativeElement)) {
        this.animatedElements.add(this.h1Desktop.nativeElement);
        this.textLetterByLetter(this.h1Desktop.nativeElement, {
          delay: 0,
          blur: 12,
          duration: 0.7,
          stagger: 0.025
        });
      }
    }, 50);

    // Descriptions: apparaissent progressivement avec stagger (comme l'exemple web)
    if (this.heroContent?.nativeElement) {
      const paragraphs = Array.from(
        this.heroContent.nativeElement.querySelectorAll('.ui-hero-description')
      ) as HTMLElement[];

      paragraphs.forEach((p: HTMLElement, index: number) => {
        if (!this.animatedElements.has(p)) {
          this.animatedElements.add(p);
          // Stagger progressif: 0.2s entre chaque avec deblur amélioré
          this.animateElement(p, {
            delay: index * 0.2,
            blur: 20,
            scale: 0.98,
            duration: 1.2
          });
        }
      });

      // Next session: après les descriptions avec deblur amélioré
      const nextSessionEl = this.heroContent.nativeElement.querySelector('.ui-hero-nextline') as HTMLElement | null;
      if (nextSessionEl && !this.animatedElements.has(nextSessionEl)) {
        this.animatedElements.add(nextSessionEl);
        this.animateElement(nextSessionEl, {
          delay: paragraphs.length * 0.2,
          blur: 20,
          scale: 0.98,
          duration: 1.2
        });
      }

      // Boutons: apparaissent progressivement avec stagger (comme l'exemple web)
      const actionsEl = this.heroContent.nativeElement.querySelector('.ui-hero-actions') as HTMLElement | null;
      if (actionsEl) {
        const buttons = Array.from(actionsEl.querySelectorAll('a')) as HTMLElement[];
        buttons.forEach((btn: HTMLElement, index: number) => {
          if (!this.animatedElements.has(btn)) {
            this.animatedElements.add(btn);
            // Stagger progressif: 0.15s entre chaque bouton (comme l'exemple web)
            this.animateElement(btn, {
              delay: paragraphs.length * 0.2 + (index * 0.15),
              blur: 20,
              scale: 0.96,
              duration: 1.1
            });
          }
        });
      }
    }
  }

  /**
   * Animation de texte lettre par lettre avec défloutage (comme l'exemple web)
   * Enveloppe chaque lettre dans un span et les anime progressivement
   */
  private textLetterByLetter(
    element: HTMLElement,
    options: { delay?: number; blur?: number; duration?: number; stagger?: number } = {}
  ): void {
    if (!element) return;

    const delay = (options.delay ?? 0) * 1000;
    const duration = options.duration ?? 0.7;
    const blur = options.blur ?? 12;
    const stagger = (options.stagger ?? 0.025) * 1000; // Convertir en ms

    // IMPORTANT:
    // The H1 container itself must NOT stay blurred (blur is applied per-letter).
    // Force-clear any CSS filter on the H1 before we begin.
    element.style.filter = 'none';

    // Rendre l'élément visible temporairement pour traiter le DOM
    const originalVisibility = element.style.visibility;
    const originalOpacity = element.style.opacity;
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    
    // Envelopper chaque lettre dans un span
    const letters: HTMLElement[] = [];

    const processNode = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text.length > 0) {
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
              span.style.filter = `blur(${blur}px)`;
              span.style.transition = 'none';
              span.style.willChange = 'opacity, filter';
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

    // Traiter tous les nœuds enfants
    const children = Array.from(element.childNodes);
    children.forEach(child => processNode(child));

    // Forcer un reflow pour que les spans soient créés
    element.offsetHeight;

    // Cacher le parent maintenant que les spans sont créés
    element.style.opacity = '0';
    element.style.visibility = 'hidden';
    element.offsetHeight; // Force reflow

    if (letters.length > 0) {
      // Rendre le parent visible immédiatement pour que les lettres soient visibles
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      element.style.filter = 'none';
      element.offsetHeight; // Force reflow

      // Animer chaque lettre avec stagger progressif
      letters.forEach((letter, index) => {
        if (!letter || !letter.parentNode) return;
        
        const letterDelay = delay + (index * stagger);
        
        setTimeout(() => {
          if (!letter || !letter.parentNode) return;
          
          // Forcer un reflow avant d'appliquer la transition
          letter.offsetHeight;
          
          // Appliquer la transition et animer
          letter.style.transition = `opacity ${duration}s cubic-bezier(0.33, 1, 0.68, 1), filter ${duration}s cubic-bezier(0.33, 1, 0.68, 1)`;
          
          requestAnimationFrame(() => {
            if (letter && letter.parentNode) {
              letter.style.opacity = '1';
              letter.style.filter = 'blur(0px)';
            }
          });

          // Nettoyer will-change après l'animation
          setTimeout(() => {
            if (letter) {
              letter.style.willChange = 'auto';
            }
          }, duration * 1000 + 100);
        }, letterDelay);
      });
    } else {
      // Fallback: animation simple si pas de lettres
      setTimeout(() => {
        if (element) {
          element.style.visibility = 'visible';
          this.animateElement(element, {
            delay: 0,
            blur: blur,
            scale: 0.95,
            duration: duration
          });
        }
      }, delay);
    }
  }

  /**
   * Animation complète d'un élément (deblur fluide - identique à l'exemple web)
   * L'élément est déjà caché par hideAllElementsImmediately()
   * Utilise power2.out easing comme l'exemple web
   */
  private animateElement(
    element: HTMLElement,
    options: { delay?: number; blur?: number; scale?: number; duration?: number } = {}
  ): void {
    if (!element) return;

    const delay = (options.delay ?? 0) * 1000; // Convertir en ms
    const duration = options.duration ?? 1.2;
    const blur = options.blur ?? 20;
    const scale = options.scale ?? 0.95;

    // S'assurer que l'élément est bien caché (au cas où)
    element.style.transition = 'none';
    element.style.opacity = '0';
    element.style.filter = `blur(${blur}px)`;
    element.style.transform = `scale(${scale}) translateZ(0)`;
    element.style.visibility = 'hidden';
    element.style.willChange = 'opacity, filter, transform';
    element.offsetHeight; // Force reflow

    // Attendre le délai puis animer (power2.out easing comme l'exemple web)
    setTimeout(() => {
      if (!element) return;

      // Rendre visible avant l'animation
      element.style.visibility = 'visible';
      element.offsetHeight; // Force reflow

      // Appliquer la transition avec power2.out easing (cubic-bezier équivalent)
      // power2.out ≈ cubic-bezier(0.33, 1, 0.68, 1)
      element.style.transition = `opacity ${duration}s cubic-bezier(0.33, 1, 0.68, 1), filter ${duration}s cubic-bezier(0.33, 1, 0.68, 1), transform ${duration}s cubic-bezier(0.33, 1, 0.68, 1)`;
      
      requestAnimationFrame(() => {
        if (element) {
          element.style.opacity = '1';
          element.style.filter = 'blur(0px)';
          element.style.transform = 'scale(1) translateZ(0)';
        }
      });

      // Nettoyer will-change après l'animation
      setTimeout(() => {
        if (element) {
          element.style.willChange = 'auto';
        }
      }, duration * 1000 + 100);
    }, delay);
  }

  private waitForLoaderThenStart(): void {
    const start = () => {
      // Start animations immediately (no delay)
      this.startHeroAnimations();
      this.scheduleHeroCardRevealAfterModelEntry();
      // Parallax removed: it caused hero text to not reliably return to its original position
      // when scrolling back up (stale transforms). Keep the hero layout stable.
    };

    // If loader already removed, start immediately.
    if (typeof document !== 'undefined' && !document.getElementById('page-loader')) {
      start();
      return;
    }

    // Otherwise wait for global event fired from main.ts.
    const onHidden = () => start();
    window.addEventListener('app-loader-hidden', onHidden, { once: true } as any);

    // Safety timeout in case event is missed (reduced for faster fallback)
    window.setTimeout(() => {
      window.removeEventListener('app-loader-hidden', onHidden as any);
      start();
    }, 1200);
  }

  /**
   * Reveal the hero card glass AFTER the Three.js entry animation finishes.
   * This keeps the model as the first "wow" and then the UI panel appears cleanly.
   */
  private scheduleHeroCardRevealAfterModelEntry(): void {
    const cardEl = this.heroParallax?.nativeElement as HTMLElement | undefined;
    if (!cardEl || typeof window === 'undefined') return;

    // Reset (in case of route reuse)
    cardEl.classList.remove('is-card-revealed');
    if (this.cardRevealTimer !== null) {
      window.clearTimeout(this.cardRevealTimer);
      this.cardRevealTimer = null;
    }

    // Read actual inputs from the Three component instance (set in template).
    const entryDelay = Number((this.threeComponent as any)?.entryDelay ?? 0) || 0;
    const entryDuration = Number((this.threeComponent as any)?.entryDuration ?? 0) || 0;
    // Start during the last part of the entry (so it appears "with" the model, not after).
    const durMs = Math.max(0, entryDuration * 1000);
    const startFrac = 0.45; // start earlier (45% into the entry animation)
    const startAtMs = Math.max(0, entryDelay * 1000 + durMs * startFrac);
    this.cardRevealTimer = window.setTimeout(() => {
      cardEl.classList.add('is-card-revealed');
      this.cardRevealTimer = null;
    }, startAtMs);
  }

}
