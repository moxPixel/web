export type TablerIconName =
  | 'menu-2'
  | 'x'
  | 'chevron-down'
  | 'chevron-up'
  | 'arrow-left'
  | 'arrow-right'
  | 'phone'
  | 'mail'
  | 'map-pin'
  | 'brand-facebook'
  | 'brand-instagram'
  | 'brand-linkedin'
  | 'brand-youtube'
  | 'user'
  | 'graduation-cap'
  | 'building'
  | 'rocket'
  | 'world'
  | 'sun'
  | 'moon'
  | 'external-link'
  | 'logout'
  | 'sparkles'
  | 'stack'
  | 'users'
  | 'code'
  | 'chart-line'
  | 'download'
  | 'check'
  | 'circle'
  | 'plus'
  | 'pencil'
  | 'trash'
  | 'calendar'
  | 'star'
  | 'calendar-event'
  | 'calendar-off'
  | 'currency-euro'
  | 'info-circle'
  | 'monitor'
  | 'circle-check'
  | 'checklist'
  | 'briefcase'
  | 'building-community'
  | 'flame'
  | 'clock'
  | 'puzzle'
  | 'bulb'
  | 'handshake'
  | 'send'
  | 'chart-dots';

type TablerIconDef = {
  viewBox: string;
  paths: string[];
};

