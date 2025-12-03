import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAIChatService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private apiKey = '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'; // À configurer via environnement
  private http = inject(HttpClient);

  /**
   * Envoie un message à OpenAI et retourne la réponse
   */
  sendMessage(messages: ChatMessage[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });

    const body = {
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 150,
      temperature: 0.7
    };

    return this.http.post(this.apiUrl, body, { headers });
  }

  /**
   * Traite la réponse d'OpenAI et extrait le message
   */
  extractMessage(response: any): string {
    return response.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.';
  }
}

