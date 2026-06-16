"use client";

import { useState, useTransition } from "react";
import { updateSessionFields } from "../actions";
import type { Session } from "@/lib/types";
import type { WeekGroup } from "@/lib/week";

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.6rem",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--green-300)",
};
const td: React.CSSProperties = {
  padding: "0.45rem 0.6rem",
  fontSize: "0.85rem",
  borderTop: "1px solid var(--green-300)",
  color: "var(--green-900)",
};
const editInput: React.CSSProperties = {
  width: "3.2rem",
  border: "1px solid var(--green-300)",
  borderRadius: "0.35rem",
  padding: "0.2rem 0.35rem",
  fontSize: "0.8rem",
  backgroundColor: "var(--cream)",
};

function fmt(n: number | null, suffix = ""): string {
  return n === null ? "—" : `${n}${suffix}`;
}

function EditableRow({ s }: { s: Session }) {
  const [rpe, setRpe] = useState(s.rpe?.toString() ?? "");
  const [niggle, setNiggle] = useState(s.niggle?.toString() ?? "");
  const [notes, setNotes] = useState(s.notes ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const dirty =
    rpe !== (s.rpe?.toString() ?? "") ||
    niggle !== (s.niggle?.toString() ?? "") ||
    notes !== (s.notes ?? "");

  function save() {
    startTransition(async () => {
      const res = await updateSessionFields(s.id, {
        rpe: rpe === "" ? null : Number(rpe),
        niggle: niggle === "" ? null : Number(niggle),
        notes: notes === "" ? null : notes,
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <tr>
      <td style={td}>{s.date}</td>
      <td style={td}>{s.sessionType}</td>
      <td style={td}>{fmt(s.distanceKm, " km")}</td>
      <td style={td}>{fmt(s.durationMin, " min")}</td>
      <td style={td}>{fmt(s.avgHR)}</td>
      <td style={td}>
        <input style={editInput} value={rpe} onChange={(e) => setRpe(e.target.value)} type="number" min="1" max="10" />
      </td>
      <td style={td}>
        <input style={editInput} value={niggle} onChange={(e) => setNiggle(e.target.value)} type="number" min="0" max="10" />
      </td>
      <td style={td}>
        <input
          style={{ ...editInput, width: "10rem" }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          type="text"
        />
      </td>
      <td style={td}>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          style={{
            backgroundColor: dirty ? "var(--green-700)" : "var(--green-300)",
            color: "white",
            borderRadius: "0.35rem",
            padding: "0.25rem 0.6rem",
            fontSize: "0.75rem",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "…" : saved ? "✓" : "Save"}
        </button>
      </td>
    </tr>
  );
}

function toCSV(weeks: WeekGroup[]): string {
  const header = [
    "Date", "Session Type", "Distance km", "Duration min", "Avg HR",
    "RPE", "Niggle", "Resting HR", "HRV", "Source", "Notes",
  ];
  const rows: string[][] = [];
  for (const w of weeks) {
    for (const s of w.sessions) {
      rows.push([
        s.date, s.sessionType,
        s.distanceKm?.toString() ?? "", s.durationMin?.toString() ?? "",
        s.avgHR?.toString() ?? "", s.rpe?.toString() ?? "",
        s.niggle?.toString() ?? "", s.restingHR?.toString() ?? "",
        s.hrv?.toString() ?? "", s.source ?? "",
        (s.notes ?? "").replace(/"/g, '""'),
      ]);
    }
  }
  return [header, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
}

export default function LedgerClient({ weeks }: { weeks: WeekGroup[] }) {
  function downloadCSV() {
    const blob = new Blob([toCSV(weeks)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base-builder-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-900)" }}>
          Training Ledger
        </h1>
        <button
          type="button"
          onClick={downloadCSV}
          style={{
            backgroundColor: "var(--green-700)", color: "white",
            borderRadius: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.85rem",
          }}
        >
          Export CSV
        </button>
      </div>

      {weeks.length === 0 && (
        <p style={{ color: "var(--green-700)" }}>No sessions logged yet.</p>
      )}

      {weeks.map((w) => (
        <div key={w.weekOf} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--green-300)" }}>
          <div
            className="flex flex-wrap items-center gap-4 px-4 py-2"
            style={{ backgroundColor: "var(--green-800)", color: "white" }}
          >
            <span style={{ fontFamily: "var(--font-fraunces)" }}>Week of {w.weekOf}</span>
            <span className="text-sm" style={{ color: "var(--green-300)" }}>
              {w.totalKm} km · {w.runCount} runs
              {w.avgHR ? ` · ${w.avgHR} bpm` : ""}
              {w.avgRPE !== null ? ` · RPE ${w.avgRPE}` : ""}
              {` · max niggle ${w.maxNiggle}`}
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
            <thead style={{ backgroundColor: "var(--green-700)" }}>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Type</th>
                <th style={th}>Dist</th>
                <th style={th}>Dur</th>
                <th style={th}>HR</th>
                <th style={th}>RPE</th>
                <th style={th}>Niggle</th>
                <th style={th}>Notes</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {w.sessions
                .slice()
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((s) => (
                  <EditableRow key={s.id} s={s} />
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
