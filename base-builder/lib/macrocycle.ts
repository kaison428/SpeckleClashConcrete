export type MacrocyclePhase = {
  month: string;
  phase: string;
  targetVolumeKm: number;
  longRunKm: number;
};

export const MACROCYCLE: MacrocyclePhase[] = [
  { month: "Jun26", phase: "Foundation", targetVolumeKm: 25, longRunKm: 12 },
  { month: "Jul26", phase: "Foundation", targetVolumeKm: 32, longRunKm: 15 },
  { month: "Aug26", phase: "Foundation", targetVolumeKm: 40, longRunKm: 18 },
  { month: "Sep26", phase: "Base", targetVolumeKm: 46, longRunKm: 20 },
  { month: "Oct26", phase: "Base", targetVolumeKm: 50, longRunKm: 22 },
  { month: "Nov26", phase: "Base", targetVolumeKm: 52, longRunKm: 24 },
  { month: "Dec26", phase: "Build", targetVolumeKm: 56, longRunKm: 26 },
  { month: "Jan27", phase: "Build", targetVolumeKm: 60, longRunKm: 28 },
  { month: "Feb27", phase: "Specific", targetVolumeKm: 63, longRunKm: 30 },
  { month: "Mar27", phase: "Specific", targetVolumeKm: 66, longRunKm: 32 },
  { month: "Apr27", phase: "Peak", targetVolumeKm: 68, longRunKm: 32 },
  { month: "May27", phase: "Peak→Taper", targetVolumeKm: 64, longRunKm: 32 },
  { month: "Jun27", phase: "Taper+Race", targetVolumeKm: 35, longRunKm: 16 },
];

export const RACE_DATE = new Date("2027-06-13");

// Month index map: "Jun26" -> { year: 2026, month: 5 (0-indexed) }
const MONTH_ABBR: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseMonthKey(monthKey: string): Date {
  const abbr = monthKey.slice(0, 3);
  const yearShort = monthKey.slice(3);
  const year = 2000 + parseInt(yearShort, 10);
  const month = MONTH_ABBR[abbr] ?? 0;
  return new Date(year, month, 1);
}

export function getCurrentPhase(): MacrocyclePhase {
  const now = new Date(Date.now());

  for (let i = MACROCYCLE.length - 1; i >= 0; i--) {
    const phaseStart = parseMonthKey(MACROCYCLE[i].month);
    if (now >= phaseStart) {
      return MACROCYCLE[i];
    }
  }

  // Before plan starts — return the first phase
  return MACROCYCLE[0];
}

export function getWeekNumber(date: Date): number {
  const currentPhase = getCurrentPhase();
  const phaseStart = parseMonthKey(currentPhase.month);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekIndex = Math.floor((date.getTime() - phaseStart.getTime()) / msPerWeek);
  return Math.max(1, weekIndex + 1);
}

export function isDeloadWeek(weekIndex: number): boolean {
  return weekIndex % 4 === 0;
}

// Weeks remaining until the next deload week (0 = this week is a deload).
export function weeksUntilDeload(weekIndex: number): number {
  if (isDeloadWeek(weekIndex)) return 0;
  return 4 - (weekIndex % 4);
}

export function getPhaseForDate(date: Date): MacrocyclePhase {
  for (let i = MACROCYCLE.length - 1; i >= 0; i--) {
    if (date >= parseMonthKey(MACROCYCLE[i].month)) return MACROCYCLE[i];
  }
  return MACROCYCLE[0];
}

// targetVolumeKm values are WEEKLY targets. Every 4th week is a deload (-25%).
export function getPlannedVolumeForWeek(weekStartDate: Date): number {
  const phase = getPhaseForDate(weekStartDate);
  const weekIndex = getWeekNumber(weekStartDate);
  const base = phase.targetVolumeKm;
  if (isDeloadWeek(weekIndex)) {
    return Math.round(base * 0.75);
  }
  return base;
}
