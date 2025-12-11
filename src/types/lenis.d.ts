declare module '@studio-freight/lenis' {
  export interface LenisOptions {
    duration?: number;
    easing?: (t: number) => number;
    orientation?: 'vertical' | 'horizontal';
    gestureOrientation?: 'vertical' | 'horizontal' | 'both';
    smooth?: boolean;
    smoothTouch?: boolean;
    smoothWheel?: boolean;
    touchMultiplier?: number;
    wheelMultiplier?: number;
    infinite?: boolean;
  }

  export default class Lenis {
    constructor(options?: LenisOptions);
    raf(time: number): void;
    on(event: 'scroll', callback: (e: { scroll: number; velocity: number; direction: 1 | -1; progress: number }) => void): void;
    off(event: 'scroll', callback: (...args: any[]) => void): void;
    scrollTo(
      target: number | string | HTMLElement,
      options?: { offset?: number; duration?: number; easing?: (t: number) => number; immediate?: boolean }
    ): void;
    destroy(): void;
  }
}
