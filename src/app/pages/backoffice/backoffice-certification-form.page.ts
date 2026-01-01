import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import {
  CertificationApi,
  CertificationStatus,
  CertificationType,
  CreateCertificationDto,
  UpdateCertificationDto,
} from '../../interfaces/certification-api.interface';
import { BackofficeCertificationsService } from '../../services/backoffice/backoffice-certifications.service';
import { UiChoiceGroupComponent, UiChoiceOption } from '../../shared/components/ui-choice-group/ui-choice-group.component';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';
import { UiInputDirective } from '../../ui/ui-input.directive';

@Component({
  selector: 'app-backoffice-certification-form-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TablerIconComponent,
    UiChoiceGroupComponent,
    UiButtonDirective,
    UiInputDirective,
    UiCardDirective,
  ],
  templateUrl: './backoffice-certification-form.page.html',
  styleUrl: './backoffice-certification-form.page.css',
})
export class BackofficeCertificationFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bo = inject(BackofficeCertificationsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  isEdit = false;
  private certificationId: string | null = null;

  saving = false;
  hydrated = false;

  protected readonly typeOptions: UiChoiceOption<CertificationType>[] = [
    { value: 'RNCP', label: 'RNCP' },
    { value: 'RS', label: 'RS' },
    { value: 'Other', label: 'Autre' },
  ];

  protected readonly statusOptions: UiChoiceOption<CertificationStatus>[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  readonly form = this.fb.group({
    type: ['RNCP' as CertificationType, Validators.required],
    code: ['', Validators.required],
    title: ['', Validators.required],
    level: [''],
    issuer: [''],
    description: [''],
    status: ['active' as CertificationStatus, Validators.required],
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.isEdit = !!id;
      this.certificationId = id;

      if (!id) {
        this.hydrated = true;
        return;
      }

      this.bo.getById(id).subscribe({
        next: (c) => {
          this.patchForm(c);
          this.hydrated = true;
        },
        error: (err: Error) => {
          this.notifications.error('Chargement impossible', err.message || 'Erreur lors du chargement');
          this.hydrated = true;
        },
      });
    });
  }

  back(): void {
    this.router.navigate(['/backoffice/certifications']);
  }

  submit(): void {
    if (!this.hydrated) return;
    if (this.saving) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.warning('Champs requis', 'Veuillez compléter les champs requis.');
      return;
    }

    this.saving = true;

    const v = this.form.value;

    const base: CreateCertificationDto = {
      type: (v.type as string) || 'RNCP',
      code: v.code || '',
      title: v.title || '',
      level: v.level || undefined,
      issuer: v.issuer || undefined,
      description: v.description || undefined,
      status: (v.status as CertificationStatus) || 'active',
    };

    const op$ = this.isEdit && this.certificationId
      ? this.bo.update(this.certificationId, base as UpdateCertificationDto)
      : this.bo.create(base);

    op$.subscribe({
      next: () => {
        this.saving = false;
        this.notifications.success('Enregistré', this.isEdit ? 'Certification mise à jour.' : 'Certification créée.');
        this.router.navigate(['/backoffice/certifications']);
      },
      error: (err: Error) => {
        this.saving = false;
        this.notifications.error('Sauvegarde impossible', err.message || 'Erreur lors de la sauvegarde');
      },
    });
  }

  private patchForm(c: CertificationApi): void {
    this.form.patchValue({
      type: (c.type || 'RNCP') as CertificationType,
      code: c.code,
      title: c.title,
      level: c.level || '',
      issuer: c.issuer || '',
      description: c.description || '',
      status: c.status || 'active',
    });
  }
}


