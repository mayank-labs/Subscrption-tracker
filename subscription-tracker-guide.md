# Subscription Tracker: Complete Build, Migration & CV Guide

**Goal:** turn your existing Express + MongoDB subscription tracker into a production-style, PostgreSQL-backed full-stack project that stands out on a CV.

**What you already have (from your folder structure):**
Express app with `config/`, `controller/`, `database/`, `routes/`, auth + error + Arcjet middleware, Mongoose models for users and subscriptions, ESLint, and a README.

**What this guide adds:**
1. Cleanup of the current structure
2. Migration MongoDB → PostgreSQL
3. Core features (spend analytics, renewals)
4. Reminders with a background job queue
5. Security, validation, logging
6. Tests, API docs, CI/CD
7. A real frontend
8. Deployment (Supabase + Render + Vercel)
9. CV bullets, README and interview talking points

---

## 0. Final stack (what to use)
~
| Area | Use | Why |
|---|---|---|
| Runtime | Node.js 22 LTS | Current LTS |
| Language | JavaScript now, move to **TypeScript** in Phase 2 | TypeScript is expected in most internship listings |
| Framework | Express (keep it) | You already have it |
| Database | **PostgreSQL on Supabase** | Managed Postgres with dashboard, backups and a free tier; no local database setup |
| ORM / migrations | **Prisma** (alternative: Drizzle) | Readable schema, versioned migrations, type safety |
| Validation | **Zod** | Validate every request body/query |
| Auth | JWT access token + refresh token (httpOnly cookie), **bcrypt/argon2** | Shows you understand real auth, not just a login route |
| Security | **Arcjet** (keep), `helmet`, `cors`, rate limiting | Already partly done |
| Logging | **pino** + `pino-http` | Structured logs, production standard |
| Background jobs | **pg-boss** (uses Postgres as queue) | No extra infrastructure, very CV-friendly |
| Email | **Resend** (or Nodemailer + Gmail app password for testing) | Renewal reminders |
| Dates | **dayjs** or **date-fns** | Renewal date maths |
| API docs | **Swagger / OpenAPI** (`swagger-ui-express` + `zod-to-openapi` or hand-written YAML) | Interactive docs link on your README |
| Tests | **Vitest** (or Jest) + **Supertest** | Unit + integration tests |
| Lint/format | ESLint (keep) + Prettier + Husky + lint-staged | Professional workflow |
| CI/CD | **GitHub Actions** | Lint + test on every push |
| Frontend | **React + Vite + TypeScript + Tailwind + shadcn/ui** | Modern, quick to build |
| Data fetching | **TanStack Query** | Caching, loading and error states |
| Charts | **Recharts** | Spend breakdown dashboards |
| Hosting | Frontend: **Vercel**; Backend: **Render/Railway/Fly.io**; DB: **Supabase** (free Postgres) | Free tiers |

---

## 1. Phase 0: Clean up the current project (½ day)

Fix these before adding anything. Recruiters read folder structure first.

1. **Rename the project folder** from `Subscrption-tracker` to `subscription-tracker` (typo).
2. **Rename** `subscription.comtroller.js` → `subscription.controller.js`.
3. **Move `models/` out of `middleware/`.** Models are not middleware. With Prisma you will delete them anyway, but until then keep them at `src/models/`.
4. **Pick one naming style:** `controllers/` and `routes/` (plural) is the convention. Rename `controller/` → `controllers/`.
5. **Put source under `src/`** and keep config files at the root.
6. **Check `.gitignore`** contains `node_modules`, `.env*`, `dist`, `coverage`.
7. **Make sure no secrets are committed** (Mongo URI, JWT secret, Arcjet key). If any were committed, rotate them and remove them from history.
8. Commit: `chore: clean up folder structure`.

### Target structure

```
subscription-tracker/
├── .github/workflows/ci.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── src/
│   ├── app.js                  # builds the express app (no listen)
│   ├── server.js               # starts the server
│   ├── config/                 # env.js (validated with Zod), arcjet.js, logger.js
│   ├── db/                     # prisma client instance
│   ├── routes/                 # auth.routes.js, subscription.routes.js, user.routes.js, stats.routes.js
│   ├── controllers/            # thin: parse request, call service, send response
│   ├── services/               # business logic (cost calc, renewal logic, auth)
│   ├── middleware/             # auth, arcjet, error, validate, rate-limit
│   ├── validators/             # Zod schemas
│   ├── jobs/                   # pg-boss workers (reminders, renewal roll-forward)
│   └── utils/                  # date + money helpers, ApiError class
├── tests/
│   ├── unit/
│   └── integration/
├── docs/                       # openapi.yaml, architecture diagram
├── .env.example
└── README.md
```

