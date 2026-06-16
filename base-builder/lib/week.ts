import type { Session, Status } from "./types";

// Marathon weeks run Monday→Sunday (long run on Saturday). All week math keys
// off the Monday that starts the week.

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

export function weekKey(dateISO: string): string {
  return startOfWeek(new Date(dateISO + "T12:00:00")).toISOString().split("T")[0];
}

export function isRun(s: Session): boolean {
  return (
    s.sessionType === "Easy Z2" ||
    s.sessionType === "Easy+Strides" ||
    s.sessionType === "Long Run" ||
    s.sessionType === "MP Block"
  );
}

export type WeekGroup = {
  weekOf: string; // Monday YYYY-MM-DD
  sessions: Session[];
  totalKm: number;
  runCount: number;
  avgHR: number | null;
  avgRPE: number | null;
  maxNiggle: number;
};

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function summarizeWeek(weekOf: string, sessions: Session[]): WeekGroup {
  const totalKm = sessions.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);
  const runCount = sessions.filter(isRun).length;
  const hrValues = sessions
    .map((s) => s.avgHR)
    .filter((v): v is number => v !== null);
  const rpeValues = sessions
    .map((s) => s.rpe)
    .filter((v): v is number => v !== null);
  const niggleValues = sessions
    .map((s) => s.niggle)
    .filter((v): v is number => v !== null);

  return {
    weekOf,
    sessions,
    totalKm: Math.round(totalKm * 10) / 10,
    runCount,
    avgHR: hrValues.length ? Math.round(avg(hrValues)!) : null,
    avgRPE: rpeValues.length ? Math.round(avg(rpeValues)! * 10) / 10 : null,
    maxNiggle: niggleValues.length ? Math.max(...niggleValues) : 0,
  };
}

export function groupByWeek(sessions: Session[]): WeekGroup[] {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const key = weekKey(s.date);
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .map(([weekOf, ss]) => summarizeWeek(weekOf, ss))
    .sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1)); // newest first
}

// Niggle → status light. Drives the dashboard light and the engine action.
export function niggleStatus(maxNiggle: number): Status {
  if (maxNiggle >= 7) return "Red";
  if (maxNiggle >= 5) return "Caution";
  if (maxNiggle >= 3) return "Amber";
  return "Green";
}

export const STATUS_COLOR: Record<Status, string> = {
  Green: "var(--green-500)",
  Amber: "var(--amber)",
  Caution: "var(--caution)",
  Red: "var(--red)",
};

export const STATUS_GUIDANCE: Record<Status, string> = {
  Green: "Proceed as planned.",
  Amber: "Hold volume flat this week.",
  Caution: "Cut 20–30% and swap a run for cross-train.",
  Red: "Stop running. See physio if it persists >5 days.",
};
