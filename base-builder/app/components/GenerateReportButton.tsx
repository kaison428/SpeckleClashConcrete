"use client";

import { useState, useTransition } from "react";
import { generateWeeklyReport } from "../actions";

export default function GenerateReportButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await generateWeeklyReport();
      setMessage(
        res.ok
          ? "Weekly report written to Notion ✓"
          : res.error ?? "Failed to generate report."
      );
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        style={{
          backgroundColor: "var(--green-800)",
          color: "white",
          borderRadius: "0.5rem",
          padding: "0.6rem 1.2rem",
          fontSize: "0.95rem",
          fontFamily: "var(--font-fraunces)",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? "Running engine…" : "Generate Weekly Report"}
      </button>
      {message && (
        <span className="text-sm" style={{ color: "var(--green-700)" }}>
          {message}
        </span>
      )}
    </div>
  );
}
