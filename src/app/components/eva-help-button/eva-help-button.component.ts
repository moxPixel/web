import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { EvaChatApiService } from '../../services/api/eva-chat-api.service';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-eva-help-button',
  standalone: true,
  imports: [CommonModule, FormsModule, TablerIconComponent, MarkdownPipe],
  templateUrl: './eva-help-button.component.html',
  styleUrl: './eva-help-button.component.css'
})
export class EvaHelpButtonComponent implements AfterViewInit, OnDestroy {
  private readonly evaChatApi = inject(EvaChatApiService);
  private readonly STORAGE_KEY = 'eva-chat:v1';

  @ViewChild('shell', { static: false }) shell?: ElementRef<HTMLElement>;
  @ViewChild('button', { static: false }) button!: ElementRef<HTMLElement>;
  @ViewChild('input', { static: false }) input?: ElementRef<HTMLInputElement>;
  @ViewChild('messages', { static: false }) messagesEl?: ElementRef<HTMLElement>;
  
  private scrollListener?: () => void;
  private rafId: number | null = null;
  private isVisible = false;
  private loaderListener?: () => void;
  private onKeydown?: (ev: KeyboardEvent) => void;

  isOpen = false;
  draft = '';
  isSending = false;
  messagesList: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    this.restoreFromStorage();

    // Never show / animate while the page loader is still visible.
    // Wait for the same global signal as cookie-consent/notifications.
    if (!document.getElementById('page-loader')) {
      this.setupScrollAnimation();
      return;
    }

    this.loaderListener = () => this.setupScrollAnimation();
    window.addEventListener('app-loader-hidden', this.loaderListener as any, { once: true } as any);
  }

  ngOnDestroy(): void {
    if (this.scrollListener && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollListener);
    }
    if (this.loaderListener && typeof window !== 'undefined') {
      window.removeEventListener('app-loader-hidden', this.loaderListener as any);
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.onKeydown && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeydown);
    }
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.installCloseHandlers();
      // Ensure the scroll-reveal logic doesn't immediately hide the button while open.
      this.scrollListener?.();
      setTimeout(() => this.scrollToBottom(), 0);
    } else {
      this.removeCloseHandlers();
    }
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.removeCloseHandlers();
    // Re-evaluate scroll visibility state after closing.
    this.scrollListener?.();
  }

  async send(ev?: Event): Promise<void> {
    ev?.preventDefault();
    const text = (this.draft || '').trim();
    if (!text || this.isSending) return;

    this.messagesList.push({ role: 'user', content: text });
    this.persistToStorage();
    this.draft = '';
    this.isSending = true;
    this.scrollToBottom();

    try {
      const history = this.messagesList.slice(-10);
      const res = await firstValueFrom(this.evaChatApi.chat({ message: text, history }));
      this.messagesList.push({ role: 'assistant', content: res.reply });
      this.persistToStorage();
    } catch (e: any) {
      this.messagesList.push({
        role: 'assistant',
        content:
          "Je rencontre un souci pour répondre là tout de suite. Tu peux me redire ta question, ou passer par /contact et on t’aide rapidement.",
      });
      this.persistToStorage();
    } finally {
      this.isSending = false;
      this.scrollToBottom();
    }
  }

  quickSend(text: string): void {
    this.draft = text;
    void this.send();
  }

  resetChat(): void {
    if (this.isSending) return;
    this.messagesList = [];
    this.draft = '';
    this.persistToStorage();
  }

  private setupScrollAnimation(): void {
    if (typeof window === 'undefined' || !this.button?.nativeElement) {
      setTimeout(() => this.setupScrollAnimation(), 100);
      return;
    }

    const btn = this.button.nativeElement;
    
    // État initial : caché
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(20px) scale(0.95)';
    btn.style.pointerEvents = 'none';

    // Vérifier la position au scroll
    this.scrollListener = () => {
      if (this.rafId !== null) return;
      
      this.rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const shouldBeVisible = this.isOpen || scrollY > 100;

        if (shouldBeVisible !== this.isVisible) {
          this.isVisible = shouldBeVisible;
          
          if (shouldBeVisible) {
            btn.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0) scale(1)';
            btn.style.pointerEvents = 'auto';
          } else {
            btn.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px) scale(0.95)';
            btn.style.pointerEvents = 'none';
          }
        }
        
        this.rafId = null;
      });
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
    
    // Vérifier l'état initial
    this.scrollListener();
  }

  private installCloseHandlers(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    if (!this.onKeydown) {
      this.onKeydown = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') this.close();
      };
      window.addEventListener('keydown', this.onKeydown);
    }
  }

  private removeCloseHandlers(): void {
    if (typeof window !== 'undefined' && this.onKeydown) {
      window.removeEventListener('keydown', this.onKeydown);
      this.onKeydown = undefined;
    }
  }

  private scrollToBottom(): void {
    const el = this.messagesEl?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  private restoreFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const msgs = Array.isArray(parsed?.messages) ? parsed.messages : [];
      this.messagesList = msgs
        .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-30);
    } catch {
      // ignore
    }
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const payload = { messages: this.messagesList.slice(-30), savedAt: Date.now() };
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }
}

