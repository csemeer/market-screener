# 🚀 Google Cloud Platform Deployment Guide
## Market Screener Pro - Complete GCP Deployment

**Version:** 1.0
**Last Updated:** December 27, 2025
**Platform:** Google Cloud Run
**Status:** Production Ready ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start (5 Minutes)](#quick-start)
5. [Detailed Setup](#detailed-setup)
6. [Deployment Methods](#deployment-methods)
7. [Configuration](#configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Cost Optimization](#cost-optimization)
10. [Troubleshooting](#troubleshooting)
11. [CI/CD Integration](#cicd-integration)
12. [Production Best Practices](#production-best-practices)

---

## 🎯 Overview

This guide will help you deploy the Market Screener Pro application to Google Cloud Platform using **Cloud Run**, a fully managed serverless platform that automatically scales your containerized applications.

### Why Cloud Run?

✅ **Serverless** - No infrastructure management
✅ **Auto-scaling** - Scales from 0 to thousands of instances
✅ **Cost-effective** - Pay only for what you use
✅ **Fast deployment** - Deploy in minutes
✅ **HTTPS included** - Automatic SSL certificates
✅ **Global** - Deploy to multiple regions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USERS / BROWSERS                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Cloud Load Balancer (HTTPS)             │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  Frontend Cloud Run      │  │  Backend Cloud Run       │
│  (React/Vite)            │──│  (Node.js/Express)       │
│  • Port 80               │  │  • Port 3001             │
│  • Memory: 256Mi         │  │  • Memory: 512Mi         │
│  • Auto-scale 0-10       │  │  • Auto-scale 0-10       │
└──────────────────────────┘  └──────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Container Registry (GCR)                │
│  • market-screener-frontend:latest                          │
│  • market-screener-backend:latest                           │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Google Cloud Build                         │
│  • Automated builds from Git                                │
│  • CI/CD pipeline                                           │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Frontend Service** (Cloud Run)
   - Serves React SPA
   - Nginx server
   - 256Mi memory
   - Connects to backend API

2. **Backend Service** (Cloud Run)
   - Node.js/Express API
   - 512Mi memory
   - Logging service
   - Stock screening logic

3. **Container Registry**
   - Stores Docker images
   - Versioned releases

4. **Cloud Build** (Optional)
   - Automated deployments
   - CI/CD pipeline

---

## ✅ Prerequisites

### 1. Google Cloud Account
- Create account: https://cloud.google.com
- Free tier available ($300 credit for new users)
- Billing account set up

### 2. Required Software (Local Machine)

```bash
# Install Google Cloud SDK
# For macOS:
brew install google-cloud-sdk

# For Linux:
curl https://sdk.cloud.google.com | bash

# For Windows:
# Download from: https://cloud.google.com/sdk/docs/install

# Verify installation
gcloud --version
```

```bash
# Install Docker (if building locally)
# macOS/Windows: Download Docker Desktop
# Linux:
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Verify installation
docker --version
```

### 3. Google Cloud Project Setup

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create market-screener-prod --name="Market Screener Pro"

# Set the project as default
gcloud config set project market-screener-prod

# Enable billing (required for Cloud Run)
# Visit: https://console.cloud.google.com/billing
```

---

## ⚡ Quick Start (5 Minutes)

### Option 1: Automated Deployment Script

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd market-screener

# 2. Make deployment script executable
chmod +x deploy-gcp.sh

# 3. Run deployment
./deploy-gcp.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Set up your GCP project
- ✅ Enable required APIs
- ✅ Build Docker images
- ✅ Deploy both frontend and backend
- ✅ Provide you with URLs

**Total time:** ~5-7 minutes

---

### Option 2: Cloud Build Deployment (Recommended)

```bash
# 1. Submit to Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# 2. Get service URLs
gcloud run services list
```

**Total time:** ~8-10 minutes

---

## 📖 Detailed Setup

### Step 1: Enable Required APIs

```bash
# Enable Cloud Run, Container Registry, and Cloud Build
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com
```

### Step 2: Configure Docker Authentication

```bash
# Configure Docker to use gcloud for authentication
gcloud auth configure-docker
```

### Step 3: Build Docker Images

#### Backend Image

```bash
# Build backend
docker build \
  -t gcr.io/YOUR_PROJECT_ID/market-screener-backend:latest \
  -f backend/Dockerfile \
  ./backend

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/market-screener-backend:latest
```

#### Frontend Image

```bash
# Build frontend with backend URL
docker build \
  -t gcr.io/YOUR_PROJECT_ID/market-screener-frontend:latest \
  -f frontend/Dockerfile \
  --build-arg VITE_API_URL=https://YOUR-BACKEND-URL/api \
  ./frontend

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/market-screener-frontend:latest
```

### Step 4: Deploy to Cloud Run

#### Deploy Backend

```bash
gcloud run deploy market-screener-backend \
  --image=gcr.io/YOUR_PROJECT_ID/market-screener-backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --port=3001 \
  --set-env-vars="NODE_ENV=production,PORT=3001"
```

**Get backend URL:**
```bash
gcloud run services describe market-screener-backend \
  --region=us-central1 \
  --format='value(status.url)'
```

#### Deploy Frontend

```bash
# Rebuild frontend with actual backend URL
BACKEND_URL=$(gcloud run services describe market-screener-backend \
  --region=us-central1 \
  --format='value(status.url)')

docker build \
  -t gcr.io/YOUR_PROJECT_ID/market-screener-frontend:latest \
  -f frontend/Dockerfile \
  --build-arg VITE_API_URL="${BACKEND_URL}/api" \
  ./frontend

docker push gcr.io/YOUR_PROJECT_ID/market-screener-frontend:latest

# Deploy frontend
gcloud run deploy market-screener-frontend \
  --image=gcr.io/YOUR_PROJECT_ID/market-screener-frontend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --max-instances=10 \
  --port=3000
```

**Get frontend URL:**
```bash
gcloud run services describe market-screener-frontend \
  --region=us-central1 \
  --format='value(status.url)'
```

---

## 🎛️ Configuration

### Environment Variables

#### Backend Configuration

Edit environment variables via Cloud Console or CLI:

```bash
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --update-env-vars="NODE_ENV=production,PORT=3001,LOG_LEVEL=info"
```

Common environment variables:
```bash
NODE_ENV=production          # Environment mode
PORT=3001                    # Server port
LOG_LEVEL=info              # Logging level
MAX_LOGS=1000               # Logger circular buffer size
CORS_ORIGIN=*               # CORS origin (set to frontend URL in production)
```

#### Frontend Configuration

Frontend uses build-time environment variables:

```dockerfile
# During build
ARG VITE_API_URL=https://your-backend-url/api
```

To update frontend API URL, rebuild and redeploy:

```bash
docker build \
  -t gcr.io/YOUR_PROJECT_ID/market-screener-frontend:latest \
  -f frontend/Dockerfile \
  --build-arg VITE_API_URL="https://new-backend-url/api" \
  ./frontend

docker push gcr.io/YOUR_PROJECT_ID/market-screener-frontend:latest

gcloud run deploy market-screener-frontend \
  --image=gcr.io/YOUR_PROJECT_ID/market-screener-frontend:latest \
  --region=us-central1
```

### Resource Configuration

#### Adjust Memory and CPU

```bash
# Backend - increase memory
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=2

# Frontend - adjust instances
gcloud run services update market-screener-frontend \
  --region=us-central1 \
  --min-instances=1 \
  --max-instances=20
```

#### Scaling Configuration

```bash
# Set autoscaling parameters
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80
```

---

## 📊 Monitoring & Logging

### View Logs

#### Cloud Console
1. Go to: https://console.cloud.google.com/run
2. Click on service name
3. Click "LOGS" tab

#### Command Line

```bash
# View backend logs (real-time)
gcloud run services logs tail market-screener-backend \
  --region=us-central1

# View frontend logs
gcloud run services logs tail market-screener-frontend \
  --region=us-central1

# View specific time range
gcloud run services logs read market-screener-backend \
  --region=us-central1 \
  --limit=50 \
  --format=json
```

### Monitoring Dashboard

Access Cloud Monitoring:
```
https://console.cloud.google.com/monitoring
```

**Key Metrics to Monitor:**
- Request count
- Request latency
- Error rate
- Container CPU utilization
- Container memory utilization
- Billable container instance time

### Set Up Alerts

```bash
# Example: Alert on high error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s
```

---

## 💰 Cost Optimization

### Cloud Run Pricing (as of 2025)

**Free Tier (per month):**
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

**Paid Tier:**
- Requests: $0.40 per million
- Memory: $0.0000025 per GB-second
- CPU: $0.00001 per vCPU-second
- Networking: $0.12 per GB

### Cost Optimization Strategies

#### 1. Use Minimum Instances Wisely

```bash
# For production with steady traffic
--min-instances=1  # Eliminates cold starts, costs ~$10/month

# For development/testing
--min-instances=0  # Only pay when used
```

#### 2. Right-Size Resources

```bash
# Backend (handles more load)
--memory=512Mi --cpu=1

# Frontend (static files)
--memory=256Mi --cpu=1
```

#### 3. Optimize Container Images

- Use multi-stage builds (already implemented)
- Minimize image size
- Remove unnecessary dependencies

#### 4. Set Concurrency Appropriately

```bash
# Each instance handles multiple requests
--concurrency=80  # Fewer instances needed
```

#### 5. Use Cloud CDN (Optional)

```bash
# Enable CDN for frontend static assets
gcloud compute backend-buckets create frontend-cdn \
  --gcs-bucket-name=YOUR_BUCKET
```

### Estimated Monthly Costs

**Low Traffic** (1,000 requests/day):
- Frontend: ~$0
- Backend: ~$0-1
- **Total: ~$0-1/month** (within free tier)

**Medium Traffic** (100,000 requests/day):
- Frontend: ~$5-10
- Backend: ~$15-25
- **Total: ~$20-35/month**

**High Traffic** (1M requests/day):
- Frontend: ~$40-60
- Backend: ~$150-200
- **Total: ~$190-260/month**

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Permission Denied Errors

```bash
# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:your-email@gmail.com" \
  --role="roles/run.admin"
```

#### 2. Container Fails to Start

```bash
# Check logs for errors
gcloud run services logs read market-screener-backend \
  --region=us-central1 \
  --limit=100

# Common fixes:
# - Verify PORT environment variable
# - Check Dockerfile EXPOSE port matches
# - Ensure application binds to 0.0.0.0, not localhost
```

#### 3. Frontend Can't Connect to Backend

**Issue:** CORS errors or network errors

**Solution:**
```bash
# Update backend CORS configuration
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --update-env-vars="CORS_ORIGIN=https://your-frontend-url"

# Verify backend URL in frontend
# Rebuild frontend with correct VITE_API_URL
```

#### 4. High Response Times

```bash
# Increase memory
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --memory=1Gi

# Increase CPU
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --cpu=2

# Set minimum instances to avoid cold starts
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --min-instances=1
```

#### 5. Build Failures

```bash
# Check Cloud Build logs
gcloud builds list --limit=5

# View specific build log
gcloud builds log BUILD_ID

# Common fixes:
# - Increase build timeout in cloudbuild.yaml
# - Check Dockerfile syntax
# - Verify build context paths
```

### Health Checks

Test endpoints:

```bash
# Backend health
curl https://YOUR-BACKEND-URL/api/health

# Backend logs
curl https://YOUR-BACKEND-URL/api/logs

# Frontend
curl https://YOUR-FRONTEND-URL
```

---

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy-gcp.yml`:

```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Deploy to Cloud Run
        run: |
          gcloud builds submit \
            --config=cloudbuild.yaml \
            --substitutions=_REGION=us-central1
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
deploy:
  image: google/cloud-sdk:alpine
  stage: deploy
  script:
    - echo $GCP_SA_KEY | base64 -d > key.json
    - gcloud auth activate-service-account --key-file key.json
    - gcloud config set project $GCP_PROJECT_ID
    - gcloud builds submit --config=cloudbuild.yaml
  only:
    - main
```

### Automated Deployments

1. **Create Service Account:**

```bash
gcloud iam service-accounts create cloud-run-deployer \
  --display-name="Cloud Run Deployer"
```

2. **Grant Permissions:**

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:cloud-run-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:cloud-run-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

3. **Create Key:**

```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=cloud-run-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

4. **Add to CI/CD secrets:**
   - GitHub: Add `GCP_SA_KEY` secret
   - GitLab: Add `GCP_SA_KEY` variable

---

## 🛡️ Production Best Practices

### 1. Security

```bash
# ✅ Enable Container Analysis
gcloud services enable containeranalysis.googleapis.com

# ✅ Use Secret Manager for sensitive data
gcloud secrets create api-key --data-file=api-key.txt

# ✅ Restrict access
gcloud run services remove-iam-policy-binding market-screener-backend \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"

# ✅ Enable VPC connector for database access
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --vpc-connector=CONNECTOR_NAME
```

### 2. Custom Domain

```bash
# Map custom domain
gcloud beta run domain-mappings create \
  --service=market-screener-frontend \
  --domain=www.yourapp.com \
  --region=us-central1

# Follow DNS instructions to verify domain
```

### 3. HTTPS and SSL

Cloud Run automatically provides:
- ✅ Free SSL certificates
- ✅ Automatic renewal
- ✅ HTTPS enforced
- ✅ HTTP/2 support

### 4. Rate Limiting

Implement in backend:

```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### 5. Caching

```bash
# Add Redis cache (Memorystore)
gcloud redis instances create market-screener-cache \
  --size=1 \
  --region=us-central1
```

### 6. Database (Optional)

```bash
# Create Cloud SQL instance
gcloud sql instances create market-screener-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Google Cloud account created
- [ ] Billing enabled
- [ ] Project created
- [ ] gcloud CLI installed and configured
- [ ] Docker installed (for local builds)
- [ ] Repository cloned

### Deployment

- [ ] APIs enabled
- [ ] Docker images built
- [ ] Images pushed to GCR
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Cloud Run
- [ ] Services accessible via URLs
- [ ] CORS configured correctly

### Post-Deployment

- [ ] Health checks passing
- [ ] Logs reviewed
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Custom domain mapped (optional)
- [ ] CI/CD pipeline configured (optional)
- [ ] Documentation updated with URLs

---

## 📞 Support & Resources

### Official Documentation

- **Cloud Run:** https://cloud.google.com/run/docs
- **Container Registry:** https://cloud.google.com/container-registry/docs
- **Cloud Build:** https://cloud.google.com/build/docs

### Community

- **Stack Overflow:** https://stackoverflow.com/questions/tagged/google-cloud-run
- **Google Cloud Community:** https://www.googlecloudcommunity.com

### Useful Commands Reference

```bash
# List all services
gcloud run services list

# Describe service
gcloud run services describe SERVICE_NAME --region=REGION

# View logs
gcloud run services logs tail SERVICE_NAME --region=REGION

# Update service
gcloud run services update SERVICE_NAME --region=REGION [FLAGS]

# Delete service
gcloud run services delete SERVICE_NAME --region=REGION

# List revisions
gcloud run revisions list --service=SERVICE_NAME --region=REGION

# Traffic splitting (canary deployment)
gcloud run services update-traffic SERVICE_NAME \
  --to-revisions=REVISION1=50,REVISION2=50 \
  --region=REGION
```

---

## 🎉 Success!

Your Market Screener Pro application is now running on Google Cloud Platform!

**What's Next?**

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Configure custom domain
4. ✅ Set up CI/CD pipeline
5. ✅ Optimize costs
6. ✅ Plan for scaling

**Need Help?**

- Review logs: `gcloud run services logs tail SERVICE_NAME`
- Check this guide's [Troubleshooting](#troubleshooting) section
- Consult official Cloud Run docs

---

**Deployed with ❤️ to Google Cloud Run**
