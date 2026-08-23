# Trade Journal

A private, single-user trading journal and performance dashboard built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma, and Recharts. Deployable on Render.com.

## Features

- **Single-user auth** — a minimal password screen backed by a signed JWT session cookie (`ADMIN_PASSWORD` env var), enforced by Next.js middleware on every page and API route.
- **Trade log** — full CRUD, with sortable/filterable table (date range, symbol, direction, status, tags, account type), inline status badges, and a detail modal with zoomable pre/post-trade screenshots and Markdown notes.
- **Trade entry form** — live-computed PnL, PnL %, and status (Win/Loss/Breakeven/Open) as you type, plus a drag-and-drop image uploader for chart screenshots.
- **Dashboard** — KPI cards (Net PnL, Win Rate, Profit Factor, Avg Win/Loss, Best/Worst Trade), an equity curve chart, a win-rate-by-day-of-week radial chart, and a tag performance breakdown — all filterable by This Week / This Month / All Time.
- **Image storage** — screenshots upload to Cloudinary if credentials are set, otherwise fall back to base64 storage directly on the trade row (zero extra infra needed for a personal journal).

## Project structure

```
trading-journal/
├── prisma/
│   └── schema.prisma        # Trade model, enums, indexes
├── middleware.ts             # Route protection (redirects unauthenticated users to /login)
├── src/
│   ├── app/
│   │   ├── login/            # Password screen
│   │   ├── dashboard/        # KPIs + charts
│   │   ├── trades/           # Trade log table + modals
│   │   └── api/
│   │       ├── auth/         # login / logout routes
│   │       ├── trades/       # CRUD routes ([id] for single-trade ops)
│   │       └── upload/       # image upload (Cloudinary or base64 fallback)
│   ├── components/
│   │   ├── ui/                # Button, Card, Dialog, Select, Input, etc. (shadcn-style primitives)
│   │   ├── layout/Navbar.tsx
│   │   ├── dashboard/          # KpiCards, EquityCurveChart, DayOfWeekChart, TagPerformance
│   │   └── trades/             # TradeTable, TradeFormModal, TradeDetailModal, ImageDropzone, StatusBadge
│   ├── lib/                   # prisma client, auth, calculations, utils, serialize, useTrades hook
│   └── types/trade.ts
├── Dockerfile
└── .env.example
```

## Local development

```bash
npm install
cp .env.example .env
# edit .env: set ADMIN_PASSWORD and JWT_SECRET to real values

npx prisma db push      # creates dev.db (SQLite) from the schema
npm run dev              # http://localhost:3000
```

The first request redirects to `/login`. Enter the password you set as `ADMIN_PASSWORD`.

## Switching to Postgres / Supabase

SQLite is fine for local dev, but Render's filesystem is ephemeral on most plans, so production should use Postgres:

1. In `prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Postgres/Supabase connection string.
3. Run `npx prisma migrate dev --name init` locally once to generate a migration, commit the `prisma/migrations` folder.
4. On deploy, `prisma migrate deploy` (already wired into the Docker `CMD` and the `build` script) applies migrations automatically.

If you stay on SQLite, attach a Render persistent disk mounted at the path your `DATABASE_URL` points to, so `dev.db` survives restarts/deploys.

## Deploying to Render

**Option A — Docker (recommended, matches the included `Dockerfile`):**

1. Push this repo to GitHub.
2. In Render, create a new **Web Service**, connect the repo, and choose **Docker** as the environment (Render auto-detects the `Dockerfile`).
3. Add environment variables in the Render dashboard:
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
   - `DATABASE_URL` (Postgres connection string, or a file path on a mounted disk for SQLite)
4. Deploy. The container runs `prisma migrate deploy` then starts the standalone Next.js server on `$PORT`.

**Option B — Native Node environment (no Docker):**

1. Build command: `npm run build` (this also runs `prisma generate` and `prisma migrate deploy`)
2. Start command: `npm run start`
3. Set the same environment variables as above.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | Yes | The single password used to log in |
| `JWT_SECRET` | Yes | Random secret used to sign session JWTs |
| `DATABASE_URL` | Yes | SQLite file path (dev) or Postgres connection string (prod) |
| `CLOUDINARY_CLOUD_NAME` | No | Enables Cloudinary image hosting for screenshots |
| `CLOUDINARY_API_KEY` | No | — |
| `CLOUDINARY_API_SECRET` | No | — |

## Notes on the data model

- `pnl`, `pnlPercentage`, and `status` are always recomputed server-side from `entryPrice`, `exitPrice`, `positionSize`, `fees`, and `direction` on create/update — the client only ever sends inputs, not derived values, so the numbers can't drift.
- `tags` is stored as a JSON-encoded string column (SQLite has no native array type) and is parsed/serialized transparently by `src/lib/serialize.ts`. If you switch to Postgres you could migrate this to a native `String[]` column and drop the JSON encode/decode step.
- A trade with no `exitPrice` is always treated as `OPEN`, regardless of what's stored in `status`.
