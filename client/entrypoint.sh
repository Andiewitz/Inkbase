#!/bin/sh
set -e

# Substitute environment variables into the nginx config.
envsubst '${PORT} ${API_UPSTREAM}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

# Start Next.js standalone server in the background.
PORT=3000 node /app/server.js &

# Hand off to nginx (pid 1).
exec nginx -g 'daemon off;'