// Minimal curated set (keep it lean). Add more as needed.
export const TABLER_ICONS: Record<TablerIconName, TablerIconDef> = {
  'menu-2': {
    viewBox: '0 0 24 24',
    paths: ['M4 6h16', 'M4 12h16', 'M4 18h16']
  },
  x: {
    viewBox: '0 0 24 24',
    paths: ['M18 6 6 18', 'M6 6l12 12']
  },
  'chevron-down': {
    viewBox: '0 0 24 24',
    paths: ['m6 9 6 6 6-6']
  },
  'chevron-up': {
    viewBox: '0 0 24 24',
    paths: ['m6 15 6-6 6 6']
  },
  'arrow-left': {
    viewBox: '0 0 24 24',
    paths: ['M19 12H5', 'm11 18-6-6 6-6']
  },
  'arrow-right': {
    viewBox: '0 0 24 24',
    paths: ['M5 12h14', 'm13 6 6 6-6 6']
  },
  plus: {
    viewBox: '0 0 24 24',
    paths: ['M12 5v14', 'M5 12h14']
  },
  pencil: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 20h9',
      'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z'
    ]
  },
  trash: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 6h18',
      'M8 6V4h8v2',
      'M19 6l-1 14H6L5 6',
      'M10 11v6',
      'M14 11v6'
    ]
  },
  calendar: {
    viewBox: '0 0 24 24',
    paths: [
      'M8 2v4',
      'M16 2v4',
      'M3 8h18',
      'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2'
    ]
  },
  phone: {
    viewBox: '0 0 24 24',
    paths: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z']
  },
  mail: {
    viewBox: '0 0 24 24',
    paths: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2', 'm22 6-10 7L2 6']
  },
  'map-pin': {
    viewBox: '0 0 24 24',
    paths: ['M12 21s8-4.5 8-11a8 8 0 1 0-16 0c0 6.5 8 11 8 11', 'M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6']
  },
  'brand-facebook': {
    viewBox: '0 0 24 24',
    paths: ['M7 10v4h3v8h4v-8h3l1-4h-4V8a2 2 0 0 1 2-2h2V2h-2a6 6 0 0 0-6 6v2H7']
  },
  'brand-instagram': {
    viewBox: '0 0 24 24',
    paths: ['M4 4m0 4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z', 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M17.5 6.5h.01']
  },
  'brand-linkedin': {
    viewBox: '0 0 24 24',
    paths: ['M4 7v13', 'M4 4v.01', 'M8 11v9', 'M8 11c0-1.5 1.5-3 3.5-3S15 9.5 15 12v8', 'M20 20v-8c0-2.2-1.8-4-4-4']
  },
  'brand-youtube': {
    viewBox: '0 0 24 24',
    paths: ['M3 7.5c0-1.1.8-2 1.9-2.2C6.8 5 9.4 5 12 5s5.2 0 7.1.3c1.1.2 1.9 1.1 1.9 2.2v9c0 1.1-.8 2-1.9 2.2-1.9.3-4.5.3-7.1.3s-5.2 0-7.1-.3C3.8 18.5 3 17.6 3 16.5v-9', 'm10 3 5 3-5 3z']
  },
  user: {
    viewBox: '0 0 24 24',
    paths: ['M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2']
  },
  'graduation-cap': {
    viewBox: '0 0 24 24',
    paths: ['M22 10l-10-5-10 5 10 5 10-5', 'M6 12v5c3 2 9 2 12 0v-5']
  },
  building: {
    viewBox: '0 0 24 24',
    paths: ['M3 21h18', 'M6 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14', 'M10 9h.01', 'M14 9h.01', 'M10 13h.01', 'M14 13h.01', 'M10 17h.01', 'M14 17h.01']
  },
  rocket: {
    viewBox: '0 0 24 24',
    paths: ['M4 13a8 8 0 0 1 8-8h4l4 4v4a8 8 0 0 1-8 8H8l-4-4v-4', 'M10 14l4-4', 'M12 12h.01']
  },
  world: {
    viewBox: '0 0 24 24',
    paths: ['M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18']
  },
  sun: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
      'M12 2v2',
      'M12 20v2',
      'm4.93 4.93 1.41 1.41',
      'm17.66 17.66 1.41 1.41',
      'M2 12h2',
      'M20 12h2',
      'm4.93 19.07 1.41-1.41',
      'm17.66 6.34 1.41-1.41'
    ]
  },
  moon: {
    viewBox: '0 0 24 24',
    paths: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z']
  },
  'external-link': {
    viewBox: '0 0 24 24',
    paths: ['M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6']
  },
  logout: {
    viewBox: '0 0 24 24',
    paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9']
  },
  sparkles: {
    viewBox: '0 0 24 24',
    paths: ['M12 3v3', 'M12 18v3', 'M18 12h3', 'M3 12h3', 'M15.5 8.5l2.1-2.1', 'M6.4 17.6l2.1-2.1', 'M8.5 15.5l-2.1-2.1', 'M17.6 6.4l-2.1-2.1', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z']
  },
  stack: {
    viewBox: '0 0 24 24',
    paths: ['M4 19l8-4', 'M4 15l8-4', 'M4 11l8-4', 'M4 7l8 4 8-4', 'M4 3l8 4 8-4']
  },
  users: {
    viewBox: '0 0 24 24',
    paths: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M18 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0z', 'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z']
  },
  code: {
    viewBox: '0 0 24 24',
    paths: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6']
  },
  'chart-line': {
    viewBox: '0 0 24 24',
    paths: ['M3 3v18h18', 'M19 9l-5 5-4-4-3 3']
  },
  download: {
    viewBox: '0 0 24 24',
    paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']
  },
  check: {
    viewBox: '0 0 24 24',
    paths: ['M20 6 9 17l-5-5']
  },
  circle: {
    viewBox: '0 0 24 24',
    paths: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0']
  },
  star: {
    viewBox: '0 0 24 24',
    paths: ['M12 17.75l-6.17 3.75 1.17-6.88L2 9.75l6.9-1 3.1-6.5 3.1 6.5 6.9 1-5.08 4.87 1.17 6.88z']
  },
  'calendar-event': {
    viewBox: '0 0 24 24',
    paths: [
      'M8 2v4',
      'M16 2v4',
      'M3 8h18',
      'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
      'M12 14h.01',
      'M8 14h.01',
      'M16 14h.01'
    ]
  },
  'calendar-off': {
    viewBox: '0 0 24 24',
    paths: [
      'M8 2v4',
      'M16 2v4',
      'M3 8h18',
      'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
      'M3 3l18 18'
    ]
  },
  'currency-euro': {
    viewBox: '0 0 24 24',
    paths: ['M7 10h10M7 14h10', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'M7 10a6 6 0 0 0 0 4']
  },
  'info-circle': {
    viewBox: '0 0 24 24',
    paths: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M12 8h.01', 'M11 12h1v4h1']
  },
  monitor: {
    viewBox: '0 0 24 24',
    paths: ['M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z', 'M8 21h8', 'M12 17v4']
  },
  'circle-check': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10z',
      'm9 12 2 2 4-4'
    ]
  },
  checklist: {
    viewBox: '0 0 24 24',
    paths: [
      'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2',
      'M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z',
      'M9 12l2 2 4-4'
    ]
  },
  briefcase: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
      'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
      'M12 12v.01'
    ]
  },
  'building-community': {
    viewBox: '0 0 24 24',
    paths: [
      'M8 9l5 5v7H8v-4m0 4H3v-7l5-5m1 1V4h10v5M21 9v8',
      'M10 6h4',
      'M10 10h4',
      'M10 14h4'
    ]
  },
  flame: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z'
    ]
  },
  clock: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0',
      'M12 7v5l3 3'
    ]
  },
  puzzle: {
    viewBox: '0 0 24 24',
    paths: [
      'M4 7h3a1 1 0 0 0 1-1V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2a1 1 0 0 0-1-1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z'
    ]
  },
  bulb: {
    viewBox: '0 0 24 24',
    paths: [
      'M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0-1 3h-4a3.5 3.5 0 0 0-1-3z',
      'M9.7 17h4.6'
    ]
  },
  handshake: {
    viewBox: '0 0 24 24',
    paths: [
      'M6 9h2l2 2 4-4 2 2h2',
      'M6 13h2l2-2 4 4 2-2h2',
      'M4 9v6',
      'M20 9v6'
    ]
  },
  send: {
    viewBox: '0 0 24 24',
    paths: [
      'M10 14l11-11',
      'M21 3L14.5 21a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1L21 3'
    ]
  },
  'chart-dots': {
    viewBox: '0 0 24 24',
    paths: [
      'M3 3v18h18',
      'M9 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
      'M19 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
      'M14 15m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
      'M10.16 10.62l2.34 2.88',
      'M15.088 13.328l2.837-4.586'
    ]
  }
};


