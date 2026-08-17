# Deploy to Railway

## Services

| Service    | Source          | Public? | Description                                |
|------------|-----------------|---------|--------------------------------------------|
| `api`      | `server/`       | no      | Go HTTP API (listens on `PORT`)            |
| `web`      | `client/`       | yes     | Nginx + Next.js standalone (entrypoint)    |
| Postgres   | Railway plugin  | no      | Shared database for auth + documents       |

`web` is the only public entry point. Nginx routes `/api/*` to the `api`
service (internal) and everything else to the bundled Next.js server.

---

## One-time setup

### 1. Create the Postgres plugin

In the Railway dashboard, add a **Postgres** plugin to your project. Railway
provisions it automatically and exposes the `DATABASE_URL` variable.

### 2. Create the `api` service

- **Root directory:** `server/`
- **Dockerfile:** `server/Dockerfile` (auto-detected)
- **Health check path:** `/api/health` (TCP default is also fine)

Set these variables in the service's **Variables** tab:

| Variable         | Value / Reference                  | Why                                        |
|------------------|-------------------------------------|--------------------------------------------|
| `APP_ENV`        | `production`                        | Enables Postgres, secure cookies, JWT enforcement |
| `DATABASE_URL`   | `${{Postgres.DATABASE_URL}}`        | Postgres connection string                 |
| `JWT_SECRET`     | *(generate a random string)*        | HMAC signing key — app refuses to boot without it |
| `TRUST_PROXY`    | `true`                              | Two-hop proxy; without this the rate limiter is per-proxy-IP |

### 3. Create the `web` service

- **Root directory:** `client/`
- **Dockerfile:** `client/Dockerfile` (auto-detected)

Set these variables:

| Variable       | Value / Reference                          | Why                                        |
|----------------|---------------------------------------------|--------------------------------------------|
| `API_UPSTREAM` | `http://api.railway.internal:8080`          | Nginx upstream — points to the Go API's internal domain + port |

> If `api` uses a non-default port, update the `:8080` suffix to match its
> `PORT` value. Alternatively, set `API_UPSTREAM` to the public URL of the
> `api` service (e.g. `https://api.up.railway.app`) for a zero-config option.

### 4. (Optional) Keep the fallback rewrite working

The client's `next.config.ts` still contains a rewrite from `/api/*` →
`API_URL`. With nginx handling routing this rewrite is never reached, but if
you ever expose the `web` service directly without nginx, set `API_URL` on the
`web` service to the `api` service URL so the rewrite still works.

---

## Deploy

Push to `main`. Railway builds both services from their respective Dockerfiles.

The `api` service runs migrations on boot (idempotent `CREATE TABLE IF NOT
EXISTS`), so no manual migration step is required.

---

## Local Docker run

```sh
# API server
cd server
docker build -t inkbase-api .
docker run -p 8080:8080 \
  -e APP_ENV=development \
  inkbase-api

# Client (nginx + Next)
cd client
docker build -t inkbase-web .
docker run -p 8080:8080 \
  -e API_UPSTREAM=127.0.0.1:8080 \
  -e PORT=8080 \
  inkbase-web
```

---

## Running Postgres integration tests

```sh
cd server
INKBASE_TEST_POSTGRES="postgres://user:pass@localhost:5432/inkbase?sslmode=disable" \
  go test ./services/documents/ -v -run TestPostgres
```

The test is skipped when `INKBASE_TEST_POSTGRES` is not set.