**Key learning point:** split `app.js` (creates the app) from `server.js` (calls `listen`). Supertest needs the app without a running server.

**Controller → Service split:** controllers handle HTTP only; services contain the logic. This is the single biggest "this person writes clean code" signal.

---

## 2. Phase 1: Migrate MongoDB → PostgreSQL (2 to 3 days)

### 2.1 Create your Supabase Postgres database

1. Go to supabase.com and create a **New project**. Choose the region you plan to deploy your backend in, so database calls stay fast.
2. Save the **database password** when it is shown (you can reset it later from the dashboard).
3. Open **Connect** in the dashboard and copy two connection strings:
   - **Pooled connection** (transaction pooler, port 6543) goes in `DATABASE_URL`. Your running app uses this one. Add `?pgbouncer=true` at the end when using Prisma.
   - **Direct connection** or **session pooler** (port 5432) goes in `DIRECT_URL`. Migrations and the job queue use this one. The direct connection is IPv6-only by default, so if your network or host can't reach it, use the session pooler string instead.
   (The labels in the dashboard change over time, so check the current "Connecting to Postgres" page in the Supabase docs.)
4. Put them in `.env` (never commit this file) and mirror the keys in `.env.example` with fake values:

```
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres"
```

5. Point the Prisma datasource at both URLs:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

(Newer Prisma versions move connection settings into `prisma.config.ts`. Follow the current Prisma + Supabase guide for your version.)

6. **Use separate projects per environment.** The free plan allows two active projects, so use `subtracker-dev` now and create `subtracker-prod` when you deploy. Never run tests against a database that holds real data.

### 2.2 Install Prisma

```bash
npm i prisma -D
npm i @prisma/client
npx prisma init
```

(Follow the current Prisma docs for client setup, as the recommended client configuration changes between major versions.)

### 2.3 Design the schema (`prisma/schema.prisma`)

```prisma
enum BillingCycle {
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED
}

model User {
  id            String         @id @default(uuid())
  name          String
  email         String         @unique
  passwordHash  String
  currency      String         @default("INR")
  createdAt     DateTime       @default(now())
  subscriptions Subscription[]
  refreshTokens RefreshToken[]
}

model Subscription {
  id               String             @id @default(uuid())
  userId           String
  user             User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  name             String
  price            Decimal            @db.Decimal(10, 2)
  currency         String             @default("INR")
  billingCycle     BillingCycle
  category         String?
  status           SubscriptionStatus @default(ACTIVE)
  startDate        DateTime           @db.Date
  nextRenewalDate  DateTime           @db.Date
  isTrial          Boolean            @default(false)
  reminderDaysBefore Int              @default(3)
  notes            String?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  reminders        ReminderLog[]

  @@index([userId, status])
  @@index([nextRenewalDate])
}

model ReminderLog {
  id             String       @id @default(uuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  renewalDate    DateTime     @db.Date
  sentAt         DateTime     @default(now())

  @@unique([subscriptionId, renewalDate]) // prevents duplicate reminders
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}
```

**Design decisions to mention in interviews:**
- Money uses `Decimal`, never floating point.
- Indexes on the columns used in the most frequent queries.
- `ReminderLog` with a unique constraint makes reminders **idempotent** (a job retry can never email twice).
- Enums enforce valid values at the database level.

### 2.4 Create the first migration

```bash
npx prisma migrate dev --name init
npx prisma studio      # visual DB browser, good for screenshots
```

Migrations run through `DIRECT_URL`. You can also inspect the tables in the Supabase **Table Editor**, which is handy for README screenshots. If `migrate dev` complains about the shadow database, check the current Supabase + Prisma guide.

### 2.5 Mongoose → Prisma mapping (use as a checklist)

