import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CertificationsService } from '../../core/services/certifications.service';
import { Certification, CertificationType } from '../../core/models/certification.model';

@Component({
  selector: 'app-certification-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatRippleModule, MatIconModule, MatButtonModule],
  templateUrl: './certification-form.component.html',
  styleUrls: ['./certification-form.component.css']
})
export class CertificationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private certificationsService = inject(CertificationsService);
  private route = inject(ActivatedRoute);
  router = inject(Router); // Public pour le template

  isEdit = false;
  certificationId?: string;

  form = this.fb.group({
    type: ['RNCP' as CertificationType, Validators.required],
    code: ['', Validators.required],
    title: ['', Validators.required],
    level: [''],
    status: ['active' as 'active' | 'inactive'],
    issuer: [''],
    description: [''],
  });

  // Getters pour le template
  get certificationType(): CertificationType {
    return this.form.get('type')?.value || 'RNCP';
  }

  get isRNCP(): boolean {
    return this.certificationType === 'RNCP';
  }

  get isRS(): boolean {
    return this.certificationType === 'RS';
  }

  get isOther(): boolean {
    return this.certificationType === 'Other';
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.certificationId = id;
        this.certificationsService.getById(id).subscribe({
          next: (certification) => {
            if (certification) {
              this.patchForm(certification);
            }
          },
          error: (error) => {
            console.error('Error loading certification:', error);
            alert('Erreur lors du chargement de la certification');
            this.router.navigate(['/bo/certifications']);
          },
        });
      }
    });
  }

  private patchForm(certification: Certification): void {
    this.form.patchValue({
      type: certification.type,
      code: certification.code,
      title: certification.title,
      level: certification.level || '',
      status: certification.status || 'active',
      issuer: certification.issuer || '',
      description: certification.description || '',
    });
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

    const payload: Partial<Certification> = {
      type: value.type || 'RNCP',
      code: value.code || '',
      title: value.title || '',
      level: value.level || undefined,
      status: (value.status as 'active' | 'inactive') || 'active',
      issuer: value.issuer || undefined,
      description: value.description || undefined,
    };

    const operation = this.isEdit && this.certificationId
      ? this.certificationsService.update(this.certificationId, payload)
      : this.certificationsService.create(payload);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/bo/certifications']);
      },
      error: (error) => {
        this.saving = false;
        console.error('Error saving certification:', error);
        const message = error.message || 'Erreur lors de la sauvegarde de la certification';
        alert(message);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/bo/certifications']);
  }
}
