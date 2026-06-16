"use client";

import { useState, useTransition } from "react";
import { updateSessionFields } from "../actions";
import type { Session } from "@/lib/types";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--green-300)",
  borderRadius: "0.4rem",
  padding: "0.3rem 0.5rem",
  fontSize: "0.85rem",
  width: "4.5rem",
  backgroundColor: "var(--cream)",
};

export default function FillRunFields({ session }: { session: Session }) {
  const [rpe, setRpe] = useState(session.rpe?.toString() ?? "");
  const [niggle, setNiggle] = useState(session.niggle?.toString() ?? "");
  const [notes, setNotes] = useState(session.notes ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      const res = await updateSessionFields(session.id, {
        rpe: rpe === "" ? null : Number(rpe),
        niggle: niggle === "" ? null : Number(niggle),
        notes: notes === "" ? null : notes,
      });
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3 p-3 rounded-lg"
      style={{ backgroundColor: "var(--cream)", border: "1px solid var(--green-300)" }}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium" style={{ color: "var(--green-900)" }}>
          {session.name}
        </span>
        <span className="text-xs" style={{ color: "var(--green-700)" }}>
          {session.distanceKm ? `${session.distanceKm} km · ` : ""}
          {session.avgHR ? `${session.avgHR} bpm` : "auto-imported"}
        </span>
      </div>
      <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--green-700)" }}>
        RPE
        <input
          type="number" min="1" max="10" value={rpe}
          onChange={(e) => setRpe(e.target.value)} style={inputStyle}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--green-700)" }}>
        Niggle
        <input
          type="number" min="0" max="10" value={niggle}
          onChange={(e) => setNiggle(e.target.value)} style={inputStyle}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs flex-1 min-w-[8rem]" style={{ color: "var(--green-700)" }}>
        Notes
        <input
          type="text" value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...inputStyle, width: "100%" }}
        />
      </label>
      <button
        type="button" onClick={save} disabled={pending}
        style={{
          backgroundColor: "var(--green-700)", color: "white",
          borderRadius: "0.4rem", padding: "0.35rem 0.8rem",
          fontSize: "0.8rem", opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? "…" : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
