"use client";

import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from "recharts";
import type { Session } from "@/lib/types";
import type { WeekGroup } from "@/lib/week";
import { niggleStatus, STATUS_COLOR } from "@/lib/week";

const GREEN_500 = "#52b788";
const GREEN_800 = "#1e4d35";
const GREEN_300 = "#95d5b2";
const AMBER = "#f4a261";
const CREAM = "#f8f5f0";

const card: React.CSSProperties = {
  backgroundColor: "white",
  border: `1px solid ${GREEN_300}`,
  borderRadius: "0.75rem",
  padding: "1.25rem",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl mb-4"
      style={{ fontFamily: "var(--font-fraunces)", color: "var(--green-800)" }}
    >
      {children}
    </h2>
  );
}

// ── 1. Weekly volume bars ─────────────────────────────────────────────────────
export function VolumeChart({ weeks }: { weeks: WeekGroup[] }) {
  const data = weeks
    .slice(0, 16)
    .reverse()
    .map((w) => ({
      week: w.weekOf.slice(5), // MM-DD
      actual: w.totalKm,
      planned: 25, // TODO: wire planned from macrocycle when charts page is server-hydrated
    }));

  return (
    <div style={card}>
      <SectionTitle>Weekly volume (km)</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GREEN_300} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: GREEN_800 }} />
          <YAxis tick={{ fontSize: 11, fill: GREEN_800 }} />
          <Tooltip contentStyle={{ backgroundColor: CREAM, border: `1px solid ${GREEN_300}` }} />
          <Bar dataKey="actual" fill={GREEN_500} radius={[3, 3, 0, 0]} name="Actual km" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 2. HR vs pace scatter (running economy) ────────────────────────────────────
export function HRPaceScatter({ sessions }: { sessions: Session[] }) {
  const data = sessions
    .filter((s) => s.avgHR && s.distanceKm && s.durationMin && s.durationMin > 0)
    .map((s) => ({
      hr: s.avgHR!,
      paceMinKm: s.durationMin! / s.distanceKm!,
      date: s.date,
    }));

  return (
    <div style={card}>
      <SectionTitle>HR vs pace (running economy)</SectionTitle>
      <p className="text-xs mb-3" style={{ color: "var(--green-700)" }}>
        Bottom-left = faster at lower HR = improving economy. Each dot is one run.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GREEN_300} />
          <XAxis
            dataKey="hr"
            name="Avg HR"
            unit=" bpm"
            tick={{ fontSize: 11, fill: GREEN_800 }}
            domain={["auto", "auto"]}
          />
          <YAxis
            dataKey="paceMinKm"
            name="Pace"
            tickFormatter={(v: number) =>
              `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, "0")}`
            }
            tick={{ fontSize: 11, fill: GREEN_800 }}
          />
          <Tooltip
            formatter={(v, name) => {
              const n = typeof v === "number" ? v : 0;
              if (name === "Pace") {
                return [
                  `${Math.floor(n)}:${String(Math.round((n % 1) * 60)).padStart(2, "0")}/km`,
                  "Pace",
                ];
              }
              return [`${n} bpm`, String(name)];
            }}
            contentStyle={{ backgroundColor: CREAM, border: `1px solid ${GREEN_300}` }}
          />
          <Scatter data={data} fill={GREEN_500} opacity={0.75} />
          {/* Target pace 5:41/km = 5.683 */}
          <ReferenceLine y={5.683} stroke={AMBER} strokeDasharray="4 2" label={{ value: "5:41 target", fill: AMBER, fontSize: 10 }} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 3. Niggle heatmap calendar ─────────────────────────────────────────────────
export function NiggleHeatmap({ sessions }: { sessions: Session[] }) {
  const recent = sessions
    .filter((s) => s.niggle !== null)
    .slice(0, 60)
    .reverse();

  return (
    <div style={card}>
      <SectionTitle>Niggle calendar</SectionTitle>
      <p className="text-xs mb-3" style={{ color: "var(--green-700)" }}>
        Each square = one session. 0–2 green, 3–4 amber, 5–6 caution, 7+ red.
      </p>
      <div className="flex flex-wrap gap-1">
        {recent.map((s) => {
          const st = niggleStatus(s.niggle ?? 0);
          return (
            <div
              key={s.id}
              title={`${s.date} — ${s.sessionType} — niggle ${s.niggle}`}
              style={{
                width: "1.4rem",
                height: "1.4rem",
                borderRadius: "0.25rem",
                backgroundColor: STATUS_COLOR[st],
              }}
            />
          );
        })}
        {recent.length === 0 && (
          <span className="text-sm" style={{ color: "var(--green-700)" }}>
            No niggle data yet — fill in scores on the dashboard.
          </span>
        )}
      </div>
    </div>
  );
}

// ── 4. Long-run progression ────────────────────────────────────────────────────
export function LongRunProgression({ sessions }: { sessions: Session[] }) {
  const longRuns = sessions
    .filter((s) => s.sessionType === "Long Run" && s.distanceKm)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-20)
    .map((s) => ({ date: s.date.slice(5), km: s.distanceKm! }));

  return (
    <div style={card}>
      <SectionTitle>Long-run progression</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={longRuns} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GREEN_300} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: GREEN_800 }} />
          <YAxis tick={{ fontSize: 11, fill: GREEN_800 }} domain={[0, 36]} />
          <Tooltip contentStyle={{ backgroundColor: CREAM, border: `1px solid ${GREEN_300}` }} />
          <ReferenceLine y={32} stroke={AMBER} strokeDasharray="4 2" label={{ value: "32 km cap", fill: AMBER, fontSize: 10 }} />
          <Line
            type="monotone" dataKey="km" stroke={GREEN_500} strokeWidth={2}
            dot={{ fill: GREEN_800, r: 4 }} name="Distance km"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 5. RHR & HRV 7-day rolling avg ───────────────────────────────────────────
