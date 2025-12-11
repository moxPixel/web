export type SessionLocationType = 'distanciel' | 'presentiel' | 'hybride';
export type SessionStatus = 'upcoming' | 'open' | 'closed' | 'full';

export interface TrainingSession {
  id: string;
  trainingId: string;
  startDate: string;       // ISO string
  endDate?: string;
  locationType: SessionLocationType;
  locationLabel?: string;  // e.g., “Paris”
  seats?: number;
  price?: number;
  currency?: string;
  status?: SessionStatus;
  highlight?: string;
}