| MongoDB / Mongoose | PostgreSQL / Prisma |
|---|---|
| `ObjectId` `_id` | `String @id @default(uuid())` |
| `Model.find({ user })` | `prisma.subscription.findMany({ where: { userId } })` |
| `.populate('user')` | `include: { user: true }` |
| `Model.create()` | `prisma.x.create({ data })` |
| `findByIdAndUpdate` | `prisma.x.update({ where: { id }, data })` |
| `findByIdAndDelete` | `prisma.x.delete({ where: { id } })` |
| `pre('save')` hooks (e.g. hash password, compute renewal date) | Service layer function before calling Prisma |
| Aggregation pipeline | `groupBy`, or `prisma.$queryRaw` for complex SQL |
| Schema validators | Zod + DB constraints |
| `mongodb.js` connection | `db/prisma.js` exporting one Prisma client |

### 2.6 Migration steps

1. Create `src/db/prisma.js` exporting a single Prisma client.
2. Replace `database/mongodb.js` usage in startup with `prisma.$connect()`.
3. Rewrite **auth** first (sign-up, sign-in) and test it.
4. Rewrite **user** controllers.
5. Rewrite **subscription** controllers (move logic into `services/`).
6. Delete `mongoose`, the Mongo models and the Mongo URI from env.
7. Add `prisma/seed.js` that creates a demo user plus 8 to 10 realistic subscriptions (Netflix, Spotify, iCloud, GitHub Copilot, gym...). A demo account makes your live link impressive.
8. Commit: `feat: migrate database from MongoDB to PostgreSQL with Prisma`.

(Optional) If you have real data in Mongo, write a one-off script using `mongoexport` → transform → `prisma.createMany`. Mention it in the README as "migration notes".

### 2.7 Supabase-specific things to do

1. **Turn on Row Level Security (RLS) for every table.** Supabase exposes tables in the `public` schema through its auto-generated API (usable with the public anon key). Your Express app connects through Prisma as the `postgres` role, which bypasses RLS, so enabling RLS with **no policies** blocks that public API without affecting your app. Put it in a versioned migration:

```bash
npx prisma migrate dev --create-only --name enable_rls
```

Then edit the generated SQL:

```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReminderLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
```

   and run `npx prisma migrate dev`. This is a real security issue people miss on Supabase, and a good thing to mention in interviews.
2. **Decide on auth and stick to it.** Recommended: keep your own JWT + refresh-token auth (you already built it, and it shows more skill on a CV). Supabase Auth is a valid alternative, but don't mix both.
3. **Connection strings:** the app uses the pooled `DATABASE_URL`; migrations and pg-boss use `DIRECT_URL`.
4. **Free-tier pausing:** inactive free projects can be paused by Supabase after a period of inactivity. Check the current policy and make sure the database is awake before you share the demo link (a daily scheduled job or a GitHub Actions cron that calls your `/ready` endpoint keeps it active).
5. **Keep the logic in Node.** Supabase also offers `pg_cron`, Edge Functions and Storage, but for this project keep reminders in pg-boss and business logic in your services so the project shows your backend skills.

---

## 3. Phase 2: Harden the backend (3 to 4 days)

### 3.1 Environment validation

Validate env at startup with Zod so the app fails fast if a variable is missing.

```js
// src/config/env.js
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ARCJET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CLIENT_URL: z.string().url(),
});

export const env = schema.parse(process.env);
```

### 3.2 Request validation middleware

```js
// src/middleware/validate.js
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    return res.status(400).json({ message: 'Validation failed', errors: result.error.flatten() });
  }
  Object.assign(req, result.data);
  next();
};
```

Write schemas in `validators/` for every route (sign-up, create subscription, filters).

### 3.3 Auth upgrade

- **Access token:** JWT, 15 minutes, sent in `Authorization: Bearer`.
- **Refresh token:** random string, stored **hashed** in `RefreshToken` table, sent as `httpOnly; secure; sameSite` cookie.
- Endpoints: `POST /auth/sign-up`, `/auth/sign-in`, `/auth/refresh`, `/auth/sign-out`.
- On refresh: rotate the token (delete old, issue new).
- Password: bcrypt (cost 12) or argon2.

### 3.4 Security middleware

