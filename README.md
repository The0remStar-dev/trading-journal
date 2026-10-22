# Trade Journal

A multi-user trading journal and performance dashboard built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma, Supabase Auth, PostgreSQL, and Recharts. Deployable on Render.com.

## Features

- **Authentication** — Supabase Auth (email/password and Google OAuth), with private routes enforced by the Next.js proxy.
- **Trade log** — full CRUD, with sortable/filterable table (date range, symbol, direction, status, tags, account type), inline status badges, and a detail modal with zoomable pre/post-trade screenshots and Markdown notes.
- **Trade entry form** — live-computed PnL, PnL %, and status (Win/Loss/Breakeven/Open) as you type, plus a drag-and-drop image uploader for chart screenshots.
- **Dashboard** — KPI cards (Net PnL, Win Rate, Profit Factor, Avg Win/Loss, Best/Worst Trade), an equity curve chart, a win-rate-by-day-of-week radial chart, and a tag performance breakdown — all filterable by This Week / This Month / All Time.
- **Image storage** — screenshots upload to Cloudinary if credentials are set, otherwise fall back to base64 storage directly on the trade row (zero extra infra needed for a personal journal).

## Project structure

```
trading-journal/
├── prisma/
│   └── schema.prisma        # Trade model, enums, indexes
├── proxy.ts                  # Route protection (redirects unauthenticated users to /login)
├── src/
│   ├── app/
│   │   ├── login/            # Supabase Auth screen
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
# configure Supabase URL/key and PostgreSQL URLs in .env

npm run db:migrate
npm run dev              # http://localhost:3000
```

The first request redirects to `/login`. Create or sign in to an account with Supabase Auth.

## Database

The Prisma schema uses PostgreSQL. Configure `DATABASE_URL` for application queries and `DIRECT_URL` for Prisma migrations. Supabase connection pooler URLs can be used for `DATABASE_URL`; use a direct database URL for `DIRECT_URL`.

Run `npm run db:migrate` to apply committed migrations. Builds do not apply migrations.

## Deploying to Render

**Option A — Docker (recommended, matches the included `Dockerfile`):**

1. Push this repo to GitHub.
2. In Render, create a new **Web Service**, connect the repo, and choose **Docker** as the environment (Render auto-detects the `Dockerfile`).
3. Configure Docker build arguments `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add runtime environment variables in the Render dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
5. Deploy. The container runs `prisma migrate deploy` then starts the standalone Next.js server on `$PORT`.

**Option B — Native Node environment (no Docker):**

1. Build command: `npm run build`
2. Start command: `npm run db:migrate && npm run start`
3. Set the same environment variables as above.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/publishable key |
| `DATABASE_URL` | Yes | PostgreSQL connection string for app queries |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection string for Prisma migrations |
| `CLOUDINARY_CLOUD_NAME` | No | Enables Cloudinary image hosting for screenshots |
| `CLOUDINARY_API_KEY` | No | — |
| `CLOUDINARY_API_SECRET` | No | — |

## Notes on the data model

- `pnl`, `pnlPercentage`, and `status` are always recomputed server-side from `entryPrice`, `exitPrice`, `positionSize`, `fees`, and `direction` on create/update — the client only ever sends inputs, not derived values, so the numbers can't drift.
- `tags` is stored as a JSON-encoded string and parsed/serialized transparently by `src/lib/serialize.ts`.
- A trade with no `exitPrice` is always treated as `OPEN`, regardless of what's stored in `status`.
