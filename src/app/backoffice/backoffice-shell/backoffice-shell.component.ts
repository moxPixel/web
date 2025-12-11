import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { BackofficeSidebarComponent } from '../../components/backoffice-sidebar/backoffice-sidebar.component';
import { pageTransition } from '../../animations/page-transition.animation';
import { filter } from 'rxjs/operators';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';

@Component({
  selector: 'app-backoffice-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, BackofficeSidebarComponent],
  templateUrl: './backoffice-shell.component.html',
  styleUrls: ['./backoffice-shell.component.css'],
  animations: [pageTransition]
})
export class BackofficeShellComponent implements OnInit, OnDestroy {
  routeAnimationState = '';
  private domContentReadyHandler?: () => void;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private gsapScrollService: GsapScrollService,
    private pageLoaderInline: PageLoaderInlineService
  ) {}

  ngOnInit(): void {
    // Écouter les changements de route pour l'animation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects || this.router.url || '/';
        this.routeAnimationState = `${url}-${Date.now()}`;
        
        // Gérer le scroll pendant la transition
        this.ngZone.runOutsideAngular(() => {
          // Bloquer le scroll pendant la transition
          document.body.style.overflow = 'hidden';
          
          // Restaurer le scroll après la transition
          setTimeout(() => {
            document.body.style.overflow = '';
            requestAnimationFrame(() => {
              this.gsapScrollService.refresh();
              requestAnimationFrame(() => this.gsapScrollService.refresh());
            });
          }, 450); // Après la fin de l'animation (400ms + marge)
        });
      });

    // Recharger pour repasser par index/loader quand on change de layout (bo <-> site)
    this.router.events
      .pipe(filter(ev => ev instanceof NavigationStart))
      .subscribe((ev: NavigationStart) => {
        const target = ev.url || '';
        const isCurrentBo = (this.router.url || '').startsWith('/bo');
        const isTargetBo = target.startsWith('/bo');
        if (isCurrentBo !== isTargetBo) {
          window.location.href = target;
        }
      });

    // Initialiser l'état avec l'URL actuelle
    const initialUrl = this.router.url || '/';
    this.routeAnimationState = `${initialUrl}-${Date.now()}`;

    // Initialiser smooth scroll / ScrollTrigger refresh après chargement
    this.ngZone.runOutsideAngular(() => {
      const initScroll = () => {
        this.gsapScrollService.initSimpleSmoothScroll();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.gsapScrollService.refresh();
            setTimeout(() => this.gsapScrollService.refresh(), 100);
          });
        });
      };

      if (document.readyState === 'loading') {
        this.domContentReadyHandler = () => initScroll();
        document.addEventListener('DOMContentLoaded', this.domContentReadyHandler, { once: true });
      } else {
        initScroll();
      }
    });

    // S'assurer que la transition ne démarre qu'après disparition du loader inline
    this.pageLoaderInline.loaderHidden$
      .pipe(filter(Boolean))
      .subscribe(() => {
        requestAnimationFrame(() => this.gsapScrollService.refresh());
      });
  }

  ngOnDestroy(): void {
    if (this.domContentReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domContentReadyHandler);
      this.domContentReadyHandler = undefined;
    }
    this.gsapScrollService.cleanup();
  }
}