- `helmet()`, `cors({ origin: env.CLIENT_URL, credentials: true })`
- Keep **Arcjet** for bot detection + rate limiting (shows up well on a CV), and add a stricter limit on `/auth/*`.
- Always filter DB queries by `userId` from the token. Never trust an id from the request. Write a test for this (user A cannot read user B's subscription).

### 3.5 Error handling and logging

- Create an `ApiError` class (`statusCode`, `message`).
- One central `error.middleware.js` mapping known errors (Zod, Prisma unique violation `P2002`, not found `P2025`) to clean responses.
- Use `pino-http` for request logs, with request IDs.

### 3.6 Move to TypeScript (optional but strongly recommended)

Do it now while the codebase is small:

```bash
npm i -D typescript tsx @types/node @types/express
npx tsc --init
```

Rename files to `.ts` gradually. Prisma gives you types for free. TypeScript on a CV matters.

---

## 4. Phase 3: Core features (4 to 5 days)

### 4.1 Subscription endpoints

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/v1/subscriptions` | Pagination, filters (`status`, `category`), search (`q`), sort |
| POST | `/api/v1/subscriptions` | Computes `nextRenewalDate` |
| GET | `/api/v1/subscriptions/:id` | Ownership check |
| PUT/PATCH | `/api/v1/subscriptions/:id` | Ownership check |
| DELETE | `/api/v1/subscriptions/:id` | Ownership check |
| POST | `/api/v1/subscriptions/:id/cancel` | Sets status to CANCELLED |
| GET | `/api/v1/subscriptions/upcoming?days=30` | Renewals due soon |
| GET | `/api/v1/stats/summary` | Monthly total, yearly total, active count |
| GET | `/api/v1/stats/by-category` | For the pie chart |
| GET | `/api/v1/stats/monthly-trend` | For the bar chart |
| GET | `/api/v1/subscriptions/export.csv` | CSV export |

Version your API (`/api/v1`) and mention it.

### 4.2 Business logic (put in `services/` and **unit test it**)

```js
// src/utils/money.js
export function monthlyCost(price, cycle) {
  const p = Number(price);
  switch (cycle) {
    case 'WEEKLY':    return (p * 52) / 12;
    case 'MONTHLY':   return p;
    case 'QUARTERLY': return p / 3;
    case 'YEARLY':    return p / 12;
    default: throw new Error(`Unknown cycle: ${cycle}`);
  }
}
```

```js
// src/utils/dates.js
import dayjs from 'dayjs';

const STEP = {
  WEEKLY:    (d) => d.add(1, 'week'),
  MONTHLY:   (d) => d.add(1, 'month'),
  QUARTERLY: (d) => d.add(3, 'month'),
  YEARLY:    (d) => d.add(1, 'year'),
};

export function nextRenewal(startDate, cycle, today = new Date()) {
  let next = dayjs(startDate);
  const now = dayjs(today).startOf('day');
  while (next.isBefore(now)) next = STEP[cycle](next);
  return next.toDate();
}
```

**Edge cases to unit test:** Jan 31 + 1 month, leap year (Feb 29 yearly), start date in the future, weekly crossing a month boundary, paused subscriptions excluded from totals.

### 4.3 Upcoming renewals query

```js
prisma.subscription.findMany({
  where: {
    userId,
    status: 'ACTIVE',
    nextRenewalDate: { gte: today, lte: dayjs(today).add(days, 'day').toDate() },
  },
  orderBy: { nextRenewalDate: 'asc' },
});
```

### 4.4 Make it stand out: "insights" endpoint

`GET /api/v1/stats/insights` returns things like:
- Most expensive subscription and its share of total spend
- Categories where you pay for 2+ services ("You have 3 music subscriptions")
- Total saved from cancelled subscriptions
- Projected spend for the next 12 months

This is the sort of feature interviewers ask about, because it shows product thinking, not just CRUD.

---

## 5. Phase 4: Reminders and background jobs (3 days)

**Use pg-boss** (a job queue that stores jobs in your existing Postgres, so no Redis is needed). On Supabase, connect pg-boss with `DIRECT_URL` (direct or session pooler), not the transaction pooler on port 6543, because a queue needs session-level features that transaction pooling doesn't support.

```bash
npm i pg-boss resend
```

### Jobs

1. **`renewal-scan`** (cron daily, 09:00): find active subscriptions where `nextRenewalDate - reminderDaysBefore = today`, enqueue one `send-reminder` job each.
2. **`send-reminder`**: send the email, then insert into `ReminderLog`. The unique constraint prevents duplicates if the job retries.
3. **`roll-forward`** (cron daily, after midnight): for active subscriptions whose `nextRenewalDate` is in the past, compute the next date and update.

```js
// sketch (check the pg-boss docs for the exact API of the version you install)
import PgBoss from 'pg-boss';

export const boss = new PgBoss(env.DIRECT_URL); // direct or session-pooler URL, not the transaction pooler

export async function startJobs() {
  await boss.start();
  await boss.createQueue('renewal-scan');
  await boss.createQueue('send-reminder');
  await boss.schedule('renewal-scan', '0 9 * * *');

  await boss.work('renewal-scan', async () => { /* find due subs, boss.send('send-reminder', {...}) */ });
  await boss.work('send-reminder', async ([job]) => { /* send email + write ReminderLog */ });
}
```

Features that make this impressive: retries with backoff, idempotency (via `ReminderLog`), a per-user `reminderDaysBefore`, and an email template (HTML) showing the service name, price and renewal date.

**Alternative:** Upstash QStash or `node-cron` (simpler, but jobs are lost if the server restarts, so mention the trade-off if you choose it).

---

## 6. Phase 5: Tests, docs, CI (3 days)

### 6.1 Tests

```bash
npm i -D vitest supertest
```

- **Unit tests:** `monthlyCost`, `nextRenewal`, insights logic.
- **Integration tests:** sign-up → sign-in → create subscription → fetch stats, using a separate test database, reset between tests. Without Docker, use a second Supabase project (for example `subtracker-test`) or a separate schema via `?schema=test` in the connection string. Never point tests at your dev or production data.
- **Authorization test:** user B gets 404/403 on user A's subscription.
- Target **70%+ coverage** and show the badge in the README.

### 6.2 API documentation

- Write `docs/openapi.yaml` (or generate it from Zod).
- Serve it at `/api/docs` using `swagger-ui-express`.
- Link the hosted docs in your README.

### 6.3 CI with GitHub Actions

The Postgres service below runs on GitHub's servers during the workflow, not on your machine, so you still don't need Docker locally. (You can also point CI at a Supabase test project using repository secrets.)

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: app
          POSTGRES_DB: subtracker_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U app"
          --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://app:app@localhost:5432/subtracker_test
      DIRECT_URL: postgresql://app:app@localhost:5432/subtracker_test
      JWT_ACCESS_SECRET: test-access-secret-test-access-secret-123
      JWT_REFRESH_SECRET: test-refresh-secret-test-refresh-secret-123
      CLIENT_URL: http://localhost:5173
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm test
```

### 6.4 Developer experience

- **Husky + lint-staged:** lint and format on commit.
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- Scripts in `package.json`: `dev`, `build`, `start`, `test`, `lint`, `db:migrate`, `db:seed`.

---

## 7. Phase 6: Frontend (1.5 to 2 weeks)

### 7.1 Setup

```bash
npm create vite@latest client -- --template react-ts
cd client
npm i react-router-dom @tanstack/react-query recharts axios zod react-hook-form @hookform/resolvers
npm i -D tailwindcss
```
Add **shadcn/ui** for ready-made accessible components (dialog, table, form, toast, dropdown).

### 7.2 Pages and features

1. **Auth:** register, login, protected routes, silent token refresh.
2. **Dashboard:**
   - Stat cards: monthly spend, yearly spend, active subscriptions, next renewal
   - Pie chart: spend by category
   - Bar chart: monthly trend
   - Upcoming renewals list with colour badges (red ≤ 3 days, amber ≤ 7)
   - Insights panel ("You could save ₹X by cancelling...")
3. **Subscriptions:** table with search, filters, sorting, pagination; add/edit modal using `react-hook-form` + Zod; delete with confirmation.
4. **Settings:** preferred currency, reminder defaults, delete account.
5. **Polish:** dark mode, loading skeletons, empty states, toast notifications, fully responsive.

### 7.3 Frontend learning points

- Server state with TanStack Query (cache, invalidation after mutations, optimistic updates)
- Form handling and validation
- Token refresh flow with an Axios interceptor
- Accessibility basics (labels, focus, keyboard navigation)

**Tip:** make it **installable as a PWA** (`vite-plugin-pwa`). It's cheap to add and impressive.

---

## 8. Phase 7: Deployment (2 days)

### 8.1 Deploy the backend (no Docker needed)

On Render (Railway and Fly.io work similarly), create a **Web Service** from your GitHub repo:

- **Build command:** `npm ci && npx prisma generate && npm run build`
- **Pre-deploy / release command:** `npx prisma migrate deploy`
- **Start command:** `node dist/server.js`
- **Health check path:** `/health`
- **Environment variables:** `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ARCJET_KEY`, `RESEND_API_KEY`, `CLIENT_URL`

Use your **production** Supabase project for these values, run the migrations against it, and seed the demo account once. Containers are optional; if you want to learn them later, add a Dockerfile as a bonus, but nothing in this plan requires it.

### 8.2 Deploy

| Part | Service | Notes |
|---|---|---|
| Database | Supabase (production project) | Pooled URL for `DATABASE_URL`, direct/session URL for `DIRECT_URL`, RLS enabled |
| Backend | Render / Railway / Fly.io | Set env vars; run `prisma migrate deploy` on release |
| Frontend | Vercel | Set `VITE_API_URL` |
| Emails | Resend | Verify a sender |

Checklist: HTTPS only, CORS limited to your frontend URL, `secure` cookies, health route `GET /health`, secrets only in the host's env settings, a demo account seeded.

**Free-tier note:** some free backends sleep after inactivity, and free Supabase projects can be paused when inactive. Add a note in the README ("first request may take ~30s") and check that both the backend and the database are awake before sharing the link.

### 8.3 Basic observability (small but impressive)

- `GET /health` and `GET /ready` (checks DB)
- Structured logs (pino)
- Optional: Sentry free tier for error tracking

---

## 9. Phase 8: Pick 2 to 3 standout extras

You don't need all of these. Pick the ones you can finish properly.

| Extra | Effort | CV impact |
|---|---|---|
| Multi-currency with exchange-rate API and cached rates | Medium | High |
| CSV import/export | Low | Medium |
| Telegram bot or web-push reminders | Medium | High |
| Redis caching for stats endpoints | Medium | Medium (shows caching knowledge) |
| Shared / family plans (split costs between users) | High | High |
| Role-based admin dashboard | Medium | Medium |
| Email-parsing to auto-detect subscriptions (Gmail API) | High | Very high |
| Mobile app with React Native | High | High |
| Rate-limit + audit log table | Low | Medium |

---

## 10. Suggested timeline (about 6 to 7 weeks, part-time alongside college)

| Week | Focus | Output |
|---|---|---|
| 1 | Phase 0 and 1 | Clean structure, Postgres + Prisma, all routes working |
| 2 | Phase 2 | Zod validation, refresh-token auth, logging, TypeScript |
| 3 | Phase 3 and 4 | Stats, insights, reminder jobs |
| 4 | Phase 5 | Tests, Swagger docs, CI green |
| 5 to 6 | Phase 6 | Frontend dashboard and subscription management |
| 7 | Phase 7 and 8 | Supabase production setup, deployment, 1 to 2 extras, README polish |

---

## 11. Git workflow

- Branches: `main` (stable), `feat/<name>` per feature, merge via **pull requests** (even if you review your own).
- Commit messages follow Conventional Commits.
- Tag a release: `v1.0.0` when deployed.
- Use GitHub Issues/Projects to track the phases above. A visible board shows planning skills.

---

## 12. README template (this is what recruiters actually read)

```markdown
# SubTracker

One-line pitch: Track every subscription, see what you spend, never miss a renewal.

[Live demo] · [API docs] · [Demo login: demo@subtracker.app / ********]

![Dashboard screenshot]

## Features
- ...

## Tech stack
Node.js, Express, PostgreSQL, Prisma, pg-boss, Zod, React, TypeScript, Tailwind, TanStack Query, Supabase, GitHub Actions

## Architecture
(diagram: Client → API → Postgres, API → pg-boss workers → Resend)

## Run locally
1. Clone the repo and run `npm install`
2. Create a Supabase project, copy `.env.example` to `.env`, fill in `DATABASE_URL` and `DIRECT_URL`
3. `npx prisma migrate dev && npm run db:seed`
4. `npm run dev`

## Testing
npm test (coverage badge)

## Key design decisions
- Why PostgreSQL (relational data, constraints, transactions)
- Why Decimal for money
- Why pg-boss (no extra infra, transactional jobs)
- Idempotent reminders
- Refresh-token rotation

## Roadmap
- ...
```

Add 3 to 5 screenshots/GIFs and a simple architecture diagram (draw.io or Excalidraw).

---

## 13. CV and LinkedIn

### Project title and description

**SubTracker: Subscription Management Platform** | *Node.js, Express, PostgreSQL, Prisma, React, TypeScript, Supabase*

### CV bullets (edit the numbers so they are true for your project)

- Designed and built a full-stack subscription management platform with a REST API (Express, PostgreSQL, Prisma) and React dashboard that tracks recurring spend and upcoming renewals.
- Implemented JWT authentication with refresh-token rotation, Zod request validation, and Arcjet rate limiting to secure the API.
- Built an automated reminder system with pg-boss background jobs and idempotent email delivery (Resend), preventing duplicate notifications on retries.
- Modeled relational data with indexed Postgres schemas and migrations; implemented analytics endpoints (spend by category, monthly trend, insights) serving a charts dashboard.
- Achieved X% test coverage with Vitest and Supertest; automated lint/test pipeline using GitHub Actions; deployed on Render + Vercel with a managed Supabase PostgreSQL database secured with Row Level Security.
- Migrated the data layer from MongoDB to PostgreSQL, replacing document models with a normalized relational schema.

Use the last bullet deliberately: **a migration is a great interview story.**

### Interview questions you should be able to answer

1. Why did you move from MongoDB to PostgreSQL? (relations, constraints, transactions, aggregations, money handling)
2. How do you stop a user from reading another user's subscriptions?
3. How do you make sure reminder emails are not sent twice?
4. How do you calculate monthly cost across different billing cycles?
5. What happens when a job fails or the server restarts?
6. Why access + refresh tokens instead of one long-lived JWT?
7. What indexes did you add and why?
8. How would you scale this to 100,000 users?

Write short answers to these in a `docs/DESIGN.md` file. It doubles as interview prep and shows up in your repo.

---

## 14. What you will learn (skill checklist)

- [ ] Relational modelling, migrations, indexes, constraints (PostgreSQL + Prisma)
- [ ] Layered backend architecture (routes → controllers → services → data)
- [ ] Authentication and authorization (JWT, refresh rotation, ownership checks)
- [ ] Input validation and error handling
- [ ] Background jobs, retries, idempotency
- [ ] Testing (unit, integration, test databases)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] CI/CD with GitHub Actions
- [ ] Managed Postgres (Supabase): connection pooling, RLS, separate dev/prod environments
- [ ] Deployment and environment management
- [ ] React + TypeScript, server-state management, charts
- [ ] Writing a recruiter-friendly README

