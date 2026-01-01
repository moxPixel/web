import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

export type AnchoredPanelPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

@Component({
  selector: 'app-anchored-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anchored-panel.component.html',
  styleUrl: './anchored-panel.component.css',
})
export class AnchoredPanelComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() open = false;
  @Input() anchor: HTMLElement | null = null;
  @Input() width = 340;
  @Input() preferredPlacement: AnchoredPanelPlacement = 'bottom-start';
  @Input() offset = 8;
  @Input() viewportPadding = 12;
  @Input() closeOnBackdrop = true;
  @Input() panelClass = '';

  @Output() backdropClick = new EventEmitter<void>();
  @Output() escapeKey = new EventEmitter<void>();

  @ViewChild('panelEl') panelElRef?: ElementRef<HTMLElement>;

  top = 0;
  left = 0;
  private rafId?: number;
  private scrollListener?: () => void;
  private resizeListener?: () => void;
  private clickOutsideListener?: (event: MouseEvent) => void;
  private positionUpdateTimeout?: number;
  private lastPosition: { top: number; left: number } | null = null;
  private lastAnchorRect: DOMRect | null = null;
  private isPositioning = false;
  private stablePlacement: AnchoredPanelPlacement | null = null;
  private estimatedHeight = 300;

  ngAfterViewInit(): void {
    if (this.open) {
      this.updatePosition();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] || changes['anchor'] || changes['width'] || changes['preferredPlacement']) {
      if (this.open && this.anchor) {
        this.isPositioning = true;
        this.stablePlacement = null; // Reset placement on new open
        this.lastAnchorRect = null;
        // Position immediately with estimated dimensions
        this.positionImmediate();
        // Refine position after DOM is ready (single update, no multiple RAFs)
        this.schedulePositionUpdate();
        // Setup click-outside listener
        this.setupClickOutsideListener();
      } else {
        this.removeListeners();
        this.lastPosition = null;
        this.lastAnchorRect = null;
        this.stablePlacement = null;
        this.isPositioning = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.cancelRaf();
    this.cancelTimeout();
    this.removeListeners();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) {
      this.escapeKey.emit();
    }
  }

  private setupClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      return; // Already set up
    }

    this.clickOutsideListener = (event: MouseEvent) => {
      if (!this.open || !this.closeOnBackdrop) {
        return;
      }

      const panel = this.panelElRef?.nativeElement;
      const anchor = this.anchor;

      // Check if click is outside both panel and anchor
      if (
        panel &&
        anchor &&
        !panel.contains(event.target as Node) &&
        !anchor.contains(event.target as Node)
      ) {
        this.backdropClick.emit();
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('click', this.clickOutsideListener, true);
  }

  private positionImmediate(): void {
    // Position immediately with estimated dimensions (before DOM is ready)
    if (!this.anchor) return;

    const anchorRect = this.anchor.getBoundingClientRect();
    this.lastAnchorRect = anchorRect;
    const panelWidth = this.width || 340;
    const panelHeight = this.estimatedHeight;

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const pad = this.viewportPadding;
    const gap = this.offset;

    // Use stable placement if available, otherwise preferred
    const placement = this.stablePlacement || this.preferredPlacement;
    let pos = this.computePosition(placement, anchorRect, panelWidth, panelHeight, gap);
    let bestPlacement = placement;

    // If it doesn't fit vertically, try alternatives
    if (pos.top < pad || pos.top + panelHeight > vpH - pad) {
      const alternatives: AnchoredPanelPlacement[] = ['bottom-end', 'top-start', 'top-end'];
      for (const alt of alternatives) {
        const candidate = this.computePosition(alt, anchorRect, panelWidth, panelHeight, gap);
        if (candidate.top >= pad && candidate.top + panelHeight <= vpH - pad) {
          pos = candidate;
          bestPlacement = alt;
          break;
        }
      }
    }

    // Store stable placement for consistency
    this.stablePlacement = bestPlacement;

    // Clamp to viewport
    const newTop = Math.max(pad, Math.min(pos.top, vpH - panelHeight - pad));
    const newLeft = Math.max(pad, Math.min(pos.left, vpW - panelWidth - pad));

    this.top = newTop;
    this.left = newLeft;
    this.lastPosition = { top: newTop, left: newLeft };
  }

  private schedulePositionUpdate(): void {
    this.cancelRaf();
    this.cancelTimeout();
    
    // Use a single RAF chain to ensure DOM is ready
    this.rafId = requestAnimationFrame(() => {
      this.rafId = requestAnimationFrame(() => {
        this.recalcPosition();
        this.rafId = undefined;
        this.isPositioning = false;
      });
    });
  }

  private updatePosition(): void {
    if (this.isPositioning) return; // Prevent concurrent updates
    
    this.cancelRaf();
    this.cancelTimeout();
    
    // Debounce rapid updates
    this.positionUpdateTimeout = window.setTimeout(() => {
      this.rafId = requestAnimationFrame(() => {
        this.recalcPosition();
        this.rafId = undefined;
      });
      this.positionUpdateTimeout = undefined;
    }, 16); // ~60fps throttle
  }

  private recalcPosition(): void {
    if (!this.open || !this.anchor) {
      return;
    }

    const panel = this.panelElRef?.nativeElement;
    if (!panel) {
      // Retry once after a short delay if panel isn't ready yet
      if (!this.positionUpdateTimeout) {
        this.positionUpdateTimeout = window.setTimeout(() => {
          this.positionUpdateTimeout = undefined;
          this.recalcPosition();
        }, 50);
      }
      return;
    }

    const anchorRect = this.anchor.getBoundingClientRect();
    const panelWidth = this.width || panel.offsetWidth || 340;
    const actualHeight = panel.offsetHeight || this.estimatedHeight;
    
    // Update estimated height for future calculations
    if (actualHeight > 0 && actualHeight !== this.estimatedHeight) {
      this.estimatedHeight = actualHeight;
    }

    // Check if anchor moved significantly (scroll detection)
    const anchorMoved = this.lastAnchorRect && (
      Math.abs(anchorRect.top - this.lastAnchorRect.top) > 1 ||
      Math.abs(anchorRect.left - this.lastAnchorRect.left) > 1 ||
      Math.abs(anchorRect.bottom - this.lastAnchorRect.bottom) > 1 ||
      Math.abs(anchorRect.right - this.lastAnchorRect.right) > 1
    );

    this.lastAnchorRect = anchorRect;

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const pad = this.viewportPadding;
    const gap = this.offset;

    // Use stable placement if available, otherwise preferred
    const placement = this.stablePlacement || this.preferredPlacement;
    let pos = this.computePosition(placement, anchorRect, panelWidth, actualHeight, gap);
    let bestPlacement = placement;

    // If it doesn't fit vertically, try alternatives
    if (pos.top < pad || pos.top + actualHeight > vpH - pad) {
      const alternatives: AnchoredPanelPlacement[] = ['bottom-end', 'top-start', 'top-end'];
      for (const alt of alternatives) {
        const candidate = this.computePosition(alt, anchorRect, panelWidth, actualHeight, gap);
        if (candidate.top >= pad && candidate.top + actualHeight <= vpH - pad) {
          pos = candidate;
          bestPlacement = alt;
          break;
        }
      }
    }

    // Store stable placement for consistency
    this.stablePlacement = bestPlacement;

    // Clamp to viewport
    const newTop = Math.max(pad, Math.min(pos.top, vpH - actualHeight - pad));
    const newLeft = Math.max(pad, Math.min(pos.left, vpW - panelWidth - pad));

    // Only update if position changed significantly or anchor moved
    const threshold = anchorMoved ? 0.5 : 2; // Smaller threshold if anchor moved (scroll)
    if (
      !this.lastPosition ||
      anchorMoved ||
      Math.abs(this.top - newTop) > threshold ||
      Math.abs(this.left - newLeft) > threshold
    ) {
      this.top = newTop;
      this.left = newLeft;
      this.lastPosition = { top: newTop, left: newLeft };
    }

    // Setup listeners after first successful position
    if (!this.scrollListener) {
      this.setupListeners();
    }
  }

  private computePosition(
    placement: AnchoredPanelPlacement,
    anchorRect: DOMRect,
    panelWidth: number,
    panelHeight: number,
    gap: number
  ): { top: number; left: number } {
    const isBottom = placement.startsWith('bottom');
    const isStart = placement.endsWith('start');

    const top = isBottom ? anchorRect.bottom + gap : anchorRect.top - gap - panelHeight;
    const left = isStart ? anchorRect.left : anchorRect.right - panelWidth;

    return { top, left };
  }

  private setupListeners(): void {
    this.scrollListener = () => {
      if (this.open && !this.isPositioning) {
        this.updatePosition();
      }
    };
    this.resizeListener = () => {
      if (this.open && !this.isPositioning) {
        // On resize, recalculate immediately (no debounce)
        this.cancelRaf();
        this.cancelTimeout();
        this.rafId = requestAnimationFrame(() => {
          this.recalcPosition();
          this.rafId = undefined;
        });
      }
    };
    window.addEventListener('scroll', this.scrollListener, { passive: true });
    window.addEventListener('resize', this.resizeListener, { passive: true });
  }

  private removeListeners(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = undefined;
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = undefined;
    }
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
      this.clickOutsideListener = undefined;
    }
  }

  private cancelRaf(): void {
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  private cancelTimeout(): void {
    if (this.positionUpdateTimeout !== undefined) {
      clearTimeout(this.positionUpdateTimeout);
      this.positionUpdateTimeout = undefined;
    }
  }
}
