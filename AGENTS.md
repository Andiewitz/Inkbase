# Server Agent Rules

## services/ structure

Every service is a self-contained module in its own folder under `services/`.
A service owns ALL of its own logic — including its database access. DB code
for a service lives inside that service's folder, never in a shared or central
location.

```
services/
  auth/
    account-setup.go
    jwt.go
    db.go          <- auth's db stuff lives here
  payments/
    checkout.go
    db.go          <- payments owns its own db logic
```

Rules:

- Each feature/domain gets its own folder under `services/`.
- DB logic belongs to the service that owns the data. Do not centralize it.
- `internal/api/` handlers stay thin: parse input, call a service, write the response.
- `shared/` is only for cross-cutting helpers (response writing, validation, etc.),
  never for domain logic or DB code.
