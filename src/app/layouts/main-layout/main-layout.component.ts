import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { CookieConsentComponent } from '../../components/cookie-consent/cookie-consent.component';
import { NotificationCenterComponent } from '../../components/notification-center/notification-center.component';
import { EvaChat } from '../../eva-chat/eva-chat';
import { pageTransition } from '../../animations/page-transition.animation';
import { filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    CookieConsentComponent,
    NotificationCenterComponent,
    EvaChat
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  animations: [pageTransition]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private domContentReadyHandler?: () => void;
  routeAnimationState = '';
  private destroy$ = new Subject<void>();

  constructor(
    private gsapScrollService: GsapScrollService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Écouter les changements de route pour l'animation
    // Cette transition s'applique automatiquement à toutes les pages
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Forcer un changement d'état pour déclencher l'animation
        // Utiliser un timestamp pour garantir que l'état change toujours
        const url = event.urlAfterRedirects || this.router.url || '/';
        this.routeAnimationState = `${url}-${Date.now()}`;
        
        // Gérer le scroll pendant la transition
        this.ngZone.runOutsideAngular(() => {
          // Bloquer le scroll pendant la transition
          document.body.style.overflow = 'hidden';
          
          // Restaurer le scroll et rafraîchir GSAP après la transition
          setTimeout(() => {
            document.body.style.overflow = '';
            requestAnimationFrame(() => {
              this.gsapScrollService.refresh();
              requestAnimationFrame(() => {
                this.gsapScrollService.refresh();
              });
            });
          }, 450); // Après la fin de l'animation (400ms + marge)
        });
      });

    // Initialiser l'état avec l'URL actuelle
    const initialUrl = this.router.url || '/';
    this.routeAnimationState = `${initialUrl}-${Date.now()}`;

    this.ngZone.runOutsideAngular(() => {
      const initScroll = () => {
        this.gsapScrollService.initSimpleSmoothScroll();
        // Attendre que tous les composants soient initialisés avant de rafraîchir
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Double RAF pour s'assurer que tous les composants sont prêts
            this.gsapScrollService.refresh();
            // Forcer un refresh supplémentaire après un court délai pour capturer tous les ScrollTriggers
            setTimeout(() => {
              this.gsapScrollService.refresh();
            }, 100);
          });
        });
      };

      if (document.readyState === 'loading') {
        this.domContentReadyHandler = () => {
          initScroll();
        };
        document.addEventListener('DOMContentLoaded', this.domContentReadyHandler, { once: true });
      } else {
        initScroll();
      }
    });

    // Recharger pour repasser par index/loader quand on change de layout (site <-> backoffice) ou vers account/enrollments
    this.router.events
      .pipe(filter(ev => ev instanceof NavigationStart))
      .subscribe((ev: NavigationStart) => {
        const target = ev.url || '';
        const currentUrl = this.router.url || '';
        const isCurrentBo = currentUrl.startsWith('/bo');
        const isTargetBo = target.startsWith('/bo');
        const isTargetAccount = target.startsWith('/account/enrollments');
        const isCurrentAccount = currentUrl.startsWith('/account/enrollments');
        
        // Forcer un reload complet pour ré-afficher le loader index dans ces cas :
        // 1. Passage entre backoffice et site public
        // 2. Navigation vers /account/enrollments depuis une autre page
        // 3. Navigation depuis /account/enrollments vers une autre page
        if (isCurrentBo !== isTargetBo || 
            (isTargetAccount && !isCurrentAccount) || 
            (isCurrentAccount && !isTargetAccount)) {
          window.location.href = target;
        }
      });
  }

  ngOnDestroy(): void {
    if (this.domContentReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domContentReadyHandler);
      this.domContentReadyHandler = undefined;
    }

    this.gsapScrollService.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

