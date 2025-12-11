import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ContactsApiService } from '../../../services/api/contacts-api.service';
import { Contact, ContactStatus } from '../../../interfaces/contact.interface';

export interface ContactResponseDialogData {
  contact: Contact;
}

@Component({
  selector: 'app-contact-response-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './contact-response-dialog.component.html',
  styleUrls: ['./contact-response-dialog.component.css'],
})
export class ContactResponseDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactsService = inject(ContactsApiService);
  private dialogRef = inject(MatDialogRef<ContactResponseDialogComponent>);
  private data = inject<ContactResponseDialogData>(MAT_DIALOG_DATA);

  contact: Contact = this.data.contact;
  form!: FormGroup;
  saving = false;
  
  // Exposer ContactStatus pour le template
  ContactStatus = ContactStatus;

  ngOnInit(): void {
    this.form = this.fb.group({
      response: [this.contact.response || '', [Validators.required, Validators.minLength(10)]],
      status: [this.contact.status || ContactStatus.IN_PROGRESS, Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving = true;
    const { response, status } = this.form.value;

    this.contactsService
      .update(this.contact.id, {
        response,
        status: status === ContactStatus.RESPONDED ? ContactStatus.RESPONDED : ContactStatus.IN_PROGRESS,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating contact:', error);
          this.saving = false;
          alert('Erreur lors de l\'envoi de la réponse');
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onStatusChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.form.patchValue({
      status: checked ? ContactStatus.RESPONDED : ContactStatus.IN_PROGRESS,
    });
  }

  getStatusLabel(status: ContactStatus): string {
    switch (status) {
      case ContactStatus.PENDING:
        return 'En attente';
      case ContactStatus.IN_PROGRESS:
        return 'En cours';
      case ContactStatus.RESPONDED:
        return 'Répondu';
      case ContactStatus.ARCHIVED:
        return 'Archivé';
      default:
        return status;
    }
  }
}

