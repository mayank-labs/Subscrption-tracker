# SubDub

SubDub is a subscription tracker with an Express API, PostgreSQL, and Prisma.
The backend lives in [backend/](./backend).

## Supabase configuration

Supabase project URLs and API keys are not PostgreSQL connection strings. Prisma
needs the database connection string from **Supabase Dashboard → Connect →
ORMs → Prisma**.

Create `backend/.env` from [backend/.env.example](./backend/.env.example) and
set:

```env
DATABASE_URL="postgresql://...supabase.../postgres?sslmode=require"
```

Keep `SUPABASE_SERVICE_KEY` private. It is not required by Prisma for direct
database access, but may be used later for Supabase-specific APIs.

The current local setup normalizes Supabase's `sslmode=require` URL to
`sslmode=no-verify` because some local Node/Postgres installations reject the
pooler's certificate chain. Use a trusted CA and `sslmode=verify-full` in
production instead of disabling certificate verification.

## Run locally

```bash
cd backend
npm install
npm run db:validate
npm run db:generate
npm run db:migrate -- --name init
npm run dev
```

The API runs at `http://localhost:3000`.

Health endpoints:

- `GET /health`
- `GET /ready`
- `GET /api/docs`

Authenticated API groups:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/subscriptions`
- `/api/v1/stats`

The backend now includes refresh-token rotation, Zod request validation,
subscription analytics, CSV export, structured HTTP logging, Helmet/CORS
hardening, and optional pg-boss/Resend renewal reminders.

## Backend structure

- `app.js` configures Express without opening a port.
- `server.js` connects Prisma and starts the HTTP server.
- `prisma/` contains the PostgreSQL schema and migrations.
- `database/prisma.js` exports one Prisma client.
- `controllers/` contains HTTP handlers.
- `routes/` contains API routes.
- `middleware/` contains authentication, Arcjet, and error middleware.