### Resources

- Prisma docs (Getting Started, Migrate, Relations)
- PostgreSQL Tutorial (postgresqltutorial.com) for SQL basics: `JOIN`, `GROUP BY`, indexes
- pg-boss docs on GitHub
- Express docs → Error handling and Security best practices
- OWASP API Security Top 10 (read the headings; know #1 Broken Object Level Authorization)
- TanStack Query docs → "Important Defaults" and "Mutations"
- Supabase docs → Database → Connecting to Postgres, and Row Level Security

---

## 15. Final checklist before sharing the repo

- [ ] No secrets in the repo or git history; `.env.example` present
- [ ] A fresh clone runs by following the README (`.env.example`, `prisma migrate dev`, `npm run dev`)
- [ ] CI badge is green
- [ ] Live demo link works with a demo account
- [ ] README has screenshots, architecture diagram, setup, design decisions
- [ ] API docs link works
- [ ] Tests pass and coverage badge shown
- [ ] Clean commit history with meaningful messages
- [ ] Repo description, topics/tags and pinned on your GitHub profile
- [ ] Project listed on resume + LinkedIn with a link

---

### Start here (this week)

1. Do Phase 0 cleanup (rename files, move models, push).
2. Create a Supabase project and set up Prisma with the schema from section 2.3.
3. Migrate **auth** first, then subscriptions.
4. Commit `feat: migrate database from MongoDB to PostgreSQL`.

Once the migration is done, everything else is incremental. Build one phase at a time and keep the app working after each one.