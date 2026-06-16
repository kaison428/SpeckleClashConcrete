export default function VolumeBar({
  actual,
  planned,
}: {
  actual: number;
  planned: number;
}) {
  const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const over = planned > 0 && actual > planned;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "white", border: "1px solid var(--green-300)" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span
          className="text-lg"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-900)" }}
        >
          This week&rsquo;s volume
        </span>
        <span className="text-sm" style={{ color: "var(--green-700)" }}>
          {actual.toFixed(1)} / {planned} km
        </span>
      </div>
      <div
        style={{
          height: "0.9rem",
          borderRadius: "9999px",
          backgroundColor: "var(--green-300)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: over ? "var(--amber)" : "var(--green-500)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span className="text-xs mt-2 inline-block" style={{ color: "var(--green-700)" }}>
        {planned > 0 ? `${Math.round((actual / planned) * 100)}% of plan` : "No plan set"}
        {over ? " · over target" : ""}
      </span>
    </div>
  );
}
