#!/bin/bash

# Market Screener Pro - Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: dev | prod (default: prod)

set -e

ENVIRONMENT=${1:-prod}
PROJECT_NAME="market-screener"

echo "🚀 Deploying Market Screener Pro - Environment: $ENVIRONMENT"
echo "=================================================="

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_message "❌ Docker is not installed. Please install Docker first." "$RED"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    print_message "❌ Docker Compose is not installed. Please install Docker Compose first." "$RED"
    exit 1
fi

# Stop existing containers
print_message "🛑 Stopping existing containers..." "$YELLOW"
if [ "$ENVIRONMENT" == "dev" ]; then
    docker compose -f docker-compose.dev.yml down || true
else
    docker compose down || true
fi

# Clean up old images (optional)
# print_message "🧹 Cleaning up old images..." "$YELLOW"
# docker system prune -f

# Build images
print_message "🔨 Building Docker images..." "$BLUE"
if [ "$ENVIRONMENT" == "dev" ]; then
    docker compose -f docker-compose.dev.yml build --no-cache
else
    docker compose build --no-cache
fi

# Start containers
print_message "🚀 Starting containers..." "$BLUE"
if [ "$ENVIRONMENT" == "dev" ]; then
    docker compose -f docker-compose.dev.yml up -d
else
    docker compose up -d
fi

# Wait for services to be healthy
print_message "⏳ Waiting for services to be healthy..." "$YELLOW"
sleep 10

# Check container status
print_message "📊 Container Status:" "$BLUE"
if [ "$ENVIRONMENT" == "dev" ]; then
    docker compose -f docker-compose.dev.yml ps
else
    docker compose ps
fi

# Health check
print_message "🏥 Performing health checks..." "$YELLOW"
MAX_RETRIES=30
RETRY_COUNT=0

# Check backend health
until curl -f http://localhost:3001/api/health &>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    print_message "⏳ Waiting for backend... (${RETRY_COUNT}/${MAX_RETRIES})" "$YELLOW"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_message "❌ Backend health check failed" "$RED"
    exit 1
fi

print_message "✅ Backend is healthy!" "$GREEN"

# Check frontend health
RETRY_COUNT=0
until curl -f http://localhost:3000/health &>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    print_message "⏳ Waiting for frontend... (${RETRY_COUNT}/${MAX_RETRIES})" "$YELLOW"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_message "❌ Frontend health check failed" "$RED"
    exit 1
fi

print_message "✅ Frontend is healthy!" "$GREEN"

# Show logs
print_message "\n📋 Recent logs:" "$BLUE"
if [ "$ENVIRONMENT" == "dev" ]; then
    docker compose -f docker-compose.dev.yml logs --tail=20
else
    docker compose logs --tail=20
fi

# Success message
print_message "\n✅ Deployment successful!" "$GREEN"
print_message "==================================================" "$GREEN"
print_message "🌐 Frontend: http://localhost:3000" "$GREEN"
print_message "🔧 Backend API: http://localhost:3001/api" "$GREEN"
print_message "💚 Health Check: http://localhost:3001/api/health" "$GREEN"
print_message "==================================================" "$GREEN"

# Show helpful commands
print_message "\n📝 Useful commands:" "$BLUE"
if [ "$ENVIRONMENT" == "dev" ]; then
    echo "  View logs:     docker compose -f docker-compose.dev.yml logs -f"
    echo "  Stop:          docker compose -f docker-compose.dev.yml down"
    echo "  Restart:       docker compose -f docker-compose.dev.yml restart"
    echo "  Shell (backend): docker compose -f docker-compose.dev.yml exec backend sh"
else
    echo "  View logs:     docker compose logs -f"
    echo "  Stop:          docker compose down"
    echo "  Restart:       docker compose restart"
    echo "  Shell (backend): docker compose exec backend sh"
fi

print_message "\n🎉 Happy screening!" "$GREEN"
