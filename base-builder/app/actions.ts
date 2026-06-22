"use server";

import { revalidatePath } from "next/cache";
import {
  createTrainingLogEntry,
  updateTrainingLogEntry,
  createWeeklyReport,
} from "@/lib/notion";
import { fetchSessions } from "@/lib/data";
import { analyzeWeek } from "@/lib/engine";
import { startOfWeek } from "@/lib/week";
import type { SessionType } from "@/lib/types";

export type ActionResult = { ok: boolean; error?: string };

// Add RPE / Niggle / Notes to an existing (usually auto-imported) session.
export async function updateSessionFields(
  pageId: string,
  fields: { rpe?: number | null; niggle?: number | null; notes?: string | null }
): Promise<ActionResult> {
  try {
    await updateTrainingLogEntry(pageId, {
      rpe: fields.rpe ?? undefined,
      niggle: fields.niggle ?? undefined,
      notes: fields.notes ?? undefined,
    });
    revalidatePath("/");
    revalidatePath("/ledger");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

// Add a new session manually: non-run sessions (Strength/Cross-train/Rest) or a
// manual run fallback when a sync is missed.
export async function addManualSession(formData: FormData): Promise<ActionResult> {
  try {
    const date = String(formData.get("date") || "");
    const sessionType = String(formData.get("sessionType") || "") as SessionType;
    if (!date || !sessionType) {
      return { ok: false, error: "Date and session type are required." };
    }

    const num = (key: string): number | undefined => {
      const v = formData.get(key);
      if (v === null || v === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const str = (key: string): string | undefined => {
      const v = formData.get(key);
      const s = v === null ? "" : String(v).trim();
      return s.length > 0 ? s : undefined;
    };

    await createTrainingLogEntry({
      date,
      sessionType,
      distanceKm: num("distanceKm"),
      durationMin: num("durationMin"),
      avgHR: num("avgHR"),
      rpe: num("rpe"),
      niggle: num("niggle"),
      source: "Manual",
      notes: str("notes"),
    });

    revalidatePath("/");
    revalidatePath("/ledger");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Create failed" };
  }
}

// Run the analysis engine over a given week (default: current week) and write a
// row into the Weekly Coaching Report database.
export async function generateWeeklyReport(
  weekOfISO?: string
): Promise<ActionResult> {
  try {
    const sessions = await fetchSessions();
    const weekStart = weekOfISO
      ? startOfWeek(new Date(weekOfISO + "T12:00:00"))
      : startOfWeek(new Date());

    const a = analyzeWeek(sessions, weekStart);

    await createWeeklyReport({
      weekOf: a.weekOf,
      phase: a.phase,
      plannedVolumeKm: a.plannedVolumeKm,
      actualVolumeKm: a.actualVolumeKm,
      avgHR: a.avgHR ?? undefined,
      avgRPE: a.avgRPE ?? undefined,
      maxNiggle: a.maxNiggle,
      acwr: a.acwr ?? undefined,
      status: a.status,
      nextWeekTargetKm: a.nextWeekTargetKm,
      coachingNotes: a.coachingNotes.join("\n"),
    });

    revalidatePath("/");
    revalidatePath("/reports");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Report generation failed",
    };
  }
}
