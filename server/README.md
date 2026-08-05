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
internal/api/     HTTP router and handlers
```
