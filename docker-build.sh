#!/bin/bash

# Quick Docker build script
# Usage: ./docker-build.sh [dev|prod]

ENVIRONMENT=${1:-prod}

echo "🔨 Building Docker images for $ENVIRONMENT environment..."

if [ "$ENVIRONMENT" == "dev" ]; then
    docker compose -f docker-compose.dev.yml build
else
    docker compose build
fi

echo "✅ Build complete!"
