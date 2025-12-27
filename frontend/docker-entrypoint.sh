#!/bin/sh
set -e

# Use PORT environment variable from Cloud Run, default to 3000
PORT=${PORT:-3000}

# Create nginx config from template
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
