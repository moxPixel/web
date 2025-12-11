import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiFieldAssistantApiService, FieldAssistantAction, FieldAssistantInput } from '../../../services/api/ai-field-assistant-api.service';

export interface FieldAssistantMenuData {
  fieldName: string;
  fieldValue: string;
  context?: {
    level?: string;
    trainingType?: string;
    category?: string;
    title?: string;
  };
}

@Component({
  selector: 'app-field-assistant-menu',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatRippleModule, MatProgressSpinnerModule],
  template: `
    <div class="p-6 bg-background-1 dark:bg-background-8">
      <h2 class="text-xl font-bold text-secondary dark:text-accent mb-4 flex items-center gap-2">
        <mat-icon class="!w-6 !h-6 !text-[24px] text-primary-500 dark:text-ns-green-light">auto_fix_high</mat-icon>
        Assistant IA
      </h2>

      <p class="text-sm text-secondary/70 dark:text-accent/70 mb-6">
        Choisissez une action pour améliorer votre contenu :
      </p>

      <!-- Message d'erreur -->
      <div *ngIf="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Résultat -->
      <div *ngIf="result && !loading" class="mb-6 p-4 bg-background-2 dark:bg-background-6 border border-stroke-2 dark:border-stroke-6 rounded-lg">
        <div class="flex items-start gap-3 mb-3">
          <mat-icon class="!w-5 !h-5 !text-[20px] text-green-500 mt-0.5">check_circle</mat-icon>
          <div class="flex-1">
            <p class="font-semibold text-secondary dark:text-accent mb-2">Résultat :</p>
            <p class="text-sm text-secondary dark:text-accent bg-white dark:bg-background-8 p-3 rounded border border-stroke-2 dark:border-stroke-6">
              {{ result.improved }}
            </p>
          </div>
        </div>

        <!-- Suggestions multiples -->
        <div *ngIf="result.suggestions && result.suggestions.length > 0" class="mt-4">
          <p class="font-semibold text-secondary dark:text-accent mb-2 text-sm">Suggestions alternatives :</p>
          <div class="space-y-2">
            <button
              *ngFor="let suggestion of result.suggestions; let i = index"
              type="button"
              (click)="selectSuggestion(suggestion)"
              class="w-full text-left p-3 text-sm bg-white dark:bg-background-8 hover:bg-background-2 dark:hover:bg-background-7 border border-stroke-2 dark:border-stroke-6 rounded transition-colors"
            >
              <span class="font-medium text-primary-500 dark:text-ns-green-light">{{i + 1}}.</span> {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- Explication -->
        <div *ngIf="result.explanation" class="mt-3 text-xs text-secondary/60 dark:text-accent/60 italic">
          {{ result.explanation }}
        </div>
      </div>

      <!-- Chargement -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-8">
        <mat-spinner diameter="40"></mat-spinner>
        <p class="text-sm text-secondary/70 dark:text-accent/70 mt-4">L'IA travaille...</p>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-2 gap-3" *ngIf="!loading && !result">
        <button
          mat-button
          type="button"
          (click)="performAction('improve')"
          class="!h-auto !py-4 !flex !flex-col !items-center !gap-2 !border !border-stroke-2 dark:!border-stroke-6 !rounded-lg hover:!bg-background-2 dark:hover:!bg-background-6 !transition-all"
          matRipple
        >
          <mat-icon class="!w-8 !h-8 !text-[32px] text-blue-500">auto_awesome</mat-icon>
          <span class="!text-sm !font-semibold !text-secondary dark:!text-accent">Améliorer</span>
          <span class="!text-xs !text-secondary/60 dark:!text-accent/60">Rendre plus professionnel</span>
        </button>

        <button
          mat-button
          type="button"
          (click)="performAction('correct')"
          class="!h-auto !py-4 !flex !flex-col !items-center !gap-2 !border !border-stroke-2 dark:!border-stroke-6 !rounded-lg hover:!bg-background-2 dark:hover:!bg-background-6 !transition-all"
          matRipple
        >
          <mat-icon class="!w-8 !h-8 !text-[32px] text-green-500">spellcheck</mat-icon>
          <span class="!text-sm !font-semibold !text-secondary dark:!text-accent">Corriger</span>
          <span class="!text-xs !text-secondary/60 dark:!text-accent/60">Orthographe & grammaire</span>
        </button>

        <button
          mat-button
          type="button"
          (click)="performAction('suggest')"
          class="!h-auto !py-4 !flex !flex-col !items-center !gap-2 !border !border-stroke-2 dark:!border-stroke-6 !rounded-lg hover:!bg-background-2 dark:hover:!bg-background-6 !transition-all"
          matRipple
        >
          <mat-icon class="!w-8 !h-8 !text-[32px] text-purple-500">lightbulb</mat-icon>
          <span class="!text-sm !font-semibold !text-secondary dark:!text-accent">Suggérer</span>
          <span class="!text-xs !text-secondary/60 dark:!text-accent/60">3 alternatives</span>
        </button>

        <button
          mat-button
          type="button"
          (click)="performAction('complete')"
          class="!h-auto !py-4 !flex !flex-col !items-center !gap-2 !border !border-stroke-2 dark:!border-stroke-6 !rounded-lg hover:!bg-background-2 dark:hover:!bg-background-6 !transition-all"
          matRipple
        >
          <mat-icon class="!w-8 !h-8 !text-[32px] text-orange-500">edit_note</mat-icon>
          <span class="!text-sm !font-semibold !text-secondary dark:!text-accent">Compléter</span>
          <span class="!text-xs !text-secondary/60 dark:!text-accent/60">Développer le contenu</span>
        </button>
      </div>

      <!-- Footer buttons -->
      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke-2 dark:border-stroke-6">
        <button
          mat-button
          type="button"
          (click)="cancel()"
          class="!px-4 !h-10 !rounded-full !text-secondary dark:!text-accent"
          matRipple
        >
          Annuler
        </button>
        <button
          *ngIf="result"
          mat-raised-button
          color="primary"
          type="button"
          (click)="apply()"
          class="!bg-secondary !text-white dark:!bg-white dark:!text-secondary !px-6 !h-10 !rounded-full"
          matRipple
        >
          Appliquer
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FieldAssistantMenuComponent {
  loading = false;
  error: string | null = null;
  result: any = null;

  constructor(
    private dialogRef: MatDialogRef<FieldAssistantMenuComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FieldAssistantMenuData,
    private aiService: AiFieldAssistantApiService
  ) {}

  performAction(action: FieldAssistantAction): void {
    this.loading = true;
    this.error = null;

    const input: FieldAssistantInput = {
      fieldName: this.data.fieldName,
      fieldValue: this.data.fieldValue,
      action,
      context: this.data.context
    };

    this.aiService.assistField(input).subscribe({
      next: (result) => {
        this.result = result;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Une erreur est survenue';
        this.loading = false;
      }
    });
  }

  selectSuggestion(suggestion: string): void {
    if (this.result) {
      this.result.improved = suggestion;
    }
  }

  apply(): void {
    if (this.result) {
      this.dialogRef.close(this.result.improved);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

