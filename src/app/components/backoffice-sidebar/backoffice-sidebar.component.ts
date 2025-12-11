import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { AuthApiService } from '../../services/api/auth-api.service';

@Component({
  selector: 'app-backoffice-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule, TooltipDirective],
  templateUrl: './backoffice-sidebar.component.html',
  styleUrls: ['./backoffice-sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackofficeSidebarComponent implements OnInit {
  isDarkMode = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private authService: AuthApiService
  ) {}

  ngOnInit(): void {
    this.checkDarkMode();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
  }

  private checkDarkMode(): void {
    if (!this.document?.documentElement || !this.document?.body) return;

    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDarkMode = storedTheme === 'dark' || (!storedTheme && prefersDark);
    this.applyTheme();
  }

  private applyTheme(): void {
    if (!this.document?.documentElement || !this.document?.body) return;

    if (this.isDarkMode) {
      this.document.documentElement.classList.add('dark');
      this.document.documentElement.style.backgroundColor = '#070b10';
      this.document.body.style.backgroundColor = '#070b10';
      localStorage.setItem('theme', 'dark');
    } else {
      this.document.documentElement.classList.remove('dark');
      this.document.documentElement.style.backgroundColor = '#ffffff';
      this.document.body.style.backgroundColor = '#ffffff';
      localStorage.setItem('theme', 'light');
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}

