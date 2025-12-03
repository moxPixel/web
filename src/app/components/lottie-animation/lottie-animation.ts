import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

declare const lottie: any;

@Component({
  selector: 'app-lottie-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lottie-animation.html',
  styleUrl: './lottie-animation.css',
})
export class LottieAnimationComponent implements OnInit, OnDestroy {
  @ViewChild('lottieContainer', { static: true }) lottieContainer!: ElementRef<HTMLDivElement>;

  @Input() animationPath: string = '';
  @Input() width: number = 400;
  @Input() height: number = 400;
  @Input() autoplay: boolean = true;
  @Input() loop: boolean = true;
  @Input() speed: number = 1.0;
  @Input() showBubble: boolean = false;
  @Input() bubbleActive: boolean = false;
  @Input() bubbleSize: number = 140;

  private anim: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAnimation();
    }
  }

  ngOnDestroy(): void {
    this.destroyAnimation();
  }

  private loadAnimation(): void {
    if (this.anim) {
      this.destroyAnimation();
    }

    if (!this.animationPath || typeof lottie === 'undefined') return;

    this.anim = lottie.loadAnimation({
      container: this.lottieContainer.nativeElement,
      renderer: 'svg',
      loop: this.loop,
      autoplay: this.autoplay,
      path: this.animationPath,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
      }
    });

    if (this.anim) {
      this.anim.setSpeed(this.speed);
    }
  }

  private destroyAnimation(): void {
    if (this.anim) {
      this.anim.destroy();
      this.anim = null;
    }
  }

  public play(): void {
    this.anim?.play();
  }

  public pause(): void {
    this.anim?.pause();
  }

  public stop(): void {
    this.anim?.stop();
  }
}
