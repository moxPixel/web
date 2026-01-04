import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    const html = this.markdownToHtml(value);
    return this.sanitizer.sanitize(1, html) as SafeHtml; // SecurityContext.HTML = 1
  }

  private markdownToHtml(markdown: string): string {
    if (!markdown) return '';
    const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
    const result: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    let listItems: string[] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        const tag = listType === 'ol' ? 'ol' : 'ul';
        result.push(`<${tag}>`);
        result.push(...listItems);
        result.push(`</${tag}>`);
        listItems = [];
        inList = false;
        listType = null;
      }
    };

    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const processInline = (text: string): string => {
      let s = escapeHtml(text);
      // Bold (**text** or __text__)
      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
      // Italic (*text* or _text_)
      s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      s = s.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
      return s;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Ordered list (1. item)
      const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        listItems.push(`<li>${processInline(olMatch[2])}</li>`);
        continue;
      }

      // Unordered list (- item or * item)
      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        listItems.push(`<li>${processInline(ulMatch[1])}</li>`);
        continue;
      }

      // Not a list item
      flushList();

      if (trimmed === '') {
        result.push('<br>');
      } else {
        result.push(`<p>${processInline(trimmed)}</p>`);
      }
    }

    flushList();

    return result.join('');
  }
}

