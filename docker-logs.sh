#!/bin/bash

# View Docker logs
# Usage: ./docker-logs.sh [service] [environment]
# Service: backend | frontend | all (default: all)
# Environment: dev | prod (default: prod)

SERVICE=${1:-}
ENVIRONMENT=${2:-prod}

if [ "$ENVIRONMENT" == "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

if [ -z "$SERVICE" ] || [ "$SERVICE" == "all" ]; then
    echo "📋 Showing logs for all services..."
    docker compose -f $COMPOSE_FILE logs -f
else
    echo "📋 Showing logs for $SERVICE..."
    docker compose -f $COMPOSE_FILE logs -f $SERVICE
fi
