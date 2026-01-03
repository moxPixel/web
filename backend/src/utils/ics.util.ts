// Minimal iCalendar (.ics) generator (RFC5545-ish) for event exports.
// No external dependency: keeps backend lightweight and predictable.

export type IcsEventInput = {
  uid: string;
  dtstamp: Date;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatUtcDateTime(d: Date): string {
  // YYYYMMDDTHHMMSSZ (UTC)
  return (
    `${d.getUTCFullYear()}` +
    `${pad2(d.getUTCMonth() + 1)}` +
    `${pad2(d.getUTCDate())}` +
    `T` +
    `${pad2(d.getUTCHours())}` +
    `${pad2(d.getUTCMinutes())}` +
    `${pad2(d.getUTCSeconds())}` +
    `Z`
  );
}

// Escape TEXT values (commas/semicolons/newlines/backslashes)
function icsEscapeText(s: string): string {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim();
}

// Fold long lines at 75 octets-ish (we do a safe char-based fold; good enough for ASCII URLs/text).
function foldLine(line: string): string {
  const limit = 75;
  if (line.length <= limit) return line;
  let out = '';
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + limit);
    out += i === 0 ? chunk : `\r\n ${chunk}`;
    i += limit;
  }
  return out;
}

function stripHtml(s: string): string {
  // Very small, safe strip (no DOM on backend)
  return String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildIcsEvent(e: IcsEventInput): string {
  const summary = icsEscapeText(e.summary);
  const description = e.description ? icsEscapeText(stripHtml(e.description)) : '';
  const location = e.location ? icsEscapeText(e.location) : '';
  const url = e.url ? String(e.url).trim() : '';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Unlock//Events//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscapeText(e.uid)}`,
    `DTSTAMP:${formatUtcDateTime(e.dtstamp)}`,
    `DTSTART:${formatUtcDateTime(e.start)}`,
    `DTEND:${formatUtcDateTime(e.end)}`,
    `SUMMARY:${summary}`,
  ];

  if (description) lines.push(`DESCRIPTION:${description}`);
  if (location) lines.push(`LOCATION:${location}`);
  if (url) lines.push(`URL:${icsEscapeText(url)}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}


