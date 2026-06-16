import type { PageObjectResponse } from "@notionhq/client";
import type { Session, SessionType, Source, WeeklyReport, Status } from "./types";

// Notion property values are deeply nested unions; these helpers pull out the
// scalar we care about and return null when the property is empty or absent.

type Props = PageObjectResponse["properties"];

function numberProp(props: Props, name: string): number | null {
  const p = props[name];
  if (p?.type === "number") return p.number;
  return null;
}

function selectProp(props: Props, name: string): string | null {
  const p = props[name];
  if (p?.type === "select") return p.select?.name ?? null;
  return null;
}

function dateProp(props: Props, name: string): string | null {
  const p = props[name];
  if (p?.type === "date") return p.date?.start ?? null;
  return null;
}

function richTextProp(props: Props, name: string): string | null {
  const p = props[name];
  if (p?.type === "rich_text") {
    const text = p.rich_text.map((t) => t.plain_text).join("");
    return text.length > 0 ? text : null;
  }
  return null;
}

function titleProp(props: Props, name: string): string | null {
  const p = props[name];
  if (p?.type === "title") {
    const text = p.title.map((t) => t.plain_text).join("");
    return text.length > 0 ? text : null;
  }
  return null;
}

export function parseSession(page: PageObjectResponse): Session {
  const props = page.properties;
  const sessionType = (selectProp(props, "Session Type") ??
    "Easy Z2") as SessionType;
  const source = selectProp(props, "Source") as Source | null;

  return {
    id: page.id,
    date: dateProp(props, "Date") ?? page.created_time.split("T")[0],
    name: titleProp(props, "Name") ?? sessionType,
    sessionType,
    distanceKm: numberProp(props, "Distance km"),
    durationMin: numberProp(props, "Duration min"),
    avgHR: numberProp(props, "Avg HR"),
    rpe: numberProp(props, "RPE"),
    niggle: numberProp(props, "Niggle"),
    restingHR: numberProp(props, "Resting HR"),
    hrv: numberProp(props, "HRV"),
    source,
    startTime: richTextProp(props, "Start Time"),
    notes: richTextProp(props, "Notes"),
  };
}

export function parseWeeklyReport(page: PageObjectResponse): WeeklyReport {
  const props = page.properties;
  return {
    id: page.id,
    weekOf: dateProp(props, "Week Of") ?? page.created_time.split("T")[0],
    phase: selectProp(props, "Phase"),
    plannedVolumeKm: numberProp(props, "Planned Volume km"),
    actualVolumeKm: numberProp(props, "Actual Volume km"),
    avgHR: numberProp(props, "Avg HR"),
    avgRPE: numberProp(props, "Avg RPE"),
    maxNiggle: numberProp(props, "Max Niggle"),
    acwr: numberProp(props, "ACWR"),
    status: selectProp(props, "Status") as Status | null,
    nextWeekTargetKm: numberProp(props, "Next Week Target km"),
    coachingNotes: richTextProp(props, "Coaching Notes"),
  };
}

export function isPage(
  result: { object: string } & Record<string, unknown>
): result is PageObjectResponse {
  return result.object === "page" && "properties" in result;
}
