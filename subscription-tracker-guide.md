# SubDub

SubDub is a subscription-tracking API. It helps an authenticated user record
recurring payments, see upcoming renewals, export their subscriptions, and
understand projected monthly and yearly spending.

The project is currently a backend-first application:

- **Node.js + Express** provide the HTTP API.
- **PostgreSQL + Prisma** store users, subscriptions, refresh tokens, and
  reminder history.
- **JWT access tokens** protect API requests.
- **HttpOnly refresh-token cookies** support session renewal and rotation.
- **Zod** validates request bodies and query parameters.
- **Helmet, CORS, Arcjet, and pino-http** provide baseline hardening and
  request protection/logging.
- **pg-boss and Resend** are used by the optional renewal-reminder worker.

## Documentation map

| Document | Purpose |
| --- | --- |
| [docs/openapi.yaml](./backend/docs/openapi.yaml) | Machine-readable OpenAPI 3.0 contract |
| [docs/API.md](./backend/docs/API.md) | Human-readable endpoint reference and examples |
| [README.md](./README.md) | Quick start and repository overview |

The running API also serves the OpenAPI document at `GET /api/docs`.

## Project layout

```text
backend/
├── app.js                         # Express app and route registration
├── server.js                      # Database connection and HTTP startup
├── config/                        # Environment and Arcjet configuration
├── controllers/                   # HTTP handlers
├── database/                      # Shared Prisma client
├── docs/openapi.yaml              # OpenAPI contract
├── jobs/reminders.js              # Optional renewal reminder worker
├── middleware/                    # Auth, validation, security, and errors
├── prisma/schema.prisma           # PostgreSQL data model
├── routes/                        # Endpoint declarations
├── services/                      # Auth, subscription, and analytics logic
├── utils/                         # Token, date, and money helpers
└── validation/                    # Zod schemas
```

### Request lifecycle

1. Express parses JSON, cookies, and form-encoded requests.
2. Helmet, CORS, pino-http, and Arcjet middleware run.
3. Protected routes verify the `Authorization: Bearer <access-token>` header.
4. Zod validates request bodies or query parameters.
5. Controllers call services or Prisma and return a consistent JSON response.
6. The error middleware maps known database/application errors to HTTP status
   codes.

`app.js` creates the app without opening a port, which keeps the application
testable. `server.js` connects Prisma, starts reminder jobs, and listens on the
configured port.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL (Supabase PostgreSQL is supported)

## Local setup

```bash
cd backend
npm install
cp .env.example .env
```

Set at least `DATABASE_URL` and an access/refresh JWT secret in `backend/.env`.
The application accepts either `JWT_SECRET` for both token types or separate
`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values. Use long, random secrets
outside local development.

Initialize and validate the Prisma client:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate -- --name init
```

Start the development server:

```bash
npm run dev
```

The default server URL is `http://localhost:3000`.

Useful commands:

| Command | Description |
| --- | --- |
| `npm run dev` | Start with Nodemon |
| `npm start` | Start the production process |
| `npm run lint` | Run ESLint |
| `npm run db:validate` | Validate Prisma configuration/schema |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate -- --name <name>` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations in deployment |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | Runtime mode; defaults to `development` |
| `PORT` | No | HTTP port; defaults to `3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | One secret option | Fallback secret for access and refresh tokens |
| `JWT_ACCESS_SECRET` | One secret option | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | One secret option | Secret used to sign refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | Access-token lifetime; defaults to `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh-token lifetime in seconds; defaults to `604800` |
| `CLIENT_URL` | No | Allowed CORS origin; defaults to `http://localhost:5173` |
| `ARCJET_ENV` | No | Arcjet environment |
| `ARCJET_KEY` | No | Arcjet key; required when Arcjet protection is enabled |
| `RESEND_API_KEY` | No | Enables email delivery for reminders |
| `REMINDER_FROM_EMAIL` | No | Sender used by reminders |
| `SUPABASE_URL` | No | Supabase project URL for Supabase-specific integrations |
| `SUPABASE_PUBLIC_KEY` | No | Supabase public key |
| `SUPABASE_SERVICE_KEY` | No | Supabase service key; keep private |

Never commit `.env` or production credentials. `backend/.env.example` is the
canonical list of supported variables.

## Authentication model

### Sign up/sign in

