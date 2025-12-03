import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationGateService {
  private ready = false;
  private queue: Array<() => void> = [];

  /**
   * Runs the callback immediately when animations are allowed,
   * otherwise queues it until release() is called.
   */
  run(fn: () => void): void {
    if (this.ready) {
      fn();
    } else {
      this.queue.push(fn);
    }
  }

  /**
   * Explicitly blocks animations (useful if the loader restarts).
   */
  lock(): void {
    this.ready = false;
  }

  /**
   * Releases every queued callback and allows new ones to run immediately.
   */
  release(): void {
    if (this.ready) {
      return;
    }

    this.ready = true;
    while (this.queue.length) {
      const fn = this.queue.shift();
      try {
        fn?.();
      } catch (error) {
        console.error('Animation gate error:', error);
      }
    }
  }
}

