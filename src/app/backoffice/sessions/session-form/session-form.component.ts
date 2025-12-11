import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SessionsService } from '../../core/services/sessions.service';
import { TrainingsService } from '../../core/services/trainings.service';
import { TrainingSession } from '../../core/models/session.model';
import { SessionStatus } from '../../../interfaces/session-api.interface';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatRippleModule, MatIconModule, MatButtonModule],
  templateUrl: './session-form.component.html',
  styleUrls: ['./session-form.component.css']
})
export class SessionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sessionsService = inject(SessionsService);
  private trainingsService = inject(TrainingsService);
  private route = inject(ActivatedRoute);
  router = inject(Router); // Public pour le template

  isEdit = false;
  sessionId?: string;
  trainings$ = this.trainingsService.getAll();

  form = this.fb.group({
    trainingId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    location: [''],
    locationType: ['distanciel' as 'distanciel' | 'presentiel' | 'hybride'],
    seats: [null as number | null],
    price: [null as number | null],
    status: [SessionStatus.SCHEDULED as SessionStatus],
    highlight: [false],
  });

  // Getters pour les comparaisons dans le template
  get locationType(): 'distanciel' | 'presentiel' | 'hybride' {
    return (this.form.get('locationType')?.value as 'distanciel' | 'presentiel' | 'hybride') || 'distanciel';
  }

  get isDistanciel(): boolean {
    return this.locationType === 'distanciel';
  }

  get isPresentiel(): boolean {
    return this.locationType === 'presentiel';
  }

  get isHybride(): boolean {
    return this.locationType === 'hybride';
  }

  get showLocationField(): boolean {
    return !this.isDistanciel;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.sessionId = id;
        this.sessionsService.getById(id).subscribe({
          next: (session) => {
            if (session) {
              this.patchForm(session);
            }
          },
          error: (error) => {
            console.error('Error loading session:', error);
            alert('Erreur lors du chargement de la session');
            this.router.navigate(['/bo/sessions']);
          },
        });
      }
    });
  }

  private patchForm(session: TrainingSession): void {
    // Convertir les dates pour les inputs datetime-local
    const startDate = new Date(session.startDate);
    const endDate = session.endDate ? new Date(session.endDate) : null;

    this.form.patchValue({
      trainingId: session.trainingId,
      startDate: this.formatDateForInput(startDate),
      endDate: endDate ? this.formatDateForInput(endDate) : '',
      location: session.locationLabel || '',
      locationType: session.locationType || 'distanciel',
      seats: session.seats || null,
      price: session.price || null,
      highlight: !!session.highlight,
    });

    // Mapper le statut du modèle vers le statut API
    let apiStatus = SessionStatus.SCHEDULED;
    if (session.status === 'upcoming') apiStatus = SessionStatus.SCHEDULED;
    else if (session.status === 'open') apiStatus = SessionStatus.IN_PROGRESS;
    else if (session.status === 'closed') apiStatus = SessionStatus.COMPLETED;
    
    this.form.patchValue({ status: apiStatus });
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  saving = false;

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.saving) {
      return;
    }

    this.saving = true;
    const value = this.form.value;

    // Convertir les dates
    const startDate = value.startDate ? new Date(value.startDate) : new Date();
    const endDate = value.endDate ? new Date(value.endDate) : new Date();

    // Construire le payload selon le modèle
    const payload: Partial<TrainingSession> = {
      trainingId: value.trainingId || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      locationType: value.locationType || 'distanciel',
      locationLabel: value.location || undefined,
      seats: value.seats || undefined,
      price: value.price || undefined,
      highlight: value.highlight ? 'Oui' : undefined,
    };

    // Mapper le statut API vers le statut du modèle
    if (value.status === SessionStatus.SCHEDULED) payload.status = 'upcoming';
    else if (value.status === SessionStatus.IN_PROGRESS) payload.status = 'open';
    else if (value.status === SessionStatus.COMPLETED) payload.status = 'closed';

    const operation = this.isEdit && this.sessionId
      ? this.sessionsService.update(this.sessionId, payload)
      : this.sessionsService.create(payload);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/bo/sessions']);
      },
      error: (error) => {
        this.saving = false;
        console.error('Error saving session:', error);
        const message = error.message || 'Erreur lors de la sauvegarde de la session';
        alert(message);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/bo/sessions']);
  }
}
