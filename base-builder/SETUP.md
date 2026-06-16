# Base Builder — Setup

The Notion side is **already built for you**. There's one 2-minute manual step
only you can do (Notion makes you create the access token by hand), then you're
running.

## What already exists in your Notion

A page **🌿 Base Builder — Marathon Dashboard** containing two databases:

| Database | What it holds | Data source ID (already in env example) |
|---|---|---|
| **Training Log** | one row per session, auto-imported runs + manual sessions | `7bad049e-69b2-4212-9531-e9e2834b42fa` |
| **Weekly Coaching Report** | one row per week, written by the engine | `5d19947f-4e86-4cf4-b077-d1ca5359637c` |

The Training Log is already seeded with a week of sample sessions so the
dashboard isn't empty on first run.

## The one manual step: create an integration token

The app talks to Notion using an *internal integration token*. Notion only lets
you mint this from the UI — it can't be created programmatically.

1. Go to **https://www.notion.so/profile/integrations** → **New integration**.
   - Name it `Base Builder`, pick your workspace, submit.
   - Copy the **Internal Integration Secret** (starts with `ntn_`).
2. Open the **🌿 Base Builder — Marathon Dashboard** page in Notion.
   - Click the **•••** menu (top-right) → **Connections** → search `Base Builder`
     → add it. This cascades access to both databases automatically.

## Configure the app

```bash
cd base-builder
cp .env.local.example .env.local
```

Edit `.env.local`:
- `NOTION_TOKEN` → paste the `ntn_…` secret from step 1.
- `NOTION_TRAINING_LOG_DB_ID` / `NOTION_WEEKLY_REPORT_DB_ID` → already filled in.
- `INGEST_TOKEN` / `APP_ACCESS_TOKEN` → set to any long random strings
  (`openssl rand -hex 24` gives you one).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should see the dashboard populated with the
seeded sessions.

## Connect Health Auto Export (the data pipe)

In the **Health Auto Export** iOS app, add an automation:
- **Destination:** REST API → POST → `https://<your-vercel-url>/api/ingest`
- **Header:** `Authorization: Bearer <your INGEST_TOKEN>`
- **Format:** JSON, include Workouts + Resting Heart Rate + HRV metrics.

> Note: Health Auto Export only fires while the iPhone is unlocked. The
> dashboard's "Last Sync" tile tells you when the webhook last ran.

## Deploy (Vercel)

Push the repo, import into Vercel, and add the same five env vars in
**Project → Settings → Environment Variables**. No database to provision —
Notion is the datastore.