`POST /api/v1/auth/sign-up` and `POST /api/v1/auth/sign-in` return a short-lived
access token in the JSON response. They also set a `refreshToken` HttpOnly
cookie.

Send the access token on protected requests:

```http
Authorization: Bearer <accessToken>
```

### Refresh and sign out

The browser must send the refresh cookie to `POST /api/v1/auth/refresh`.
Successful refresh rotates the stored refresh-token hash and sets a new cookie.
`POST /api/v1/auth/sign-out` revokes the current refresh token and clears the
cookie. Refresh-token cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in
production.

## Data model

### User

Users have a UUID, name, unique email, password hash, timestamps, subscriptions,
and refresh tokens. Password hashes and refresh-token hashes are never returned
by the API.

### Subscription

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Server-generated |
| `name` | string | Required |
| `price` | decimal string | Positive amount; serialized as a string to preserve precision |
| `currency` | string | Three-letter code; defaults to `INR` |
| `billingCycle` | enum | `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `frequency` | string | Response alias: `Daily`, `Weekly`, `Monthly`, or `Yearly` |
| `category` | string | Defaults to `Other` |
| `paymentMethod` | string | Payment method label |
| `status` | enum | `ACTIVE` or `CANCELLED` |
| `startDate` | `YYYY-MM-DD` | Required on creation |
| `renewalDate` | `YYYY-MM-DD` | Calculated when omitted |
| `createdAt` / `updatedAt` | ISO datetime | Server timestamps |

All subscription queries are scoped to the authenticated user. A user cannot
read or modify another user's subscription by guessing its ID.

## Response conventions

Successful JSON responses generally use:

```json
{ "success": true, "data": {} }
```

Mutation messages may add a `message` property. Errors use:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Enter a valid email" }
  ]
}
```

Authentication failures currently return `{ "message": "unauthorized" }`.
Validation failures return HTTP `400`; missing/invalid authentication returns
`401`; missing resources return `404`; duplicate records return `409`; and
unexpected failures return `500`.

## API overview

| Group | Base path | Authentication |
| --- | --- | --- |
| Health | `/health`, `/ready` | Public |
| API contract | `/api/docs` | Public |
| Authentication | `/api/v1/auth` | Public, except cookie-based refresh/sign-out |
| Users | `/api/v1/users` | Bearer token |
| Subscriptions | `/api/v1/subscriptions` | Bearer token |
| Analytics | `/api/v1/stats` | Bearer token |

See [docs/API.md](./backend/docs/API.md) for request/response examples and
parameter details. Use [docs/openapi.yaml](./backend/docs/openapi.yaml) with
Swagger UI, Postman, Insomnia, or another OpenAPI-compatible tool.

## Database and migrations

Prisma uses PostgreSQL. The schema contains `User`, `RefreshToken`,
`Subscription`, and `ReminderLog` models. Subscription and refresh-token rows
are indexed for user ownership, renewal lookup, and token expiry.

For production:

```bash
cd backend
npm run db:deploy
npm start
```

Run migrations against a non-production database during development. Back up
production data before applying schema changes.

## Renewal reminders

The server starts the reminder worker before listening. The worker uses pg-boss
when configured and sends reminders through Resend when `RESEND_API_KEY` is
available. Reminder records are unique per subscription and renewal date, which
prevents duplicate sends for the same renewal.

If email delivery is not configured, the core API still supports subscription
tracking; configure and monitor the worker separately in production.

## Security and operations

- Keep all JWT, database, Arcjet, Supabase service, and Resend credentials out
  of source control.
- Use HTTPS and trusted PostgreSQL certificate verification in production.
- Restrict `CLIENT_URL` to the deployed frontend origin.
- Do not expose `SUPABASE_SERVICE_KEY` to a browser.
- Treat the access token as short-lived and use refresh rotation rather than
  storing long-lived access tokens.
- Monitor `/health` for process liveness and `/ready` for database readiness.
- Review structured request logs and failed reminder jobs.

## Extending the API

When adding an endpoint:

1. Add the route under the appropriate `backend/routes` module.
2. Add or update a Zod schema in `backend/validation`.
3. Keep HTTP parsing in a controller and business rules in a service.
4. Scope database queries by `req.user.id` on protected resources.
5. Update both `backend/docs/openapi.yaml` and `backend/docs/API.md`.
6. Add a representative request/response example.
7. Run `npm run lint`, validate the OpenAPI YAML, and exercise the endpoint
   with an authenticated and unauthenticated request.
