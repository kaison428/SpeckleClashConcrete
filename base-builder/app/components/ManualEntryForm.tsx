"use client";

import { useState, useTransition } from "react";
import { addManualSession } from "../actions";
import { SESSION_TYPES, RUN_SESSION_TYPES, type SessionType } from "@/lib/types";

const cardStyle: React.CSSProperties = {
  backgroundColor: "white",
  border: "1px solid var(--green-300)",
  borderRadius: "0.75rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--green-700)",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--green-300)",
  borderRadius: "0.5rem",
  padding: "0.4rem 0.6rem",
  fontSize: "0.9rem",
  width: "100%",
  backgroundColor: "var(--cream)",
};

export default function ManualEntryForm({ today }: { today: string }) {
  const [sessionType, setSessionType] = useState<SessionType>("Strength");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const isRun = RUN_SESSION_TYPES.includes(sessionType);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await addManualSession(formData);
      setMessage(res.ok ? "Session added." : res.error ?? "Failed.");
    });
  }

  return (
    <form action={onSubmit} style={cardStyle} className="p-5 flex flex-col gap-4">
      <h3
        className="text-lg"
        style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-800)" }}
      >
        Add a session
      </h3>
      <p className="text-sm" style={{ color: "var(--green-700)" }}>
        Log strength, cross-train, or rest days — or a manual run if a sync was
        missed.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span style={labelStyle}>Date</span>
          <input type="date" name="date" defaultValue={today} style={inputStyle} required />
        </label>
        <label className="flex flex-col gap-1">
          <span style={labelStyle}>Session Type</span>
          <select
            name="sessionType"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as SessionType)}
            style={inputStyle}
            required
          >
            {SESSION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {isRun && (
          <>
            <label className="flex flex-col gap-1">
              <span style={labelStyle}>Distance (km)</span>
              <input type="number" step="0.1" name="distanceKm" style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span style={labelStyle}>Avg HR</span>
              <input type="number" name="avgHR" style={inputStyle} />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1">
          <span style={labelStyle}>Duration (min)</span>
          <input type="number" step="1" name="durationMin" style={inputStyle} />
        </label>
        <label className="flex flex-col gap-1">
          <span style={labelStyle}>RPE (1–10)</span>
          <input type="number" min="1" max="10" name="rpe" style={inputStyle} />
        </label>
        <label className="flex flex-col gap-1">
          <span style={labelStyle}>Niggle (0–10)</span>
          <input type="number" min="0" max="10" name="niggle" style={inputStyle} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span style={labelStyle}>Notes</span>
        <textarea name="notes" rows={2} style={inputStyle} />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          style={{
            backgroundColor: "var(--green-700)",
            color: "white",
            borderRadius: "0.5rem",
            padding: "0.5rem 1.1rem",
            fontSize: "0.9rem",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Saving…" : "Add session"}
        </button>
        {message && (
          <span className="text-sm" style={{ color: "var(--green-700)" }}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
