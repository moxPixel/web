import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, timeout } from 'rxjs';

export interface SendMailPayload {
  to: string;
  cc?: string;
  subject: string;
  message: string;
  attachments?: {
    filename: string;
    content: string;
    contentType?: string;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class MailApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mail`;

  send(payload: SendMailPayload) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/send`, payload).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Erreur lors de l’envoi du mail');
        }
        return;
      })
    );
  }
}

