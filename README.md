# SubDub

SubDub is a PostgreSQL-backed subscription tracker with an Express API,
Prisma data access, JWT authentication, analytics, CSV export, and optional
renewal reminders.

## Start here

The complete setup, architecture, configuration, data model, and operational
notes are in [subscription-tracker-guide.md](./subscription-tracker-guide.md).

The API references are:

- [Human-readable API documentation](./backend/docs/API.md)
- [OpenAPI 3.0 specification](./backend/docs/openapi.yaml)

When the backend is running, the same OpenAPI document is available at
`http://localhost:3000/api/docs`.

## Quick start

```bash
cd backend
npm install
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET (or separate JWT access/refresh secrets).
npm run db:validate
npm run db:generate
npm run db:migrate -- --name init
npm run dev
```

The default API URL is `http://localhost:3000`.

In a second terminal, start the frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The frontend is available at `http://localhost:5173`. Its Vite proxy forwards
API requests to the backend configured by `VITE_BACKEND_URL`.

Public endpoints:

- `GET /health`
- `GET /ready`
- `GET /api/docs`

Authenticated endpoint groups:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/subscriptions`
- `/api/v1/stats`

Never commit `backend/.env` or any database, JWT, Supabase, Arcjet, or Resend
secret.
