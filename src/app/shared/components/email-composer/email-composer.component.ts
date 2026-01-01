import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MailApiService } from '../../../services/api/mail-api.service';
import { TablerIconComponent } from '../../icons/tabler-icon/tabler-icon.component';
import { NotificationService } from '../../services/notifications/notification.service';
import { UiButtonDirective } from '../../../ui/ui-button.directive';
import { UiInputDirective } from '../../../ui/ui-input.directive';

@Component({
  selector: 'app-email-composer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TablerIconComponent, UiButtonDirective, UiInputDirective],
  templateUrl: './email-composer.component.html',
  styleUrl: './email-composer.component.css',
})
export class EmailComposerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly mail = inject(MailApiService);
  private readonly notifications = inject(NotificationService);

  @Input({ required: true }) to = '';
  @Input() cc = '';
  @Input() subject = '';
  @Input() initialMessage = '';
  @Input() disabled = false;
  /** When true, the "To" field becomes editable (used for "Nouveau message"). */
  @Input() editableTo = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() sent = new EventEmitter<{ to: string; cc?: string; subject: string; message: string }>();

  sending = false;
  attachment: { filename: string; content: string; contentType?: string } | null = null;

  readonly form = this.fb.group({
    to: [''],
    cc: [''],
    subject: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnChanges(): void {
    // Patch defaults when inputs change (safe for projected usage)
    this.form.patchValue({
      to: this.to || this.form.value.to || '',
      cc: this.cc || this.form.value.cc || '',
      subject: this.subject || this.form.value.subject || '',
      message: this.initialMessage || this.form.value.message || '',
    });
  }

  onPickAttachment(input: HTMLInputElement): void {
    if (this.disabled || this.sending) return;
    input.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || !files.length) return;
    const file = files[0];
    // Max 5MB (same as web/)
    if (file.size > 5 * 1024 * 1024) {
      this.attachment = null;
      input.value = '';
      this.notifications.warning('Fichier trop volumineux', 'Max 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.attachment = {
        filename: file.name,
        content: result, // dataURL (backend supports data:... or base64)
        contentType: file.type || undefined,
      };
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  clearAttachment(): void {
    this.attachment = null;
  }

  onSend(): void {
    if (this.disabled || this.sending) return;
    const to = (this.editableTo ? this.form.value.to : this.to) || '';
    const cc = (this.form.value.cc || this.cc || '').trim() || undefined;

    if (!to.trim()) {
      this.notifications.warning('Destinataire manquant', 'Veuillez renseigner un email destinataire.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.warning('Formulaire incomplet', 'Veuillez compléter les champs requis avant l’envoi.');
      return;
    }

    this.sending = true;

    const subject = this.form.value.subject!;
    const message = this.form.value.message!;

    this.mail
      .send({
        to: to.trim(),
        cc,
        subject,
        message,
        attachments: this.attachment ? [this.attachment] : undefined,
      })
      .subscribe({
      next: () => {
        this.sending = false;
        this.notifications.success('Email envoyé', `Message envoyé à ${to.trim()}${cc ? ` (Cc: ${cc})` : ''}.`);
        this.sent.emit({ to: to.trim(), cc, subject, message });
      },
      error: (err: Error) => {
        this.sending = false;
        this.notifications.error('Envoi impossible', err.message || "Erreur lors de l'envoi");
      },
    });
  }
}


