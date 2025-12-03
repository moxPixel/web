import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { CookieConsentComponent } from '../../components/cookie-consent/cookie-consent.component';
import { NotificationCenterComponent } from '../../components/notification-center/notification-center.component';
import { EvaChat } from '../../eva-chat/eva-chat';

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
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private domContentReadyHandler?: () => void;

  constructor(
    private gsapScrollService: GsapScrollService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
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
}

