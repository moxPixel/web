import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Training } from '../../interfaces/training.interface';
import { TrainingsService } from '../../services/trainings/trainings.service';
import { UploadApiService } from '../../services/api/upload-api.service';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiCardDirective } from '../../ui/ui-card.directive';

@Component({
  selector: 'app-training-suggestions',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiCardDirective],
  templateUrl: './training-suggestions.component.html',
  styleUrl: './training-suggestions.component.css'
})
export class TrainingSuggestionsComponent implements OnInit, OnDestroy {
  @Input() currentTraining?: Training;
  @Input() excludeSlug?: string;

  suggestions: Training[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private trainings: TrainingsService,
    private upload: UploadApiService
  ) {}

  ngOnInit(): void {
    this.loadSuggestions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSuggestions(): void {
    this.trainings
      .getTrainings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allTrainings) => {
          let filtered = allTrainings;

          // Exclude current training
          if (this.excludeSlug) {
            filtered = filtered.filter((t) => t.slug !== this.excludeSlug);
          }

          // If we have current training, prioritize by category
          if (this.currentTraining) {
            const sameCategory = filtered.filter((t) => t.category === this.currentTraining!.category);
            const otherCategory = filtered.filter((t) => t.category !== this.currentTraining!.category);
            
            // Take 3 from same category, then fill with others
            this.suggestions = [...sameCategory.slice(0, 3), ...otherCategory].slice(0, 4);
          } else {
            // Just take first 4
            this.suggestions = filtered.slice(0, 4);
          }
        },
        error: () => {
          this.suggestions = [];
        }
      });
  }

  getImageUrl(path?: string): string {
    if (!path) return '/assets/images/img/p1.jpg';
    return this.upload.getImageUrlFromPath(path);
  }
}

