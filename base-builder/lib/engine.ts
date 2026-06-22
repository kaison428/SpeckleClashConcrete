import type { Session, Status } from "./types";
import { isRun, startOfWeek, niggleStatus } from "./week";
import { getPhaseForDate, getWeekNumber, isDeloadWeek } from "./macrocycle";

// ── Analysis engine ─────────────────────────────────────────────────────────
// Weekly compute over the Training Log: volume, avg HR, avg RPE, max niggle,
// ACWR, plus Status / Next Week Target / bulleted Coaching Notes.

export type WeeklyAnalysis = {
  weekOf: string; // Monday YYYY-MM-DD
  phase: string;
  plannedVolumeKm: number;
  actualVolumeKm: number;
  priorVolumeKm: number;
  avgHR: number | null;
  avgRPE: number | null;
  maxNiggle: number;
  acwr: number | null;
  status: Status;
  nextWeekTargetKm: number;
  coachingNotes: string[];
};

function dateKm(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);
}

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ACWR = 7-day load ÷ (28-day avg daily load × 7). Load here is distance (km).
export function computeACWR(sessions: Session[], weekEnd: Date): number | null {
  const end = weekEnd.getTime();
  const day = 24 * 60 * 60 * 1000;

  const within = (s: Session, days: number) => {
    const t = new Date(s.date + "T12:00:00").getTime();
    return t <= end && t > end - days * day;
  };

  const acute = dateKm(sessions.filter((s) => within(s, 7)));
  const chronicTotal = dateKm(sessions.filter((s) => within(s, 28)));
  const chronicWeekly = (chronicTotal / 28) * 7;

  if (chronicWeekly <= 0) return null;
  return Math.round((acute / chronicWeekly) * 100) / 100;
}

export function analyzeWeek(
  allSessions: Session[],
  weekStart: Date
): WeeklyAnalysis {
  const weekStartMon = startOfWeek(weekStart);
  const weekOf = weekStartMon.toISOString().split("T")[0];
  const weekEnd = new Date(weekStartMon);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const inWeek = (s: Session, start: Date) => {
    const t = new Date(s.date + "T12:00:00").getTime();
    const a = start.getTime();
    return t >= a && t < a + 7 * 24 * 60 * 60 * 1000;
  };

  const weekSessions = allSessions.filter((s) => inWeek(s, weekStartMon));
  const priorStart = new Date(weekStartMon);
  priorStart.setDate(priorStart.getDate() - 7);
  const priorSessions = allSessions.filter((s) => inWeek(s, priorStart));

  const actualVolumeKm = Math.round(dateKm(weekSessions) * 10) / 10;
  const priorVolumeKm = Math.round(dateKm(priorSessions) * 10) / 10;

  const phase = getPhaseForDate(weekStartMon);
  const weekIndex = getWeekNumber(weekStartMon);
  const deload = isDeloadWeek(weekIndex);
  const plannedVolumeKm = deload
    ? Math.round(phase.targetVolumeKm * 0.75)
    : phase.targetVolumeKm;

  const hrValues = weekSessions
    .map((s) => s.avgHR)
    .filter((v): v is number => v !== null);
  const rpeValues = weekSessions
    .map((s) => s.rpe)
    .filter((v): v is number => v !== null);
  const niggleValues = weekSessions
    .map((s) => s.niggle)
    .filter((v): v is number => v !== null);

  const avgHR = hrValues.length ? Math.round(avg(hrValues)!) : null;
  const avgRPE = rpeValues.length ? Math.round(avg(rpeValues)! * 10) / 10 : null;
  const maxNiggle = niggleValues.length ? Math.max(...niggleValues) : 0;
  const acwr = computeACWR(allSessions, weekEnd);

  const status = niggleStatus(maxNiggle);

  // ── Next-week target & coaching notes ─────────────────────────────────────
  const notes: string[] = [];
  let nextWeekTargetKm = plannedVolumeKm;

  // Niggle drives the headline action.
  if (status === "Red") {
    notes.push(
      `🔴 Max niggle ${maxNiggle}/10 — STOP running. Rest or pool/bike only. See a physio if it persists >5 days.`
    );
    nextWeekTargetKm = 0;
  } else if (status === "Caution") {
    const cut = Math.round(actualVolumeKm * 0.75);
    notes.push(
      `🟠 Max niggle ${maxNiggle}/10 — cut volume 20–30% and swap a run for cross-train (tennis/bike).`
    );
    nextWeekTargetKm = cut;
  } else if (status === "Amber") {
    notes.push(
      `🟡 Max niggle ${maxNiggle}/10 — hold volume flat next week; don't add load until it settles.`
    );
    nextWeekTargetKm = Math.round(actualVolumeKm || plannedVolumeKm);
  } else {
    notes.push(`🟢 Niggle clear (${maxNiggle}/10) — proceed with the plan.`);
  }

  // Deload reminder.
  if (deload) {
    notes.push(
      `📉 Deload week (week ${weekIndex} of phase) — target is −25% (${plannedVolumeKm} km). Prioritise recovery.`
    );
  }

  // Progression cap: flag >10% jump vs prior week (only when niggle is benign).
  if (priorVolumeKm > 0 && status === "Green" && !deload) {
    const increase = (actualVolumeKm - priorVolumeKm) / priorVolumeKm;
    if (increase > 0.1) {
      notes.push(
        `⚠️ Volume jumped ${(increase * 100).toFixed(0)}% vs last week (${priorVolumeKm}→${actualVolumeKm} km) — exceeds the 10% rule. Cap next week near +10%.`
      );
      nextWeekTargetKm = Math.round(priorVolumeKm * 1.1);
    } else {
      // Healthy progression: nudge toward plan within +10% of this week.
      nextWeekTargetKm = Math.min(
        plannedVolumeKm,
        Math.round((actualVolumeKm || plannedVolumeKm) * 1.1)
      );
    }
  }

  // ACWR flags.
  if (acwr !== null) {
    if (acwr > 1.3) {
      notes.push(
        `📈 ACWR ${acwr.toFixed(2)} (>1.3) — acute load is spiking vs your 4-week baseline. Elevated injury risk; ease off.`
      );
    } else if (acwr < 0.8) {
      notes.push(
        `📉 ACWR ${acwr.toFixed(2)} (<0.8) — detraining zone; you can safely add a little load.`
      );
    } else {
      notes.push(`✅ ACWR ${acwr.toFixed(2)} — in the safe 0.8–1.3 sweet spot.`);
    }
  }

  // Decoupling: avg RPE rising while HR-at-effort isn't improving.
  const priorRpe = avg(
    priorSessions.map((s) => s.rpe).filter((v): v is number => v !== null)
  );
  if (avgRPE !== null && priorRpe !== null && avgRPE > priorRpe + 0.5) {
    notes.push(
      `🫀 Avg RPE rose ${priorRpe.toFixed(1)}→${avgRPE.toFixed(1)} at similar HR — possible fatigue/decoupling. Watch sleep, fuelling, and easy-day discipline.`
    );
  }

  return {
    weekOf,
    phase: phase.phase,
    plannedVolumeKm,
    actualVolumeKm,
    priorVolumeKm,
    avgHR,
    avgRPE,
    maxNiggle,
    acwr,
    status,
    nextWeekTargetKm: Math.max(0, nextWeekTargetKm),
    coachingNotes: notes,
  };
}
