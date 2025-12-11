import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { AiApiService, AiGenerateTrainingInput } from '../../../services/api/ai-api.service';
import { Training } from '../../core/models/training.model';

export interface AiGenerateDialogData {
  // Pas de données initiales nécessaires
}

@Component({
  selector: 'app-ai-generate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
  ],
  templateUrl: './ai-generate-dialog.component.html',
  styleUrls: ['./ai-generate-dialog.component.css'],
})
export class AiGenerateDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private aiService = inject(AiApiService);
  private dialogRef = inject(MatDialogRef<AiGenerateDialogComponent>);
  private data = inject<AiGenerateDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  generating = false;
  error = '';

  // Options pour les selects
  levels = [
    { value: 'initiation', label: 'Initiation' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' },
    { value: 'expert', label: 'Expert' },
  ];

  audienceTypes = [
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'monter-en-competence', label: 'Monter en compétence' },
    { value: 'reconversion', label: 'Reconversion' },
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      trainingTitle: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      rncpCode: [''],
      rncpTitle: [''],
      durationDays: [null],
      totalHours: [null],
      level: [''],
      audienceType: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.generating) {
      return;
    }

    this.generating = true;
    this.error = '';

    const input: AiGenerateTrainingInput = {
      trainingTitle: this.form.get('trainingTitle')?.value,
      rncpCode: this.form.get('rncpCode')?.value || undefined,
      rncpTitle: this.form.get('rncpTitle')?.value || undefined,
      durationDays: this.form.get('durationDays')?.value || undefined,
      totalHours: this.form.get('totalHours')?.value || undefined,
      level: this.form.get('level')?.value || undefined,
      audienceType: this.form.get('audienceType')?.value || undefined,
    };

    this.aiService.generateTraining(input).subscribe({
      next: (generatedTraining) => {
        this.generating = false;
        this.dialogRef.close(generatedTraining);
      },
      error: (error) => {
        console.error('Error generating training:', error);
        this.generating = false;
        this.error = error.message || 'Une erreur est survenue lors de la génération';
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

