import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

export interface EmailDialogPayload {
  to: string;
  cc?: string;
  subject: string;
  message: string;
  attachments?: {
    filename: string;
    content: string; // base64 dataURL
    contentType?: string;
  }[];
}

@Component({
  selector: 'app-email-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule],
  templateUrl: './email-dialog.component.html',
  styleUrls: ['./email-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailDialogComponent {
  @Input() open = false;
  @Input() loading = false;

  @Input() set initialTo(value: string | undefined) {
    this.to.set(value || '');
  }
  @Input() set initialCc(value: string | undefined) {
    this.cc.set(value || '');
  }
  @Input() set initialSubject(value: string | undefined) {
    this.subject.set(value || '');
  }
  @Input() set initialMessage(value: string | undefined) {
    this.message.set(value || '');
  }

  @Output() close = new EventEmitter<void>();
  @Output() send = new EventEmitter<EmailDialogPayload>();

  to = signal('');
  cc = signal('');
  subject = signal('');
  message = signal('');
  attachments = signal<{ filename: string; content: string; contentType?: string }[]>([]);

  emitClose(): void {
    if (this.loading) return;
    this.close.emit();
  }

  emitSend(): void {
    if (this.loading) return;
    const payload: EmailDialogPayload = {
      to: this.to().trim(),
      cc: this.cc().trim() || undefined,
      subject: this.subject().trim(),
      message: this.message().trim(),
      attachments: this.attachments().length ? this.attachments() : undefined
    };
    this.send.emit(payload);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || !files.length) return;
    const file = files[0];
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      this.attachments.set([]);
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.attachments.set([
        {
          filename: file.name,
          content: result,
          contentType: file.type || undefined
        }
      ]);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  clearAttachment(): void {
    this.attachments.set([]);
  }
}

