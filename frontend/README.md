# SubDub frontend

The frontend is a Vite + React application.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The Vite proxy forwards `/api` requests to `VITE_BACKEND_URL`.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```
