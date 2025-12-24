# Quick Start Guide - Docker Deployment
## Market Screener Pro

**🚀 Deploy in 3 commands | ⏱️ 5 minutes | 🐳 Docker required**

---

## ✅ Prerequisites Check

```bash
# Check if Docker is installed
docker --version
# Should show: Docker version 20.10+

# Check if Docker Compose is installed
docker compose version
# Should show: Docker Compose version 2.0+
```

**Don't have Docker?**
- **Ubuntu/Debian:** `curl -fsSL https://get.docker.com | sh`
- **macOS:** `brew install docker docker-compose`
- **Windows:** Download from https://www.docker.com/products/docker-desktop

---

## 🚀 Quick Deploy (Production)

### Step 1: Stop Current Development Servers
```bash
# Press Ctrl+C in terminal running npm run dev
# Or kill the process
pkill -f "npm run dev"
pkill -f "nodemon"
pkill -f "vite"
```

### Step 2: Deploy with Docker
```bash
# From project root directory
./deploy.sh prod
```

### Step 3: Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

**That's it!** Your application is now running in Docker containers.

---

## 🛠️ Development Mode (with Hot-Reload)

```bash
./deploy.sh dev
```

**Features:**
- ✅ Code changes auto-reload
- ✅ Full debugging support
- ✅ Fast iteration

---

## 📋 Quick Commands

### View Logs
```bash
# All services
./docker-logs.sh all prod

# Backend only
./docker-logs.sh backend prod

# Frontend only
./docker-logs.sh frontend prod
```

### Stop Containers
```bash
./docker-stop.sh prod
```

### Restart Application
```bash
./deploy.sh prod
```

### Check Status
```bash
docker compose ps
```

---

## 🔍 Verification

### 1. Check Container Status
```bash
docker compose ps
```

**Expected output:**
```
NAME                           STATUS
market-screener-backend        Up (healthy)
market-screener-frontend       Up (healthy)
```

### 2. Test Backend API
```bash
curl http://localhost:3001/api/health
```

**Expected response:**
```json
{"status":"healthy","timestamp":"2025-12-24T..."}
```

### 3. Test Frontend
```bash
curl http://localhost:3000/health
```

**Expected response:**
```
healthy
```

### 4. Open in Browser
Visit http://localhost:3000 and verify:
- ✅ Dashboard loads with stats cards
- ✅ Quick Action buttons work
- ✅ Navigation functional
- ✅ No console errors

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using ports
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process
kill -9 <PID>

# Try deployment again
./deploy.sh prod
```

### Containers Not Healthy
```bash
# View logs for errors
docker compose logs backend
docker compose logs frontend

# Rebuild without cache
docker compose build --no-cache
docker compose up -d
```

### Reset Everything
```bash
# Nuclear option - complete reset
docker compose down -v
docker system prune -af

# Redeploy
./deploy.sh prod
```

---

## 📚 Need More Help?

**Comprehensive Documentation:**
- Full deployment guide: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- Testing checklist: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
- End-to-end testing: [END_TO_END_TESTING_REPORT.md](./END_TO_END_TESTING_REPORT.md)

**Common Tasks:**
```bash
# View all logs
docker compose logs -f

# Access backend shell
docker compose exec backend sh

# Rebuild specific service
docker compose build backend
docker compose up -d backend

# Export logs to file
docker compose logs > logs.txt
```

---

## 🎯 What's Deployed?

### Backend Container
- **Image:** Node.js 18 Alpine (~150MB)
- **Features:**
  - Health checks
  - Auto-restart on failure
  - Production optimized
  - Non-root user
- **Port:** 3001

### Frontend Container
- **Image:** Nginx Alpine (~25MB)
- **Features:**
  - SPA routing configured
  - Security headers
  - Gzip compression
  - Asset caching
- **Port:** 3000

### Total Size
- **Combined:** ~175MB
- **Startup Time:** 10-15 seconds
- **Memory Usage:** ~500MB

---

## 🔐 Security Features

✅ Non-root users in containers
✅ Minimal Alpine base images
✅ Security headers (X-Frame-Options, CSP, XSS)
✅ Health checks for auto-recovery
✅ Log rotation (prevents disk exhaustion)
✅ Production dependencies only

---

## 🚀 Production Deployment Checklist

Before deploying to production server:

- [ ] Update `VITE_API_URL` in frontend/.env with production domain
- [ ] Configure SSL/HTTPS (use Let's Encrypt)
- [ ] Set up domain DNS records
- [ ] Configure firewall (allow ports 80, 443)
- [ ] Set up monitoring (Docker stats, logs)
- [ ] Configure automated backups
- [ ] Set up CI/CD pipeline
- [ ] Test health checks
- [ ] Load testing

---

## 📊 Monitoring

### Real-time Stats
```bash
# Resource usage
docker stats

# Container health
docker compose ps
```

### Export Metrics
```bash
# Container stats to file
docker stats --no-stream > stats.txt

# Logs to file
docker compose logs > deployment-logs.txt
```

---

## 🎉 Success!

Your Market Screener Pro is now running in production-ready Docker containers with:

- ✅ Auto-restart on failure
- ✅ Health monitoring
- ✅ Log management
- ✅ Security hardening
- ✅ Performance optimization

**Access your app:** http://localhost:3000

**Enjoy screening! 📈**

---

**Last Updated:** December 24, 2025
**Version:** 1.0
