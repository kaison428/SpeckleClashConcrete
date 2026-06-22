// Server-only module — imports the Notion client (which reads NOTION_TOKEN).
// Never import this from a "use client" component.
import { getTrainingLog, getWeeklyReports } from "./notion";
import { parseSession, parseWeeklyReport, isPage } from "./parse";
import type { Session, WeeklyReport } from "./types";

// Server-only read helpers that return clean domain objects for the UI.

export async function fetchSessions(): Promise<Session[]> {
  const results = await getTrainingLog();
  return results.filter(isPage).map(parseSession);
}

export async function fetchWeeklyReports(): Promise<WeeklyReport[]> {
  const results = await getWeeklyReports();
  return results.filter(isPage).map(parseWeeklyReport);
}
