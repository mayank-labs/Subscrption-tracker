# SubDub API

Base URL: `http://localhost:3000`

The machine-readable contract is [openapi.yaml](./openapi.yaml). The running
server returns that file from `GET /api/docs` with `text/yaml`.

## Conventions

- Content type for JSON requests: `application/json`.
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Dates are calendar dates in `YYYY-MM-DD` form unless noted otherwise.
- Subscription `price` is returned as a decimal **string**.
- Every resource query is scoped to the authenticated user.
- Refresh-token operations use the `refreshToken` HttpOnly cookie. Browser
  clients must send credentials (`credentials: 'include'`).

Successful responses use `{ "success": true, "data": ... }` unless an endpoint
only returns a message or a CSV file.

## Public endpoints

### `GET /health`

Returns process liveness without checking the database.

```json
{ "success": true, "status": "ok" }
```

### `GET /ready`

Runs `SELECT 1` against PostgreSQL. A successful response is:

```json
{ "success": true, "status": "ready" }
```

### `GET /`

Returns the service welcome message:

```json
{ "success": true, "message": "Welcome to SubDub" }
```

## Authentication

### `POST /api/v1/auth/sign-up`

Creates a user and starts a session.

Request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "correct horse battery staple"
}
```

`name` is required. `email` is trimmed, lowercased, and must be valid.
`password` must contain at least eight characters.

Response `201`:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "<uuid>",
      "name": "Ada Lovelace",
      "email": "ada@example.com"
    }
  }
}
```

Also sets the `refreshToken` HttpOnly cookie.

### `POST /api/v1/auth/sign-in`

Authenticates an existing user.

```json
{ "email": "ada@example.com", "password": "correct horse battery staple" }
```

Returns `200` with `accessToken` and `user`, and sets a new refresh cookie.

### `POST /api/v1/auth/refresh`

Rotates the refresh token from the `refreshToken` cookie and returns a new
access token and user. No JSON body is required.

Response `200`:

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "user": { "id": "<uuid>", "name": "Ada Lovelace", "email": "ada@example.com" }
  }
}
```

Returns `401` if the cookie is absent, expired, revoked, or invalid.

### `POST /api/v1/auth/sign-out`

Revokes the refresh token, when present, and clears the cookie.

```json
{ "success": true, "message": "User signed out successfully" }
```

## Users

All user endpoints require a bearer access token.

### `GET /api/v1/users`

Returns public fields for users:

```json
{
  "success": true,
  "data": [
    {
      "id": "<uuid>",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "createdAt": "2026-10-26T05:30:00.000Z",
      "updatedAt": "2026-10-26T05:30:00.000Z"
    }
  ]
}
```

### `GET /api/v1/users/{id}`

Returns one user or `404` when the ID does not exist.

## Subscriptions

All subscription endpoints require a bearer access token.

### Subscription request

Creation requires `name`, positive `price`, and `startDate`. Supply either
`billingCycle` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`) or `frequency`
(`Daily`, `Weekly`, `Monthly`, `Yearly`). Other fields are optional:

```json
{
  "name": "Streaming service",
  "price": 499,
  "currency": "INR",
  "billingCycle": "MONTHLY",
  "category": "Entertainment",
  "paymentMethod": "Visa",
  "startDate": "2026-10-01",
  "renewalDate": "2026-11-01"
}
```

If `renewalDate` is omitted, it is calculated from `startDate` and the billing
cycle. `categor` is accepted as a backwards-compatible alias for `category`.

### `POST /api/v1/subscriptions`

Creates a subscription and returns `201` with the serialized subscription.

### `GET /api/v1/subscriptions`

Lists the current user's subscriptions ordered by ascending renewal date.

### `GET /api/v1/subscriptions/{id}`

Returns one owned subscription or `404`.

### `PUT /api/v1/subscriptions/{id}`

Updates one or more subscription fields. At least one field is required.
`name`, `price`, `currency`, `billingCycle`/`frequency`, `category`/`categor`,
`paymentMethod`, `startDate`, and `renewalDate` are supported.

### `PUT /api/v1/subscriptions/{id}/cancel`

Marks an owned subscription as `CANCELLED` and returns the updated resource.

### `DELETE /api/v1/subscriptions/{id}`

Deletes an owned subscription.

```json
{ "success": true, "message": "Subscription deleted successfully" }
```

### `GET /api/v1/subscriptions/upcoming-renewals?days=30`

Returns active subscriptions whose renewal date is between today and the next
`days` days. `days` is an integer from `1` to `365`, defaulting to `30`.

### `GET /api/v1/subscriptions/export.csv`

Downloads `subscriptions.csv` as `text/csv`. Columns are:

```text
name,price,currency,frequency,category,status,startDate,renewalDate
```

## Analytics

All analytics endpoints require a bearer access token.

### `GET /api/v1/stats/summary`

Returns active-subscription spending totals:

```json
{
  "success": true,
  "data": {
    "monthlySpend": 499,
    "yearlySpend": 5988,
    "activeSubscriptions": 1,
    "nextRenewal": "2026-11-01T00:00:00.000Z"
  }
}
```

Daily and weekly prices are normalized to a monthly estimate. `nextRenewal` is
`null` when the user has no active subscriptions.

### `GET /api/v1/stats/by-category`

Returns active monthly spend grouped by category:

```json
{
  "success": true,
  "data": [
    { "category": "Entertainment", "monthlySpend": 499 }
  ]
}
```

### `GET /api/v1/stats/monthly-trend`

Returns 12 month labels and the projected monthly spend for each month.

### `GET /api/v1/stats/insights`

Returns the highest monthly cost, total monthly cost, yearly projection, and
number of categories:

```json
{
  "success": true,
  "data": {
    "mostExpensive": { "name": "Streaming service", "monthlySpend": 499 },
    "monthlyTotal": 499,
    "projectedYearlySpend": 5988,
    "categoryCount": 1
  }
}
```

## Errors

Validation errors return `400`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "price", "message": "Price must be greater than zero" }
  ]
}
```

Other common errors:

| Status | Meaning |
| --- | --- |
| `401` | Missing/invalid bearer token or refresh cookie |
| `404` | Resource does not exist or is not owned by the user |
| `409` | Duplicate unique value |
| `500` | Unexpected server or dependency failure |
