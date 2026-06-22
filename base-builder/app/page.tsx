import {
  getCurrentPhase,
  getWeekNumber,
  isDeloadWeek,
  weeksUntilDeload,
  getPlannedVolumeForWeek,
  RACE_DATE,
} from "@/lib/macrocycle";
import { fetchSessions } from "@/lib/data";
import { startOfWeek, weekKey, niggleStatus, isRun } from "@/lib/week";
import { getLastSync } from "@/lib/syncState";
import type { Session } from "@/lib/types";
import StatusLight from "./components/StatusLight";
import VolumeBar from "./components/VolumeBar";
import ManualEntryForm from "./components/ManualEntryForm";
import FillRunFields from "./components/FillRunFields";
import GenerateReportButton from "./components/GenerateReportButton";

export const dynamic = "force-dynamic";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-1"
      style={{ backgroundColor: "var(--green-800)", color: "white" }}
    >
      <span className="text-xs uppercase tracking-widest" style={{ color: "var(--green-300)" }}>
        {label}
      </span>
      <span className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
        {value}
      </span>
      {sub && <span className="text-xs" style={{ color: "var(--green-300)" }}>{sub}</span>}
    </div>
  );
}

function lastSyncLabel(sessions: Session[]): string {
  const inMemory = getLastSync();
  // Fall back to the newest Apple Health import time (survives cold starts).
  const imported = sessions
    .filter((s) => s.source === "Apple Health" && s.startTime)
    .map((s) => s.startTime!)
    .sort()
    .pop();
  const latest = [inMemory, imported].filter(Boolean).sort().pop();
  if (!latest) return "Waiting for first sync";
  const d = new Date(latest);
  return d.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

export default async function DashboardPage() {
  const now = new Date();
  const phase = getCurrentPhase();
  const weekNum = getWeekNumber(now);
  const deload = isDeloadWeek(weekNum);
  const untilDeload = weeksUntilDeload(weekNum);
  const plannedKm = getPlannedVolumeForWeek(now);
  const daysToRace = Math.ceil((RACE_DATE.getTime() - now.getTime()) / 86400000);
  const todayISO = now.toISOString().split("T")[0];
  const thisWeekKey = startOfWeek(now).toISOString().split("T")[0];

  let sessions: Session[] = [];
  let loadError: string | null = null;
  try {
    sessions = await fetchSessions();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not reach Notion.";
  }

  const thisWeek = sessions.filter((s) => weekKey(s.date) === thisWeekKey);
  const actualKm = Math.round(thisWeek.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0) * 10) / 10;
  const niggles = thisWeek.map((s) => s.niggle).filter((v): v is number => v !== null);
  const maxNiggle = niggles.length ? Math.max(...niggles) : 0;
  const status = niggleStatus(maxNiggle);

  // Auto-imported runs still missing RPE or Niggle (recent first).
  const needsInput = sessions
    .filter((s) => s.source === "Apple Health" && isRun(s) && (s.rpe === null || s.niggle === null))
    .slice(0, 5);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto flex flex-col gap-6">
      <header>
        <h1
          className="text-4xl font-semibold"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-900)" }}
        >
          Base Builder
        </h1>
        <p style={{ color: "var(--green-700)" }}>
          {phase.phase} phase · Week {weekNum}
          {deload ? " · DELOAD week" : ` · deload in ${untilDeload} wk`}
        </p>
      </header>

      {loadError && (
        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--amber)", color: "var(--green-900)" }}>
          Couldn&rsquo;t load data from Notion: {loadError}. Check your{" "}
          <code>NOTION_TOKEN</code> and that the integration is connected to the
          Base Builder page (see SETUP.md).
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Phase" value={phase.phase} sub={`${phase.targetVolumeKm} km/wk target`} />
        <StatCard label="Week" value={`Week ${weekNum}`} sub={deload ? "deload" : `deload in ${untilDeload}`} />
        <StatCard label="Long-run cap" value={`${phase.longRunKm} km`} sub="this phase" />
        <StatCard label="Days to race" value={daysToRace > 0 ? `${daysToRace}` : "Race!"} sub={RACE_DATE.toDateString().slice(4)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <VolumeBar actual={actualKm} planned={plannedKm} />
        <StatusLight status={status} maxNiggle={maxNiggle} />
      </div>

      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ backgroundColor: "var(--green-900)", color: "var(--green-300)" }}
      >
        <span className="text-sm font-medium">Last sync:</span>
        <span className="text-sm">{lastSyncLabel(sessions)}</span>
        <span className="text-xs ml-auto" style={{ color: "var(--green-500)" }}>
          Health Auto Export only fires while your iPhone is unlocked.
        </span>
      </div>

      {needsInput.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl" style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-800)" }}>
            Fill in today&rsquo;s runs
          </h2>
          <p className="text-sm -mt-2" style={{ color: "var(--green-700)" }}>
            These runs synced from Apple Health but still need your RPE and niggle score.
          </p>
          {needsInput.map((s) => (
            <FillRunFields key={s.id} session={s} />
          ))}
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <ManualEntryForm today={todayISO} />
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ backgroundColor: "white", border: "1px solid var(--green-300)" }}
        >
          <h3 className="text-lg" style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-800)" }}>
            Weekly coaching report
          </h3>
          <p className="text-sm" style={{ color: "var(--green-700)" }}>
            Run the analysis engine over this week and write a row to the Weekly
            Coaching Report in Notion — volume, ACWR, niggle status, and notes.
          </p>
          <GenerateReportButton />
        </div>
      </div>
    </div>
  );
}
