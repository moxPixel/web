import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav aria-label="breadcrumb" class="mb-6">
      <ol class="flex items-center gap-2 text-sm text-secondary/70 dark:text-accent/70" itemscope itemtype="https://schema.org/BreadcrumbList">
        <li *ngFor="let item of items; let i = index; let last = last" class="flex items-center gap-2" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a 
            *ngIf="!last && item.url" 
            [routerLink]="item.url"
            class="hover:text-primary-500 dark:hover:text-ns-green-light transition-colors"
            itemprop="item"
          >
            <span itemprop="name">{{ item.label }}</span>
          </a>
          <span *ngIf="last" class="font-semibold text-secondary dark:text-accent" itemprop="name">{{ item.label }}</span>
          <span *ngIf="!last" class="text-secondary/40 dark:text-accent/40">/</span>
          <meta itemprop="position" [content]="i + 1" />
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
