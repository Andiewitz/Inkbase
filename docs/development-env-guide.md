# Development Environment Guide

## Overview

Inkbase runs **SQLite in development** and **PostgreSQL in production**.
The switch is automatic — no config change is needed locally.
Everything above the database driver (queries, migrations, service logic) is
identical in both environments so that dev behaviour faithfully reflects
production.

---

## How the DB driver is selected

The server reads the `APP_ENV` environment variable at startup
(see `services/auth/db/db.go`):

| `APP_ENV` value | Driver used | Connection source |
|---|---|---|
| anything other than `"production"` | SQLite (`modernc.org/sqlite`) | `inkbase_dev.db` file in the working directory |
| `"production"` | PostgreSQL (`lib/pq`) | `DATABASE_URL` environment variable |

```go
// services/auth/db/db.go
if env == "production" {
    db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
} else {
    db, err = sql.Open("sqlite", "inkbase_dev.db")
}
```

When you run `scripts/dev.sh`, `APP_ENV` is unset, so SQLite is used
automatically. No `.env` file or Docker setup is required.

---

## Why the data layer stays identical

The goal is **zero divergence** between dev and production behaviour.
This is enforced through the following rules:

### 1. Queries use the `database/sql` interface only

All service code talks to a `*sql.DB` — a standard-library interface
supported by both drivers. No driver-specific APIs are used in business logic.

### 2. Placeholder syntax: `?` everywhere

Both the SQLite and PostgreSQL drivers used here accept `?` positional
placeholders in queries. Do **not** use `$1`, `$2`, … (Postgres-only) in
service-layer queries.

```go
// ✅  correct — works on both drivers
s.db.QueryRow(`SELECT id, password_hash FROM users WHERE email = ?`, email)

// ❌  wrong — Postgres-only, will break SQLite
s.db.QueryRow(`SELECT id, password_hash FROM users WHERE email = $1`, email)
```

### 3. Migrations are shared; only the auto-increment syntax differs

The `migrate()` function in each service's `db/db.go` runs on every boot and
is safe to call repeatedly (`CREATE TABLE IF NOT EXISTS`).
The only dialect difference allowed inside migrations is the primary-key
column type:

| Environment | Primary key syntax |
|---|---|
| development (SQLite) | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| production (PostgreSQL) | `BIGSERIAL PRIMARY KEY` |

All other column types (`TEXT`, `TIMESTAMP`, `NOT NULL`, `UNIQUE`, etc.) must
be valid in both dialects. Avoid Postgres-specific types (`JSONB`, `UUID`,
`ARRAY`, etc.) in migrations unless an equivalent SQLite representation is
also handled.

### 4. Error handling is dialect-aware at the boundary only

Unique-constraint errors and other driver-specific error strings are
translated into typed sentinel errors (e.g. `auth.ErrEmailTaken`) inside the
service's `db/db.go`. Service logic and HTTP handlers never inspect raw driver
error messages.

---

## Starting the dev environment

```bash
bash scripts/dev.sh
```

This starts both processes concurrently:

| Process | Address |
|---|---|
| Go API server | `http://localhost:8080` |
| Next.js client | `http://localhost:3000` |

The SQLite database file (`inkbase_dev.db`) is created automatically in
`server/` on first boot. It is git-ignored.

---

## Adding a new service

Follow the same pattern as `services/auth/`:

1. Create `services/<name>/db/db.go` with its own `Open()` and `migrate()`.
2. Keep all DB logic inside that package — do not share a DB connection across
   services.
3. Use `?` placeholders and only cross-dialect column types.
4. Map driver errors to sentinel values at the `db/` boundary.

---

## Production

Set the following environment variables on the server:

```
APP_ENV=production
DATABASE_URL=postgres://user:password@host:5432/inkbase?sslmode=require
JWT_SECRET=<strong-random-secret>
TRUST_PROXY=true
```

- `JWT_SECRET` is **required** in production. The server refuses to boot without
  it — a missing secret would otherwise sign tokens with the public dev
  fallback, letting anyone forge a session.
- `TRUST_PROXY=true` must only be set when the server sits behind a proxy
  (NGINX, load balancer) that rewrites `X-Forwarded-For`. Without it, the rate
  limiter keys on the direct connection address and ignores forwarded headers —
  a spoofed header cannot bypass it.

No other change is required — the same binary that runs locally will connect
to PostgreSQL when `APP_ENV=production`.
