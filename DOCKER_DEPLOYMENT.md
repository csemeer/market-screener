# Docker Deployment Guide
## Market Screener Pro - Complete Docker Setup

**Version:** 1.0
**Last Updated:** December 24, 2025
**Status:** Production Ready

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Environment Setup](#environment-setup)
5. [Development Deployment](#development-deployment)
6. [Production Deployment](#production-deployment)
7. [Docker Commands](#docker-commands)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)
10. [CI/CD Integration](#cicd-integration)
11. [Security Best Practices](#security-best-practices)

---

## Quick Start

### Production Deployment (3 Commands)
```bash
# 1. Clone repository
git clone <your-repo-url>
cd market-screener

# 2. Run deployment script
./deploy.sh prod

# 3. Access application
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001/api
```

### Development Deployment
```bash
./deploy.sh dev
```

---

## Prerequisites

### Required Software
- **Docker:** Version 20.10+
- **Docker Compose:** Version 2.0+
- **Git:** For cloning repository

### System Requirements
- **CPU:** 2+ cores recommended
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 10GB free space
- **OS:** Linux, macOS, or Windows with WSL2

### Installation Guides

#### Docker Installation
**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
```bash
brew install docker docker-compose
```

**Windows:**
- Download Docker Desktop from https://www.docker.com/products/docker-desktop

#### Verify Installation
```bash
docker --version
docker compose version
```

---

## Architecture

### Container Structure
```
┌─────────────────────────────────────────┐
│         Docker Network                  │
│  (market-screener-network)              │
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │   Frontend   │   │    Backend    │  │
│  │  (Nginx)     │───│   (Node.js)   │  │
│  │  Port: 3000  │   │  Port: 3001   │  │
│  └──────────────┘   └───────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Production Build Process

#### Backend
1. **Builder Stage:**
   - Install production dependencies
   - Compile TypeScript → JavaScript
   - Optimize for production

2. **Runtime Stage:**
   - Use minimal Alpine image
   - Copy compiled code
   - Run as non-root user
   - Include health checks

#### Frontend
1. **Builder Stage:**
   - Install dependencies
   - Build React app with Vite
   - Optimize assets

2. **Runtime Stage:**
   - Use Nginx Alpine image
   - Serve static files
   - Configure routing for SPA
   - Add security headers

---

## Environment Setup

### Backend Environment Variables

Create `/backend/.env` (production):
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

### Frontend Environment Variables

Create `/frontend/.env.production`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Market Screener Pro
VITE_APP_VERSION=1.0.0
```

For production deployment, update `VITE_API_URL` to your production API URL.

---

## Development Deployment

### Start Development Environment
```bash
# Using deployment script
./deploy.sh dev

# OR using Docker Compose directly
docker compose -f docker-compose.dev.yml up -d
```

### Development Features
- ✅ **Hot Reload:** Code changes reflect immediately
- ✅ **Volume Mounts:** Local code synced to containers
- ✅ **Debug Mode:** Full error messages and stack traces
- ✅ **Source Maps:** Debugging support

### Development Environment Details

**Backend:**
- Runs with `nodemon` for auto-restart
- TypeScript compiled on-the-fly with `ts-node`
- All dependencies installed (including dev)
- Port: 3001

**Frontend:**
- Runs with Vite dev server
- HMR (Hot Module Replacement) enabled
- React Fast Refresh active
- Port: 3000

### Verify Development Deployment
```bash
# Check container status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Test endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000
```

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Environment variables configured
- [ ] API URLs updated for production
- [ ] Docker and Docker Compose installed
- [ ] Sufficient system resources available
- [ ] Firewall rules configured (ports 3000, 3001)

### Deploy to Production
```bash
# Full deployment with health checks
./deploy.sh prod

# OR manual deployment
docker compose build --no-cache
docker compose up -d
```

### Production Features
- ✅ **Multi-stage Builds:** Minimal image sizes
- ✅ **Non-root Users:** Enhanced security
- ✅ **Health Checks:** Automatic restart on failure
- ✅ **Log Rotation:** Prevents disk space issues
- ✅ **Resource Limits:** Prevents resource exhaustion
- ✅ **Security Headers:** OWASP best practices

### Production Image Sizes
- **Backend:** ~150MB (Node + compiled code)
- **Frontend:** ~25MB (Nginx + static assets)
- **Total:** ~175MB

### Verify Production Deployment
```bash
# Check all services healthy
docker compose ps

# Health checks
curl http://localhost:3001/api/health
# Should return: {"status":"healthy","timestamp":"..."}

curl http://localhost:3000/health
# Should return: healthy

# View application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api
```

---

## Docker Commands

### Deployment Scripts (Recommended)

#### Deploy
```bash
./deploy.sh [dev|prod]    # Full deployment with health checks
```

#### Build
```bash
./docker-build.sh [dev|prod]    # Build images only
```

#### Stop
```bash
./docker-stop.sh [dev|prod]     # Stop all containers
```

#### Logs
```bash
./docker-logs.sh [service] [dev|prod]    # View logs
# Examples:
./docker-logs.sh backend prod
./docker-logs.sh frontend dev
./docker-logs.sh all prod
```

### Manual Docker Compose Commands

#### Start Services
```bash
# Production
docker compose up -d

# Development
docker compose -f docker-compose.dev.yml up -d

# With rebuild
docker compose up -d --build
```

#### Stop Services
```bash
# Stop containers (preserve data)
docker compose down

# Stop and remove volumes
docker compose down -v

# Force remove
docker compose down --remove-orphans
```

#### View Status
```bash
# Container status
docker compose ps

# Resource usage
docker compose top

# Service health
docker inspect market-screener-backend | grep -A5 Health
```

#### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### Individual Container Commands

#### Execute Commands in Container
```bash
# Backend shell
docker compose exec backend sh

# Frontend shell
docker compose exec frontend sh

# Run command
docker compose exec backend npm run build
```

#### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Image Management

#### Build Images
```bash
# Build all
docker compose build

# Build specific service
docker compose build backend

# No cache
docker compose build --no-cache
```

#### Remove Images
```bash
# Remove all project images
docker compose down --rmi all

# Remove unused images
docker image prune -a
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect market-screener_backend-node-modules

# Remove volumes
docker volume rm market-screener_backend-node-modules
```

### Network Management
```bash
# List networks
docker network ls

# Inspect network
docker network inspect market-screener_market-screener-network

# Remove network
docker network rm market-screener_market-screener-network
```

---

## Monitoring & Logs

### Real-time Monitoring

#### View All Logs
```bash
docker compose logs -f
```

#### View Service-specific Logs
```bash
# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

#### Filter Logs by Time
```bash
# Last 50 lines
docker compose logs --tail=50 backend

# Since timestamp
docker compose logs --since 2024-01-01T00:00:00
```

### Container Health Status
```bash
# Quick health check
docker compose ps

# Detailed health info
docker inspect market-screener-backend --format='{{json .State.Health}}'
docker inspect market-screener-frontend --format='{{json .State.Health}}'
```

### Resource Usage
```bash
# Real-time stats
docker stats

# Specific container
docker stats market-screener-backend
```

### Log File Locations

**Within containers:**
- Backend: Application logs to stdout/stderr (captured by Docker)
- Frontend: Nginx logs to stdout/stderr

**On host (Docker manages):**
- Location: `/var/lib/docker/containers/<container-id>/<container-id>-json.log`
- Max size: 10MB per file
- Max files: 3 (rotation enabled)

### Export Logs
```bash
# Export to file
docker compose logs > deployment-logs.txt

# Export with timestamp
docker compose logs --timestamps > logs-$(date +%Y%m%d).txt
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
**Error:** `Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use`

**Solution:**
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process
kill -9 <PID>

# OR change port in docker-compose.yml
ports:
  - "8000:3000"  # Map to different host port
```

#### 2. Backend Not Healthy
**Symptoms:** Backend container keeps restarting

**Diagnosis:**
```bash
# Check logs
docker compose logs backend

# Check health
docker inspect market-screener-backend | grep -A10 Health
```

**Solutions:**
```bash
# Rebuild without cache
docker compose build --no-cache backend
docker compose up -d backend

# Check environment variables
docker compose exec backend env

# Manual health check
docker compose exec backend wget -qO- http://localhost:3001/api/health
```

#### 3. Frontend Serving 404
**Symptoms:** Nginx returns 404 for React routes

**Solution:** Verify `nginx.conf` has correct SPA routing:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### 4. API Connection Refused
**Symptoms:** Frontend can't connect to backend

**Diagnosis:**
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check network
docker network inspect market-screener_market-screener-network
```

**Solutions:**
- Verify `VITE_API_URL` in frontend environment
- Check CORS configuration in backend
- Ensure containers are on same network

#### 5. Build Failures
**Error:** `npm ERR! code ELIFECYCLE`

**Solutions:**
```bash
# Clear npm cache
docker compose build --no-cache

# Remove node_modules volumes
docker compose down -v
docker volume rm market-screener_backend-node-modules
docker volume rm market-screener_frontend-node-modules

# Rebuild
docker compose build
```

#### 6. Out of Memory
**Error:** Container exits with code 137

**Solution:**
```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory

# OR add resource limits to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Debug Mode

#### Enable Verbose Logging
```bash
# Backend
docker compose exec backend sh -c "export LOG_LEVEL=debug && npm start"

# View detailed logs
docker compose logs -f backend
```

#### Interactive Shell
```bash
# Access container shell
docker compose exec backend sh

# Check files
ls -la
cat dist/index.js

# Test manually
node dist/index.js
```

### Reset Everything
```bash
# Nuclear option - complete reset
docker compose down -v --remove-orphans
docker system prune -af
docker volume prune -f

# Rebuild from scratch
./deploy.sh prod
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy Market Screener

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build images
        run: docker compose build

      - name: Run tests
        run: |
          docker compose up -d
          sleep 10
          curl -f http://localhost:3001/api/health
          curl -f http://localhost:3000/health

      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker compose push

      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          # SSH to server and deploy
          ssh user@server './deploy.sh prod'
```

### GitLab CI Example

Create `.gitlab-ci.yml`:
```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - docker compose build
  only:
    - main

test:
  stage: test
  script:
    - docker compose up -d
    - sleep 10
    - curl -f http://localhost:3001/api/health
    - curl -f http://localhost:3000/health
    - docker compose down
  only:
    - main

deploy:
  stage: deploy
  script:
    - ./deploy.sh prod
  only:
    - main
  when: manual
```

---

## Security Best Practices

### Implemented Security Features

#### 1. Non-Root Users
Both containers run as non-root users:
```dockerfile
USER nodejs  # Backend
USER nginx   # Frontend
```

#### 2. Security Headers (Nginx)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

#### 3. Health Checks
Automatic container restart on failure:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

#### 4. Minimal Images
- Alpine-based images (smaller attack surface)
- Multi-stage builds (no build tools in production)
- Only production dependencies

#### 5. Log Rotation
Prevents disk space exhaustion:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Additional Security Recommendations

#### 1. Use HTTPS in Production
```nginx
# Add to nginx.conf
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
}
```

#### 2. Implement Rate Limiting
```nginx
# Add to nginx.conf
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20;
}
```

#### 3. Use Docker Secrets
```yaml
# docker-compose.yml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  backend:
    secrets:
      - db_password
```

#### 4. Regular Updates
```bash
# Update base images
docker compose pull
docker compose build --pull

# Update dependencies
docker compose exec backend npm update
```

#### 5. Scan for Vulnerabilities
```bash
# Install Trivy
brew install trivy  # macOS
apt-get install trivy  # Ubuntu

# Scan images
trivy image market-screener-backend:latest
trivy image market-screener-frontend:latest
```

---

## Advanced Configuration

### Custom Domain Setup

#### Update Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... rest of configuration
}
```

### Scaling with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml market-screener

# Scale services
docker service scale market-screener_backend=3
```

### Kubernetes Deployment

Convert Docker Compose to Kubernetes:
```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.28.0/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# Convert
kompose convert -f docker-compose.yml

# Deploy
kubectl apply -f .
```

---

## Backup and Restore

### Backup Containers
```bash
# Export container state
docker export market-screener-backend > backend-backup.tar
docker export market-screener-frontend > frontend-backup.tar
```

### Backup Volumes
```bash
# Backup volume
docker run --rm -v market-screener_backend-node-modules:/data -v $(pwd):/backup alpine tar czf /backup/backend-modules.tar.gz /data
```

### Restore
```bash
# Import container
docker import backend-backup.tar market-screener-backend:restored

# Restore volume
docker run --rm -v market-screener_backend-node-modules:/data -v $(pwd):/backup alpine tar xzf /backup/backend-modules.tar.gz -C /data
```

---

## Performance Optimization

### Build Optimization
```dockerfile
# Use .dockerignore to exclude unnecessary files
# Layer caching - copy package.json first
COPY package*.json ./
RUN npm ci
COPY . .
```

### Runtime Optimization
```yaml
# Resource limits
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      memory: 256M
```

### Network Optimization
```yaml
# Use bridge network for internal communication
networks:
  market-screener-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

---

## Appendix

### File Structure
```
market-screener/
├── backend/
│   ├── Dockerfile              # Production backend image
│   ├── Dockerfile.dev          # Development backend image
│   ├── .dockerignore           # Exclude files from build
│   ├── .env.example            # Environment template
│   └── src/                    # Source code
├── frontend/
│   ├── Dockerfile              # Production frontend image
│   ├── Dockerfile.dev          # Development frontend image
│   ├── .dockerignore           # Exclude files from build
│   ├── .env.example            # Environment template
│   ├── nginx.conf              # Nginx configuration
│   └── src/                    # Source code
├── docker-compose.yml          # Production compose file
├── docker-compose.dev.yml      # Development compose file
├── deploy.sh                   # Main deployment script
├── docker-build.sh             # Build helper script
├── docker-stop.sh              # Stop helper script
├── docker-logs.sh              # Logs helper script
└── DOCKER_DEPLOYMENT.md        # This file
```

### Port Reference
| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React application |
| Backend | 3001 | API server |

### Environment Variables Reference

#### Backend
| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | production | Environment mode |
| PORT | 3001 | Server port |
| CORS_ORIGIN | http://localhost:3000 | Allowed origin |
| LOG_LEVEL | info | Logging level |

#### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:3001/api | Backend API URL |
| VITE_APP_NAME | Market Screener Pro | App name |
| VITE_APP_VERSION | 1.0.0 | App version |

---

## Support

### Getting Help
- **Documentation:** This file
- **Issues:** GitHub Issues
- **Logs:** `./docker-logs.sh all prod`

### Useful Links
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Last Updated:** December 24, 2025
**Version:** 1.0
**Author:** Market Screener Pro Team
**License:** MIT
