# Architecture

Inkbase is a two-tier monorepo:

```
┌──────────────────┐      /api/*      ┌──────────────────┐
│      client      │ ───────────────▶ │      server      │
│  Next.js 16 +    │    (dev proxy)   │      Go 1.24     │
│  Tailwind +      │                  │  net/http        │
│  Heroicons       │ ◀─────────────── │  JSON API        │
└──────────────────┘                  └──────────────────┘
```

## Client (`client/`)

- Next.js 16 (Pages Router, TypeScript, Tailwind CSS)
- Heroicons for icons
- `next.config.ts` rewrites `/api/:path*` to the Go server
  (default `http://localhost:8080`, override with `API_URL`)

## Server (`server/`)

- Go 1.24 stdlib `net/http` with the enhanced `ServeMux` routing
- Entrypoint: `cmd/api/main.go`
- Handlers: `internal/api/`

## Scripts

- `scripts/dev.sh` runs both the Go API and the Next.js dev server.
