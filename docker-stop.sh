#!/bin/bash

# Stop Docker containers
# Usage: ./docker-stop.sh [dev|prod]

ENVIRONMENT=${1:-prod}

echo "🛑 Stopping Market Screener containers..."

if [ "$ENVIRONMENT" == "dev" ]; then
    docker compose -f docker-compose.dev.yml down
else
    docker compose down
fi

echo "✅ All containers stopped!"
