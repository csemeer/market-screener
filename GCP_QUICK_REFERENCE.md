# 🚀 Google Cloud Deployment - Quick Reference

## ⚡ Quick Deploy (One Command)

```bash
./deploy-gcp.sh
```

---

## 📦 Essential Commands

### Initial Setup

```bash
# 1. Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# 2. Login
gcloud auth login

# 3. Set project
gcloud config set project YOUR_PROJECT_ID

# 4. Enable APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com
```

### Deploy with Cloud Build (Recommended)

```bash
# Deploy everything automatically
gcloud builds submit --config=cloudbuild.yaml

# With specific region
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1
```

### Manual Deployment

```bash
# 1. Configure Docker
gcloud auth configure-docker

# 2. Build & push backend
docker build -t gcr.io/PROJECT_ID/market-screener-backend:latest -f backend/Dockerfile ./backend
docker push gcr.io/PROJECT_ID/market-screener-backend:latest

# 3. Deploy backend
gcloud run deploy market-screener-backend \
  --image=gcr.io/PROJECT_ID/market-screener-backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --port=3001

# 4. Get backend URL
BACKEND_URL=$(gcloud run services describe market-screener-backend \
  --region=us-central1 \
  --format='value(status.url)')

# 5. Build & push frontend
docker build \
  -t gcr.io/PROJECT_ID/market-screener-frontend:latest \
  -f frontend/Dockerfile \
  --build-arg VITE_API_URL="${BACKEND_URL}/api" \
  ./frontend
docker push gcr.io/PROJECT_ID/market-screener-frontend:latest

# 6. Deploy frontend
gcloud run deploy market-screener-frontend \
  --image=gcr.io/PROJECT_ID/market-screener-frontend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --port=80
```

---

## 🔄 Update/Redeploy

### Update Backend Only

```bash
./deploy-gcp.sh backend
```

### Update Frontend Only

```bash
./deploy-gcp.sh frontend
```

### Update Both

```bash
./deploy-gcp.sh
```

---

## 📊 Monitoring

### View Logs

```bash
# Real-time backend logs
gcloud run services logs tail market-screener-backend --region=us-central1

# Real-time frontend logs
gcloud run services logs tail market-screener-frontend --region=us-central1

# Last 100 lines
gcloud run services logs read market-screener-backend --limit=100
```

### List Services

```bash
# All services
gcloud run services list

# Specific service details
gcloud run services describe market-screener-backend --region=us-central1
```

### Get URLs

```bash
# Backend URL
gcloud run services describe market-screener-backend \
  --region=us-central1 \
  --format='value(status.url)'

# Frontend URL
gcloud run services describe market-screener-frontend \
  --region=us-central1 \
  --format='value(status.url)'
```

---

## ⚙️ Configuration

### Update Environment Variables

```bash
# Backend
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --update-env-vars="NODE_ENV=production,LOG_LEVEL=debug"

# View current env vars
gcloud run services describe market-screener-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

### Scale Services

```bash
# Set min/max instances
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --min-instances=1 \
  --max-instances=20

# Set concurrency
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --concurrency=80
```

### Adjust Resources

```bash
# Increase memory
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --memory=1Gi

# Increase CPU
gcloud run services update market-screener-backend \
  --region=us-central1 \
  --cpu=2
```

---

## 🗑️ Cleanup

### Delete Services

```bash
# Delete backend
gcloud run services delete market-screener-backend --region=us-central1

# Delete frontend
gcloud run services delete market-screener-frontend --region=us-central1

# Delete both
gcloud run services delete market-screener-backend market-screener-frontend --region=us-central1
```

### Delete Images

```bash
# List images
gcloud container images list --repository=gcr.io/PROJECT_ID

# Delete specific image
gcloud container images delete gcr.io/PROJECT_ID/market-screener-backend:latest

# Delete all versions
gcloud container images delete gcr.io/PROJECT_ID/market-screener-backend --quiet
```

---

## 🔐 Security

### Remove Public Access

```bash
# Require authentication
gcloud run services remove-iam-policy-binding market-screener-backend \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### Add Specific User Access

```bash
gcloud run services add-iam-policy-binding market-screener-backend \
  --region=us-central1 \
  --member="user:email@example.com" \
  --role="roles/run.invoker"
```

---

## 🌍 Custom Domain

