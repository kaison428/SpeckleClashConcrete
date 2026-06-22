import { fetchSessions } from "@/lib/data";
import { groupByWeek } from "@/lib/week";
import {
  VolumeChart,
  HRPaceScatter,
  NiggleHeatmap,
  LongRunProgression,
  HRVTrend,
} from "./ChartsClient";

export const dynamic = "force-dynamic";

export default async function ChartsPage() {
  let sessions = await fetchSessions().catch(() => []);
  const weeks = groupByWeek(sessions);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto flex flex-col gap-6">
      <header>
        <h1
          className="text-4xl font-semibold"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-900)" }}
        >
          Charts & KPIs
        </h1>
        <p style={{ color: "var(--green-700)" }}>
          Aerobic trends, running economy, niggle history, long-run build.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <VolumeChart weeks={weeks} />
        <LongRunProgression sessions={sessions} />
      </div>

      <HRPaceScatter sessions={sessions} />

      <div className="grid md:grid-cols-2 gap-4">
        <NiggleHeatmap sessions={sessions} />
        <HRVTrend sessions={sessions} />
      </div>
    </div>
  );
}
