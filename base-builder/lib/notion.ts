import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client";

// Server-side only — never import this in client components
const notion = new Client({ auth: process.env.NOTION_TOKEN });

function getDbId(envVar: string | undefined, name: string): string {
  if (!envVar) throw new Error(`Missing env var: ${name}`);
  return envVar;
}

// ---------------------------------------------------------------------------
// Training Log (DB1)
// ---------------------------------------------------------------------------

export type TrainingLogEntry = {
  date: string; // ISO date string YYYY-MM-DD
  sessionType:
    | "Easy Z2"
    | "Easy+Strides"
    | "Long Run"
    | "MP Block"
    | "Strength"
    | "Cross-train"
    | "Rest";
  distanceKm?: number;
  durationMin?: number;
  avgHR?: number;
  rpe?: number;
  niggle?: number;
  restingHR?: number;
  hrv?: number;
  source?: "Apple Health" | "Manual";
  notes?: string;
  startTime?: string;
};

export type TrainingLogUpdateFields = {
  rpe?: number;
  niggle?: number;
  notes?: string;
  restingHR?: number;
  hrv?: number;
};

export async function getTrainingLog(): Promise<QueryDataSourceResponse["results"]> {
  const dbId = getDbId(
    process.env.NOTION_TRAINING_LOG_DB_ID,
    "NOTION_TRAINING_LOG_DB_ID"
  );

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const response = await notion.dataSources.query({
    data_source_id: dbId,
    filter: {
      property: "Date",
      date: { on_or_after: ninetyDaysAgo },
    },
    sorts: [{ property: "Date", direction: "descending" }],
  });

  return response.results;
}

export async function createTrainingLogEntry(
  data: TrainingLogEntry
): Promise<PageObjectResponse> {
  const dbId = getDbId(
    process.env.NOTION_TRAINING_LOG_DB_ID,
    "NOTION_TRAINING_LOG_DB_ID"
  );

  const properties: Record<string, unknown> = {
    Date: { date: { start: data.date } },
    "Session Type": { select: { name: data.sessionType } },
  };

  if (data.distanceKm !== undefined) {
    properties["Distance km"] = { number: data.distanceKm };
  }
  if (data.durationMin !== undefined) {
    properties["Duration min"] = { number: data.durationMin };
  }
  if (data.avgHR !== undefined) {
    properties["Avg HR"] = { number: data.avgHR };
  }
  if (data.rpe !== undefined) {
    properties["RPE"] = { number: data.rpe };
  }
  if (data.niggle !== undefined) {
    properties["Niggle"] = { number: data.niggle };
  }
  if (data.restingHR !== undefined) {
    properties["Resting HR"] = { number: data.restingHR };
  }
  if (data.hrv !== undefined) {
    properties["HRV"] = { number: data.hrv };
  }
  if (data.source !== undefined) {
    properties["Source"] = { select: { name: data.source } };
  }
  if (data.notes !== undefined) {
    properties["Notes"] = {
      rich_text: [{ text: { content: data.notes } }],
    };
  }
  if (data.startTime !== undefined) {
    properties["Start Time"] = {
      rich_text: [{ text: { content: data.startTime } }],
    };
  }

  const response = await notion.pages.create({
    parent: { data_source_id: dbId },
    properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
  });

  return response as PageObjectResponse;
}

export async function findTrainingLogByStartTime(
  startISO: string
): Promise<PageObjectResponse | null> {
  const dbId = getDbId(
    process.env.NOTION_TRAINING_LOG_DB_ID,
    "NOTION_TRAINING_LOG_DB_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dbId,
    filter: {
      property: "Start Time",
      rich_text: { equals: startISO },
    },
    page_size: 1,
  });

  if (response.results.length === 0) return null;

  const first = response.results[0];
  if (first.object === "page") return first as PageObjectResponse;
  return null;
}

export async function updateTrainingLogEntry(
  pageId: string,
  updates: TrainingLogUpdateFields
): Promise<void> {
  const properties: Record<string, unknown> = {};

  if (updates.rpe !== undefined) {
    properties["RPE"] = { number: updates.rpe };
  }
  if (updates.niggle !== undefined) {
    properties["Niggle"] = { number: updates.niggle };
  }
  if (updates.notes !== undefined) {
    properties["Notes"] = {
      rich_text: [{ text: { content: updates.notes } }],
    };
  }
  if (updates.restingHR !== undefined) {
    properties["Resting HR"] = { number: updates.restingHR };
  }
  if (updates.hrv !== undefined) {
    properties["HRV"] = { number: updates.hrv };
  }

  await notion.pages.update({
    page_id: pageId,
    properties: properties as Parameters<typeof notion.pages.update>[0]["properties"],
  });
}

// ---------------------------------------------------------------------------
// Weekly Coaching Report (DB2)
// ---------------------------------------------------------------------------

export type WeeklyReportEntry = {
  weekOf: string; // ISO date YYYY-MM-DD (start of week)
  phase?: string;
  plannedVolumeKm?: number;
  actualVolumeKm?: number;
  avgHR?: number;
  avgRPE?: number;
  maxNiggle?: number;
  acwr?: number;
  status?: "Green" | "Amber" | "Caution" | "Red";
  nextWeekTargetKm?: number;
  coachingNotes?: string;
};

export async function getWeeklyReports(): Promise<QueryDataSourceResponse["results"]> {
  const dbId = getDbId(
    process.env.NOTION_WEEKLY_REPORT_DB_ID,
    "NOTION_WEEKLY_REPORT_DB_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dbId,
    sorts: [{ property: "Week Of", direction: "descending" }],
  });

  return response.results;
}

export async function createWeeklyReport(
  data: WeeklyReportEntry
): Promise<PageObjectResponse> {
  const dbId = getDbId(
    process.env.NOTION_WEEKLY_REPORT_DB_ID,
    "NOTION_WEEKLY_REPORT_DB_ID"
  );

  const properties: Record<string, unknown> = {
    "Week Of": { date: { start: data.weekOf } },
  };

  if (data.phase !== undefined) {
    properties["Phase"] = { select: { name: data.phase } };
  }
  if (data.plannedVolumeKm !== undefined) {
    properties["Planned Volume km"] = { number: data.plannedVolumeKm };
  }
  if (data.actualVolumeKm !== undefined) {
    properties["Actual Volume km"] = { number: data.actualVolumeKm };
  }
  if (data.avgHR !== undefined) {
    properties["Avg HR"] = { number: data.avgHR };
  }
  if (data.avgRPE !== undefined) {
    properties["Avg RPE"] = { number: data.avgRPE };
  }
  if (data.maxNiggle !== undefined) {
    properties["Max Niggle"] = { number: data.maxNiggle };
  }
  if (data.acwr !== undefined) {
    properties["ACWR"] = { number: data.acwr };
  }
  if (data.status !== undefined) {
    properties["Status"] = { select: { name: data.status } };
  }
  if (data.nextWeekTargetKm !== undefined) {
    properties["Next Week Target km"] = { number: data.nextWeekTargetKm };
  }
  if (data.coachingNotes !== undefined) {
    properties["Coaching Notes"] = {
      rich_text: [{ text: { content: data.coachingNotes } }],
    };
  }

  const response = await notion.pages.create({
    parent: { data_source_id: dbId },
    properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
  });

  return response as PageObjectResponse;
}