export function HRVTrend({ sessions }: { sessions: Session[] }) {
  const withMetrics = sessions
    .filter((s) => s.restingHR || s.hrv)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-30);

  // 7-day rolling averages
  const rolled = withMetrics.map((s, i) => {
    const window = withMetrics.slice(Math.max(0, i - 6), i + 1);
    const rhrVals = window.map((x) => x.restingHR).filter((v): v is number => v !== null);
    const hrvVals = window.map((x) => x.hrv).filter((v): v is number => v !== null);
    return {
      date: s.date.slice(5),
      rhr: rhrVals.length ? Math.round(rhrVals.reduce((a, b) => a + b, 0) / rhrVals.length) : null,
      hrv: hrvVals.length ? Math.round(hrvVals.reduce((a, b) => a + b, 0) / hrvVals.length) : null,
    };
  });

  return (
    <div style={card}>
      <SectionTitle>RHR & HRV (7-day rolling avg)</SectionTitle>
      <p className="text-xs mb-3" style={{ color: "var(--green-700)" }}>
        Falling RHR + rising HRV = adapting well. Spikes = fatigue or illness.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rolled} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GREEN_300} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: GREEN_800 }} />
          <YAxis yAxisId="rhr" tick={{ fontSize: 11, fill: GREEN_800 }} domain={["auto", "auto"]} />
          <YAxis yAxisId="hrv" orientation="right" tick={{ fontSize: 11, fill: GREEN_800 }} domain={["auto", "auto"]} />
          <Tooltip contentStyle={{ backgroundColor: CREAM, border: `1px solid ${GREEN_300}` }} />
          <Line yAxisId="rhr" type="monotone" dataKey="rhr" stroke={AMBER} strokeWidth={2} dot={false} name="RHR (bpm)" />
          <Line yAxisId="hrv" type="monotone" dataKey="hrv" stroke={GREEN_500} strokeWidth={2} dot={false} name="HRV (ms)" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--green-700)" }}>
        <span style={{ color: AMBER }}>— RHR (left axis)</span>
        <span style={{ color: GREEN_500 }}>— HRV (right axis)</span>
      </div>
    </div>
  );
}
