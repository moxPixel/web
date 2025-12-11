import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  Renderer2,
  inject
} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tooltipText: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  
  private tooltipElement: HTMLElement | null = null;
  private renderer = inject(Renderer2);
  private el = inject(ElementRef);

  @HostListener('mouseenter') onMouseEnter(): void {
    if (!this.tooltipText || this.tooltipText.trim() === '') return;
    this.showTooltip();
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.hideTooltip();
  }

  private showTooltip(): void {
    // Créer l'élément tooltip
    this.tooltipElement = this.renderer.createElement('div');
    
    // Ajouter les classes Tailwind
    const isDark = document.documentElement.classList.contains('dark');
    const baseClasses = [
      'fixed',
      'z-[99999]',
      'px-3',
      'py-2',
      'text-xs',
      'rounded-lg',
      'pointer-events-none',
      'whitespace-nowrap',
      'transition-opacity',
      'duration-200',
      'shadow-lg'
    ];
    
    // Couleurs adaptées au thème
    if (isDark) {
      baseClasses.push('bg-white', 'text-secondary');
    } else {
      baseClasses.push('bg-secondary', 'text-white');
    }
    
    baseClasses.forEach(className => {
      this.renderer.addClass(this.tooltipElement, className);
    });
    
    // Ajouter le texte
    const text = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltipElement, text);
    
    // Ajouter au body
    this.renderer.appendChild(document.body, this.tooltipElement);
    
    // Positionner le tooltip
    this.positionTooltip();
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const spacing = 8; // Espace entre l'élément et le tooltip

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - spacing;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + spacing;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + spacing;
        break;
    }

    // S'assurer que le tooltip reste dans la fenêtre
    const maxLeft = window.innerWidth - tooltipRect.width - 10;
    const maxTop = window.innerHeight - tooltipRect.height - 10;
    
    left = Math.max(10, Math.min(left, maxLeft));
    top = Math.max(10, Math.min(top, maxTop));

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  private hideTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  ngOnDestroy(): void {
    this.hideTooltip();
  }
}

