# Server

Go backend for Inkbase.

## Run

```sh
cp .env.example .env
go run ./cmd/api
```

The API listens on `http://localhost:8080` by default (`PORT` overrides).

## Endpoints

| Method | Path          | Description        |
| ------ | ------------- | ------------------ |
| GET    | `/api/health` | Liveness check     |

## Layout

```
cmd/api/          entrypoint (server lifecycle)
internal/api/     HTTP router and handlers (thin, delegate to services)
services/         one self-contained module per domain (owns its own db logic)
shared/           shared types and helpers (no domain/db logic)
```

See `../AGENTS.md` for the services/ structure rules.
