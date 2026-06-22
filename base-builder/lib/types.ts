// Domain types — clean shapes the UI works with, decoupled from Notion's
// verbose page/property structure (parsing lives in lib/parse.ts).

export type SessionType =
  | "Easy Z2"
  | "Easy+Strides"
  | "Long Run"
  | "MP Block"
  | "Strength"
  | "Cross-train"
  | "Rest";

export const SESSION_TYPES: SessionType[] = [
  "Easy Z2",
  "Easy+Strides",
  "Long Run",
  "MP Block",
  "Strength",
  "Cross-train",
  "Rest",
];

export const RUN_SESSION_TYPES: SessionType[] = [
  "Easy Z2",
  "Easy+Strides",
  "Long Run",
  "MP Block",
];

export type Source = "Apple Health" | "Manual";

export type Session = {
  id: string; // Notion page id
  date: string; // YYYY-MM-DD
  name: string;
  sessionType: SessionType;
  distanceKm: number | null;
  durationMin: number | null;
  avgHR: number | null;
  rpe: number | null;
  niggle: number | null;
  restingHR: number | null;
  hrv: number | null;
  source: Source | null;
  startTime: string | null;
  notes: string | null;
};

export type Status = "Green" | "Amber" | "Caution" | "Red";

export type WeeklyReport = {
  id: string;
  weekOf: string;
  phase: string | null;
  plannedVolumeKm: number | null;
  actualVolumeKm: number | null;
  avgHR: number | null;
  avgRPE: number | null;
  maxNiggle: number | null;
  acwr: number | null;
  status: Status | null;
  nextWeekTargetKm: number | null;
  coachingNotes: string | null;
};
