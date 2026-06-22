import { fetchSessions } from "@/lib/data";
import { groupByWeek } from "@/lib/week";
import type { WeekGroup } from "@/lib/week";
import LedgerClient from "./LedgerClient";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  let weeks: WeekGroup[] = [];
  let loadError: string | null = null;
  try {
    const sessions = await fetchSessions();
    weeks = groupByWeek(sessions);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not reach Notion.";
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {loadError ? (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: "var(--amber)", color: "var(--green-900)" }}
        >
          Couldn&rsquo;t load data from Notion: {loadError}. See SETUP.md.
        </div>
      ) : (
        <LedgerClient weeks={weeks} />
      )}
    </div>
  );
}
