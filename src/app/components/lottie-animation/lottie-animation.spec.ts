import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LottieAnimation } from './lottie-animation';

describe('LottieAnimation', () => {
  let component: LottieAnimation;
  let fixture: ComponentFixture<LottieAnimation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LottieAnimation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LottieAnimation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
