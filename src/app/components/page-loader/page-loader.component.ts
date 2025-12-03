import { Component, PLATFORM_ID, Inject, Output, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-loader',
  imports: [CommonModule],
  templateUrl: './page-loader.component.html',
  styleUrl: './page-loader.component.css',
  standalone: true
})
export class PageLoaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() progress = 0;
  @Output() loaderComplete = new EventEmitter<void>();

  isExiting = false;
  private isBrowser: boolean;
  private overflowBackup = '';
  private completionTimeout?: ReturnType<typeof setTimeout>;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.overflowBackup = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('progress' in changes) {
      const value = Number(changes['progress'].currentValue ?? 0);
      if (value >= 100 && !this.isExiting) {
        this.isExiting = true;
        this.completionTimeout = setTimeout(() => this.finish(), 500);
      }
    }
  }

  ngOnDestroy(): void {
    this.restoreScroll();
    if (this.completionTimeout) {
      clearTimeout(this.completionTimeout);
    }
  }

  private finish(): void {
    this.restoreScroll();
    this.loaderComplete.emit();
  }

  private restoreScroll(): void {
    if (this.isBrowser) {
      document.body.style.overflow = this.overflowBackup || '';
    }
  }
}
