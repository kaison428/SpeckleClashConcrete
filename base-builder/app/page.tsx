import { getCurrentPhase, getWeekNumber, RACE_DATE } from "@/lib/macrocycle";

export default function DashboardPage() {
  const phase = getCurrentPhase();
  const now = new Date();
  const weekNum = getWeekNumber(now);

  const daysToRace = Math.ceil(
    (RACE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const stats = [
    { label: "Phase", value: phase.phase },
    { label: "Week", value: `Week ${weekNum}` },
    { label: "Planned Volume", value: `${phase.targetVolumeKm} km / mo` },
    { label: "Days to Race", value: daysToRace > 0 ? `${daysToRace}` : "Race day!" },
  ];

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <h1
        className="text-4xl font-semibold mb-2"
        style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-900)" }}
      >
        Base Builder
      </h1>
      <p className="mb-8" style={{ color: "var(--green-700)" }}>
        Marathon Coaching Dashboard
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-10 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-5 flex flex-col gap-1"
            style={{ backgroundColor: "var(--green-800)", color: "white" }}
          >
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: "var(--green-300)" }}
            >
              {stat.label}
            </span>
            <span
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Last sync */}
      <div
        className="rounded-xl p-5 mb-6 flex items-center gap-3"
        style={{ backgroundColor: "var(--green-900)", color: "var(--green-300)" }}
      >
        <span className="text-sm font-medium">Last Sync:</span>
        <span className="text-sm">Waiting for first sync</span>
      </div>

      {/* Race countdown */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          border: "1px solid var(--green-500)",
          backgroundColor: "var(--cream)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-1"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-800)" }}
        >
          Race Countdown
        </h2>
        <p style={{ color: "var(--green-700)" }}>
          {daysToRace > 0
            ? `${daysToRace} days until race day (${RACE_DATE.toDateString()})`
            : "Race day is here!"}
        </p>
      </div>

      {/* Step 2 note */}
      <div
        className="rounded-xl p-4 text-sm"
        style={{
          backgroundColor: "var(--amber)",
          color: "var(--green-900)",
        }}
      >
        Manual entry and full dashboard coming in Step 2.
      </div>
    </div>
  );
}
