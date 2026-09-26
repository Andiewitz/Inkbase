# Service Boundaries

## Philosophy

Inkbase is a **modular monolith today, microservices tomorrow**.

Every service under `services/` is written as if it were a completely
independent repository. It owns its own logic, its own database connection,
its own migrations, and its own error types. It does not reach into another
service's internals and it does not share state through global variables or
a centralised DB pool.

This discipline costs almost nothing now and means extracting a service into
its own process later is a find-and-replace of an import path, not a
rewrite.

---

## Directory layout

```
server/
  cmd/
    api/              ← binary entrypoint only (≤ 50 lines)
  internal/
    api/              ← HTTP handlers — thin wrappers, no domain logic
  services/
    auth/             ← auth domain (one "repository")
      service.go      ← Service struct + constructor
      account-setup.go
      jwt.go
      db/
        db.go         ← Open(), migrate(), driver error mapping
    payments/         ← future service (same pattern)
      service.go
      checkout.go
      db/
        db.go
  shared/             ← cross-cutting helpers only (response writing, etc.)
    response.go
```

Each `services/<name>/` folder is the blast radius for that domain.
Nothing outside it should need to change when you modify the internals.

---

## Rules

### 1 — One folder per domain, always

Every distinct domain or feature gets its own folder under `services/`.
Never merge two domains into one folder because they feel related today.
Domains that share data at the DB level still get separate service folders
and separate DB connections.

```
✅  services/auth/
✅  services/billing/
✅  services/canvas/

❌  services/auth-and-billing/   ← two domains, one folder
❌  services/misc/               ← catch-all
```

### 2 — No file exceeds 800 lines

A file that grows past 800 lines is a signal that a concept needs splitting.
Break it along the natural seams — one file per responsibility:

```
services/auth/
  service.go          ← Service struct, constructor, exported interface
  account-setup.go    ← Register / Login logic
  jwt.go              ← token signing and verification
  password.go         ← if password reset grows large enough to warrant it
  db/
    db.go             ← Open(), migrate(), isUniqueViolation(), etc.
```

If `db.go` itself approaches 800 lines, split by concern:

```
  db/
    db.go             ← Open(), Ping(), migrate()
    queries.go        ← named query functions
    errors.go         ← driver error mapping
```

The limit is a hard rule. Refactor before merging code that would breach it.

### 3 — Services never import each other

A service must not import another service's package. This is the single most
important rule for future extraction.

```go
// ✅  fine — a handler in internal/api imports services
import "inkbase/server/services/auth"
import "inkbase/server/services/billing"

// ❌  forbidden — one service importing another
// inside services/billing/checkout.go:
import "inkbase/server/services/auth"   // NO
```

When two services need to share information (e.g., billing needs a user ID
from auth), they communicate through:

- **Data already in the request** (e.g., a JWT claim passed by the handler)
- **A shared event / message** (future: a queue or event bus)
- **A well-defined HTTP/gRPC call** (future: when services are separated)

Never solve cross-service data needs with a direct package import.

### 4 — Each service owns its own database

A service opens its own `*sql.DB` in `services/<name>/db/db.go`.
No service borrows another service's connection. No shared connection pool
is passed around.

```go
// services/auth/service.go
func NewService() (*Service, error) {
    db, err := authdb.Open()   // auth's own connection
    ...
}

// services/billing/service.go
func NewService() (*Service, error) {
    db, err := billingdb.Open()   // billing's own connection
    ...
}
```

In the monolith both `Open()` calls hit the same SQLite file or the same
Postgres instance — but they do so independently. When services split into
separate processes, each `Open()` simply points to a different host.

### 5 — DB logic stays inside `db/`

No query, no `sql.DB` reference, and no migration belongs outside the
`services/<name>/db/` sub-package. The parent service package receives only
typed Go values from `db/`; it never sees a `*sql.Row` or a raw error string.

```go
// ✅  db/ returns typed values and sentinel errors
user, err := q.FindByEmail(email)
if errors.Is(err, authdb.ErrNotFound) { ... }

// ❌  service-layer code reading sql.ErrNoRows directly
if errors.Is(err, sql.ErrNoRows) { ... }   // leaks driver detail upward
```

### 6 — Handlers stay thin

`internal/api/` handlers do three things only:

1. Parse and validate the incoming request.
2. Call one service method.
3. Write the response.

Domain rules, error translation, and DB access never live in a handler.
If a handler grows beyond ~60 lines, domain logic has leaked in — move it
to the service.

### 7 — `shared/` is for pure helpers, never domain logic

`shared/` may contain:

- HTTP response helpers (`WriteJSON`, `WriteError`)
- Generic validation utilities
- Middleware skeletons

It must never contain:

- Any import of a `services/` package
- DB access
- Business logic of any kind

If something in `shared/` needs to know about a domain concept, it belongs
in that domain's service, not in `shared/`.

---

## What "treat it like its own repo" means in practice

Before committing code to a service, ask:

> If I copied this folder to a brand-new Git repository with only the
> standard library and its own `go.mod`, would it compile and make sense?

Concretely:

- All domain types are defined inside the service package, not imported
  from a sibling service.
- The `db/` sub-package handles its own migrations — there is no central
  migration runner.
- Config is read from environment variables directly inside the service;
  nothing is injected from outside except where explicitly designed (e.g.,
  a `*sql.DB` passed in tests).
- Error types (`ErrEmailTaken`, `ErrNotFound`, …) are declared inside the
  service and exported for callers — they do not live in `shared/`.

---

## Current services

| Folder | Domain | DB |
|---|---|---|
| `services/auth` | Registration, login, JWT signing/verification | `users` table |
| `services/documents` | Manuscripts CRUD, import/export, trash/restore (persistence in `db/`) | `documents` table |
| `services/health` | Liveness check (no DB) | — |

---

## Adding a new service

```
services/
  <name>/
    service.go        ← Service struct, NewService() constructor
    <domain>.go       ← business logic (split further as it grows)
    db/
      db.go           ← Open(), migrate(), error mapping
```

Checklist:

- [ ] `NewService()` calls its own `db.Open()` — nothing is shared with
      other services
- [ ] All exported errors are sentinel values defined in this package
- [ ] No file exceeds 800 lines on creation (design for it, don't fix it later)
- [ ] No import of any other `services/<name>` package
- [ ] A handler is wired in `internal/api/server.go` — thin, ≤ 60 lines per
      handler function
- [ ] The service compiles with only its own files and the standard library
      plus explicit third-party dependencies

---

## Migration path to microservices

When a service is ready to be extracted:

1. Copy `services/<name>/` into a new repository.
2. Add a `go.mod` with the same module path.
3. Replace the direct `NewService()` call in the monolith with an HTTP or
   gRPC client that talks to the new process.
4. No other files change.

The handler signature in `internal/api/` does not change because it already
talks to an interface (`*auth.Service`), not to a concrete DB call.
Swapping the concrete value for a client satisfies the same call sites.
