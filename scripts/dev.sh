#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "starting API (server/)..."
(cd "$ROOT/server" && go run ./cmd/api) &
API_PID=$!

trap 'kill $API_PID 2>/dev/null || true' EXIT INT TERM

echo "starting client (client/)..."
(cd "$ROOT/client" && npm run dev)
