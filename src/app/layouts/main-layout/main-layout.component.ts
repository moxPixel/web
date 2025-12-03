import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { CookieConsentComponent } from '../../components/cookie-consent/cookie-consent.component';
import { NotificationCenterComponent } from '../../components/notification-center/notification-center.component';
import { EvaChat } from '../../eva-chat/eva-chat';
import { PageLoaderComponent } from '../../components/page-loader/page-loader.component';
import { AnimationGateService } from '../../services/animation-gate.service';
import { PageLoaderService } from '../../services/page-loader.service';

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
    EvaChat,
    PageLoaderComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private domContentReadyHandler?: () => void;
  public showLoader = true;
  public loaderProgress$;

  constructor(
    private gsapScrollService: GsapScrollService,
    private ngZone: NgZone,
    private animationGate: AnimationGateService,
    private pageLoaderService: PageLoaderService
  ) {
    this.loaderProgress$ = this.pageLoaderService.progress$;
  }

  ngOnInit(): void {
    // Bloquer les animations tant que le loader est visible
    this.animationGate.lock();

    this.pageLoaderService.initialize().catch((error) => {
      console.warn('[MainLayout] loader initialize failed', error);
    });

    this.ngZone.runOutsideAngular(() => {
      const initScroll = () => {
        this.gsapScrollService.initSimpleSmoothScroll();
        requestAnimationFrame(() => this.gsapScrollService.refresh());
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
  }

  ngOnDestroy(): void {
    if (this.domContentReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domContentReadyHandler);
      this.domContentReadyHandler = undefined;
    }

    this.gsapScrollService.cleanup();
  }

  onLoaderComplete(): void {
    this.showLoader = false;
    this.animationGate.release();
  }
}

