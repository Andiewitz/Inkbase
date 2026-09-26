# Inkbase

Monorepo for Inkbase.

## Layout

```
client/    Next.js 16 + Tailwind CSS + Heroicons frontend
server/    Go 1.25 backend (net/http JSON API)
docs/      project documentation
scripts/   developer tooling
```

## Prerequisites

- Node.js 20+ and npm
- Go 1.25+

## Quick start

```sh
./scripts/dev.sh
```

- Client: http://localhost:3000
- API:    http://localhost:8080/api/health

The Next.js dev server proxies `/api/*` to the Go backend (override with `API_URL`).

See `docs/architecture.md` for details.
