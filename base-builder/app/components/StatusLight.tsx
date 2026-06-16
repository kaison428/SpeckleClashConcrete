import type { Status } from "@/lib/types";
import { STATUS_COLOR, STATUS_GUIDANCE } from "@/lib/week";

export default function StatusLight({
  status,
  maxNiggle,
}: {
  status: Status;
  maxNiggle: number;
}) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{ backgroundColor: "white", border: "1px solid var(--green-300)" }}
    >
      <span
        aria-label={`Status ${status}`}
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "9999px",
          backgroundColor: STATUS_COLOR[status],
          boxShadow: `0 0 0 4px color-mix(in srgb, ${STATUS_COLOR[status]} 25%, transparent)`,
          flexShrink: 0,
        }}
      />
      <div className="flex flex-col">
        <span
          className="text-lg"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-900)" }}
        >
          Niggle: {status}
        </span>
        <span className="text-sm" style={{ color: "var(--green-700)" }}>
          Max niggle this week: {maxNiggle}/10 — {STATUS_GUIDANCE[status]}
        </span>
      </div>
    </div>
  );
}
