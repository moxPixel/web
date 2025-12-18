import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { AuthApiService } from '../../services/api/auth-api.service';
import { ThemeService } from '../../services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-backoffice-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule, TooltipDirective],
  templateUrl: './backoffice-sidebar.component.html',
  styleUrls: ['./backoffice-sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackofficeSidebarComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
    private authService: AuthApiService
  ) {}

  ngOnInit(): void {
    this.themeService.isDark$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark) => {
        this.isDarkMode = isDark;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDarkMode(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}