```bash
# Map domain
gcloud beta run domain-mappings create \
  --service=market-screener-frontend \
  --domain=www.yourapp.com \
  --region=us-central1

# List domains
gcloud beta run domain-mappings list

# Delete mapping
gcloud beta run domain-mappings delete --domain=www.yourapp.com
```

---

## 🐛 Troubleshooting

### Check Build Status

```bash
# List recent builds
gcloud builds list --limit=5

# View build log
gcloud builds log BUILD_ID

# Stream build in real-time
gcloud builds log --stream BUILD_ID
```

### Test Endpoints

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe market-screener-backend \
  --region=us-central1 \
  --format='value(status.url)')

# Test health endpoint
curl $BACKEND_URL/api/health

# Test with verbose output
curl -v $BACKEND_URL/api/health
```

### Common Fixes

```bash
# Fix: Container fails to start
# Check logs for port binding issues
gcloud run services logs read market-screener-backend --limit=50

# Fix: CORS errors
# Update backend CORS config
gcloud run services update market-screener-backend \
  --update-env-vars="CORS_ORIGIN=https://your-frontend-url"

# Fix: Cold start issues
# Set minimum instances
gcloud run services update market-screener-backend \
  --min-instances=1
```

---

## 💰 Cost Management

### View Current Costs

```bash
# Open billing dashboard
open https://console.cloud.google.com/billing
```

### Set Budget Alerts

```bash
# Create budget
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Monthly Budget" \
  --budget-amount=100USD
```

### Optimize Costs

```bash
# Scale to zero when not in use
gcloud run services update market-screener-backend \
  --min-instances=0 \
  --max-instances=5

# Reduce memory
gcloud run services update market-screener-backend \
  --memory=256Mi
```

---

## 📋 Regions

### Common Regions

- `us-central1` (Iowa) - Default, low latency for US
- `us-east1` (South Carolina) - US East Coast
- `us-west1` (Oregon) - US West Coast
- `europe-west1` (Belgium) - Europe
- `asia-southeast1` (Singapore) - Asia Pacific

### Deploy to Multiple Regions

```bash
# Deploy to US
gcloud run deploy market-screener-backend \
  --image=gcr.io/PROJECT_ID/market-screener-backend:latest \
  --region=us-central1

# Deploy to Europe
gcloud run deploy market-screener-backend \
  --image=gcr.io/PROJECT_ID/market-screener-backend:latest \
  --region=europe-west1
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
- name: Deploy to Cloud Run
  run: |
    gcloud builds submit --config=cloudbuild.yaml
```

### GitLab CI

```yaml
# .gitlab-ci.yml
deploy:
  script:
    - gcloud builds submit --config=cloudbuild.yaml
```

---

## 📱 Mobile/Access URLs

### Access Your App

```bash
# Get URLs
echo "Frontend: $(gcloud run services describe market-screener-frontend --region=us-central1 --format='value(status.url)')"
echo "Backend: $(gcloud run services describe market-screener-backend --region=us-central1 --format='value(status.url)')"
```

### QR Code for Mobile

```bash
# Install qrencode
brew install qrencode  # macOS
sudo apt-get install qrencode  # Linux

# Generate QR code
FRONTEND_URL=$(gcloud run services describe market-screener-frontend --region=us-central1 --format='value(status.url)')
echo $FRONTEND_URL | qrencode -t ANSI
```

---

## 📞 Help & Resources

### Get Help

```bash
# gcloud help
gcloud run --help
gcloud run deploy --help

# Service-specific help
gcloud run services --help
```

### Useful Links

- **Console:** https://console.cloud.google.com/run
- **Docs:** https://cloud.google.com/run/docs
- **Pricing:** https://cloud.google.com/run/pricing
- **Status:** https://status.cloud.google.com

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] gcloud CLI installed
- [ ] Authenticated (`gcloud auth login`)
- [ ] Project set (`gcloud config set project PROJECT_ID`)
- [ ] APIs enabled
- [ ] Docker authenticated

### Deployment
- [ ] Images built and pushed
- [ ] Backend deployed
- [ ] Frontend deployed with correct API URL
- [ ] Services publicly accessible
- [ ] Health checks passing

### Post-Deployment
- [ ] URLs documented
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Costs reviewed
- [ ] Team notified

---

**Quick Help:**
- Deployment issues? Check logs: `gcloud run services logs tail SERVICE_NAME`
- Need to rollback? Deploy previous image tag
- Cost concerns? Set `--min-instances=0 --max-instances=5`
