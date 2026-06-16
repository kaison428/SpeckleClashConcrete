import {
  findTrainingLogByStartTime,
  createTrainingLogEntry,
  getTrainingLog,
  updateTrainingLogEntry,
} from "@/lib/notion";
import { setLastSync } from "@/lib/syncState";
import type { PageObjectResponse } from "@notionhq/client";

function getDateProp(page: PageObjectResponse): string | null {
  const prop = page.properties["Date"];
  if (prop?.type === "date" && prop.date?.start) return prop.date.start;
  return null;
}

// ---------------------------------------------------------------------------
// Types for the Health Auto Export payload
// ---------------------------------------------------------------------------

type WorkoutPayload = {
  name: string;
  start: string;
  end: string;
  distance?: { qty: number; units: string };
  duration?: number; // seconds
  heartRate?: { average?: { qty: number } };
};

type MetricDataPoint = {
  date: string;
  qty: number;
};

type MetricPayload = {
  name: string;
  units: string;
  data: MetricDataPoint[];
};

type IngestBody = {
  data: {
    workouts?: WorkoutPayload[];
    metrics?: MetricPayload[];
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toKm(qty: number, units: string): number {
  if (units.toLowerCase() === "mi" || units.toLowerCase() === "miles") {
    return qty * 1.60934;
  }
  return qty;
}

function isoToDateString(iso: string): string {
  return iso.split("T")[0];
}

// ---------------------------------------------------------------------------
// POST /api/ingest
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // Auth check
  const authHeader = request.headers.get("Authorization");
  const expected = `Bearer ${process.env.INGEST_TOKEN}`;
  if (!authHeader || authHeader !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: IngestBody;
  try {
    body = (await request.json()) as IngestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let inserted = 0;
  let skipped = 0;

  try {
  // ---------------------------------------------------------------------------
  // Process workouts
  // ---------------------------------------------------------------------------

  const workouts = body.data?.workouts ?? [];

  for (const workout of workouts) {
    if (!workout.name.toLowerCase().includes("running")) continue;

    // Dedup check
    const existing = await findTrainingLogByStartTime(workout.start);
    if (existing) {
      skipped++;
      continue;
    }

    // Determine distance in km
    let distanceKm: number | undefined;
    if (workout.distance) {
      distanceKm = toKm(workout.distance.qty, workout.distance.units);
    }

    // Determine duration in minutes
    let durationMin: number | undefined;
    if (workout.duration !== undefined) {
      durationMin = workout.duration / 60;
    }

    // Determine session type
    const isLongRun =
      (distanceKm !== undefined && distanceKm >= 16) ||
      (workout.duration !== undefined && workout.duration >= 5400);
    const sessionType = isLongRun ? "Long Run" : "Easy Z2";

    // Average HR
    const avgHR = workout.heartRate?.average?.qty;

    await createTrainingLogEntry({
      date: isoToDateString(workout.start),
      startTime: workout.start,
      sessionType,
      distanceKm,
      durationMin,
      avgHR,
      source: "Apple Health",
    });

    inserted++;
  }

  // ---------------------------------------------------------------------------
  // Process metrics — fetch log once, then match by date
  // ---------------------------------------------------------------------------

  const metrics = body.data?.metrics ?? [];
  const relevantMetrics = metrics.filter(
    (m) => m.name === "resting_heart_rate" || m.name === "heart_rate_variability"
  );

  if (relevantMetrics.length > 0) {
    const existingEntries = await getTrainingLog();
    const pages = existingEntries.filter(
      (e): e is PageObjectResponse => e.object === "page"
    );

    for (const metric of relevantMetrics) {
      const isRestingHR = metric.name === "resting_heart_rate";

      for (const dataPoint of metric.data) {
        const dateStr = isoToDateString(dataPoint.date);
        const match = pages.find((p) => getDateProp(p) === dateStr);
        if (!match) continue;

        if (isRestingHR) {
          await updateTrainingLogEntry(match.id, { restingHR: dataPoint.qty });
        } else {
          await updateTrainingLogEntry(match.id, { hrv: dataPoint.qty });
        }
      }
    }
  }

  // Update last sync timestamp
  const lastSyncTs = new Date().toISOString();
  setLastSync(lastSyncTs);

  return Response.json({ inserted, skipped, lastSync: lastSyncTs });
  } catch (e) {
    // Notion call failed partway — report what landed so the webhook can retry.
    const message = e instanceof Error ? e.message : "Notion write failed";
    return Response.json(
      { error: message, inserted, skipped },
      { status: 502 }
    );
  }
}
