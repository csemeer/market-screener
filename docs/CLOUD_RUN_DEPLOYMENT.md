# Google Cloud Run Deployment Guide

This guide provides step-by-step instructions for deploying Market Screener to Google Cloud Run, a fully managed serverless platform for containerized applications.

## Prerequisites

### Required Accounts
- **Google Cloud Platform account** (free tier available)
- **Domain name** (optional, but recommended for production)

### Local Requirements
- **Google Cloud SDK** (gcloud CLI) installed
- **Docker** installed and running
- **Git** for version control
- **Node.js 18+** for local testing

## Why Google Cloud Run?

### Advantages
- **Serverless**: No infrastructure management
- **Auto-scaling**: Scales to zero when idle (save costs)
- **Pay-per-use**: Only pay for actual usage
- **Fast deployment**: Deploy in minutes
- **HTTPS by default**: Automatic SSL certificates
- **Global CDN**: Low latency worldwide

### Costs
- **Free tier**: 2 million requests/month
- **Compute**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GB-second
- **Requests**: $0.40 per million requests

**Estimated monthly cost for trading app**: $5-20 (depending on usage)

## Step 1: Set Up Google Cloud Project

### Create a New Project

1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. **Project name**: `market-screener-prod`
4. **Project ID**: Auto-generated (e.g., `market-screener-prod-123456`)
5. Click "Create"

### Enable Required APIs

```bash
# Set project ID
export PROJECT_ID=your-project-id

# Set as active project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com
```

### Set Up Billing

1. Navigate to **Billing** in the sidebar
2. Link a billing account (required even for free tier)
3. Set up budget alerts (recommended):
   - Budget amount: $50/month
   - Alert threshold: 50%, 90%, 100%

## Step 2: Install and Configure gcloud CLI

### Install gcloud SDK

**macOS**:
```bash
brew install --cask google-cloud-sdk
```

**Linux**:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows**:
Download installer from https://cloud.google.com/sdk/docs/install

### Initialize gcloud

```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project $PROJECT_ID

# Set default region
gcloud config set run/region us-central1

# Configure Docker for Container Registry
gcloud auth configure-docker
```

## Step 3: Set Up Secret Manager

Store sensitive credentials securely in Secret Manager.

### Create Secrets

```bash
# Twilio credentials
echo -n "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | \
  gcloud secrets create twilio-account-sid --data-file=-

echo -n "your_auth_token" | \
  gcloud secrets create twilio-auth-token --data-file=-

echo -n "+14155552671" | \
  gcloud secrets create twilio-phone-number --data-file=-

# SendGrid API key
echo -n "SG.xxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy" | \
  gcloud secrets create sendgrid-api-key --data-file=-

# Telegram bot token
echo -n "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890" | \
  gcloud secrets create telegram-bot-token --data-file=-

# Add more secrets as needed
```

### Grant Access to Cloud Run

```bash
# Get the project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant Secret Manager access to Cloud Run service account
gcloud secrets add-iam-policy-binding twilio-account-sid \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Repeat for all secrets
```

## Step 4: Build and Push Docker Images

### Option A: Local Build and Push

```bash
# Navigate to project root
cd /path/to/market-screener

# Build backend image
docker build -t gcr.io/$PROJECT_ID/market-screener-backend:latest \
  -f backend/Dockerfile ./backend

# Build frontend image
docker build -t gcr.io/$PROJECT_ID/market-screener-frontend:latest \
  -f frontend/Dockerfile ./frontend

# Push images to Container Registry
docker push gcr.io/$PROJECT_ID/market-screener-backend:latest
docker push gcr.io/$PROJECT_ID/market-screener-frontend:latest
```

### Option B: Cloud Build (Recommended)

```bash
# Submit build to Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1

# Monitor build progress
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>
```

## Step 5: Deploy to Cloud Run

### Deploy Backend Service

```bash
gcloud run deploy market-screener-backend \
  --image=gcr.io/$PROJECT_ID/market-screener-backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s \
  --concurrency=80 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="TWILIO_ACCOUNT_SID=twilio-account-sid:latest,TWILIO_AUTH_TOKEN=twilio-auth-token:latest,SENDGRID_API_KEY=sendgrid-api-key:latest,TELEGRAM_BOT_TOKEN=telegram-bot-token:latest"
```

**Note the backend URL** from the output:
```
https://market-screener-backend-123456789-uc.a.run.app
```

### Deploy Frontend Service

```bash
# Update frontend to use backend URL
export BACKEND_URL="https://market-screener-backend-123456789-uc.a.run.app"

# Rebuild frontend with production API URL
docker build -t gcr.io/$PROJECT_ID/market-screener-frontend:latest \
  -f frontend/Dockerfile \
  --build-arg VITE_API_URL=$BACKEND_URL \
  ./frontend

# Push updated image
docker push gcr.io/$PROJECT_ID/market-screener-frontend:latest

# Deploy frontend
gcloud run deploy market-screener-frontend \
  --image=gcr.io/$PROJECT_ID/market-screener-frontend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --max-instances=10
```

**Note the frontend URL**:
```
https://market-screener-frontend-123456789-uc.a.run.app
```

## Step 6: Configure Custom Domain (Optional)

### Map Domain to Cloud Run

```bash
# Add domain mapping
gcloud run domain-mappings create \
  --service=market-screener-frontend \
  --domain=app.yourdomain.com \
  --region=us-central1
```

Follow the instructions to add DNS records to your domain provider.

**Example DNS Record**:
```
Type: CNAME
Name: app
Value: ghs.googlehosted.com
```

## Step 7: Set Up Database Persistence

Cloud Run containers are stateless. For production, you need persistent storage.

### Option A: Cloud SQL (Recommended for Production)

```bash
# Create Cloud SQL instance (PostgreSQL)
gcloud sql instances create market-screener-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create marketscreener \
  --instance=market-screener-db

# Connect Cloud Run to Cloud SQL
gcloud run services update market-screener-backend \
  --add-cloudsql-instances=$PROJECT_ID:us-central1:market-screener-db \
  --set-env-vars="DATABASE_URL=postgres://user:pass@/marketscreener?host=/cloudsql/$PROJECT_ID:us-central1:market-screener-db"
```

**Note**: Requires updating backend to use PostgreSQL instead of SQLite.

### Option B: Cloud Storage (Current Setup - SQLite)

```bash
# Create bucket for database backups
gsutil mb -l us-central1 gs://$PROJECT_ID-db-backups

# Create cron job for backups (Cloud Scheduler)
gcloud scheduler jobs create http db-backup-job \
  --schedule="0 2 * * *" \
  --uri="https://market-screener-backend-123456789-uc.a.run.app/api/admin/backup" \
  --http-method=POST \
  --time-zone="America/New_York"
```

**Limitation**: SQLite in container will reset on each deployment.

### Option C: Firestore (NoSQL Alternative)

Best for serverless architecture:
- No cold start delays
- Auto-scaling
- Pay per operation

Update backend to use Firestore instead of SQLite.

## Step 8: Configure Environment Variables

### Update Backend Environment Variables

```bash
gcloud run services update market-screener-backend \
  --update-env-vars="NODE_ENV=production,DATABASE_PATH=/app/data/market-screener.db,EMAIL_FROM=alerts@yourdomain.com,EMAIL_FROM_NAME=Market Screener Alerts" \
  --set-secrets="TWILIO_ACCOUNT_SID=twilio-account-sid:latest,TWILIO_AUTH_TOKEN=twilio-auth-token:latest,TWILIO_PHONE_NUMBER=twilio-phone-number:latest,TWILIO_WHATSAPP_NUMBER=twilio-whatsapp-number:latest,SENDGRID_API_KEY=sendgrid-api-key:latest,TELEGRAM_BOT_TOKEN=telegram-bot-token:latest"
```

### View Current Configuration

```bash
gcloud run services describe market-screener-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

## Step 9: Set Up Monitoring and Logging

### Enable Cloud Monitoring

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=market-screener-backend" \
  --limit=50 \
  --format=json

# Create log-based metric
gcloud logging metrics create error_count \
  --description="Count of errors" \
  --log-filter='resource.type="cloud_run_revision" AND severity="ERROR"'
```

### Create Alerts

1. Go to **Monitoring** → **Alerting**
2. Create alert policy:
   - **Condition**: Error rate > 10/minute
   - **Notification**: Email to your-email@example.com
   - **Documentation**: Link to runbook

### Set Up Uptime Checks

```bash
# Create uptime check
gcloud monitoring uptime-check-configs create market-screener-uptime \
  --display-name="Market Screener Health Check" \
  --resource-type=uptime-url \
  --monitored-resource="https://market-screener-backend-123456789-uc.a.run.app/api/health" \
  --period=300 \
  --timeout=10
```

## Step 10: Continuous Deployment with Cloud Build Triggers

### Connect GitHub Repository

1. Go to **Cloud Build** → **Triggers**
2. Click "Connect Repository"
3. Select GitHub and authenticate
4. Choose your `market-screener` repository

### Create Build Trigger

```bash
# Create trigger for main branch
gcloud builds triggers create github \
  --name="deploy-on-push" \
  --repo-name=market-screener \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1
```

Now, every push to `main` branch will automatically deploy!

## Step 11: Security Best Practices

### Enable Binary Authorization

```bash
# Enable Binary Authorization API
gcloud services enable binaryauthorization.googleapis.com

# Create policy
cat > /tmp/policy.yaml <<EOF
admissionWhitelistPatterns:
- namePattern: gcr.io/$PROJECT_ID/*
defaultAdmissionRule:
  requireAttestationsBy: []
  evaluationMode: ALWAYS_DENY
  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
globalPolicyEvaluationMode: ENABLE
EOF

gcloud container binauthz policy import /tmp/policy.yaml
```

### Enable VPC Connector (For Private Resources)

```bash
# Create VPC connector
gcloud compute networks vpc-access connectors create market-screener-connector \
  --network=default \
  --region=us-central1 \
  --range=10.8.0.0/28

# Update Cloud Run to use connector
gcloud run services update market-screener-backend \
  --vpc-connector=market-screener-connector \
  --vpc-egress=private-ranges-only
```

### Set Up IAM Roles

```bash
# Create custom service account
gcloud iam service-accounts create market-screener-sa \
  --display-name="Market Screener Service Account"

# Grant minimal permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:market-screener-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update Cloud Run to use custom SA
gcloud run services update market-screener-backend \
  --service-account=market-screener-sa@$PROJECT_ID.iam.gserviceaccount.com
```

## Cost Optimization

### 1. Set Minimum Instances Wisely
```bash
# Production (always warm):
--min-instances=1  # ~$10-15/month for 1 instance

# Development (cold start OK):
--min-instances=0  # Pay only for usage
```

### 2. Right-size Resources
```bash
# Monitor actual usage
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container/memory/utilizations"' \
  --format=json

# Adjust if consistently < 50%
--memory=256Mi  # From 512Mi
--cpu=0.5       # From 1
```

### 3. Set Up Budget Alerts
```bash
# Create budget
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Market Screener Budget" \
  --budget-amount=50USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

## Troubleshooting

### Deployment Failed

```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>

# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=50 \
  --format="table(timestamp, textPayload)"
```

### Service Not Responding

```bash
# Check service status
gcloud run services describe market-screener-backend \
  --region=us-central1

# Check container logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=market-screener-backend" \
  --limit=100
```

### Cold Start Latency

```bash
# Set minimum instances
gcloud run services update market-screener-backend \
  --min-instances=1

# Or optimize container startup time
# - Reduce image size
# - Use multi-stage builds
# - Pre-warm caches
```

### Database Connection Issues

```bash
# Verify Cloud SQL connection
gcloud run services describe market-screener-backend \
  --format="value(spec.template.metadata.annotations['run.googleapis.com/cloudsql-instances'])"

# Test connection
gcloud sql connect market-screener-db --user=postgres
```

## Useful Commands

```bash
# List all Cloud Run services
gcloud run services list

# Get service URL
gcloud run services describe market-screener-backend \
  --format="value(status.url)"

# View revision history
gcloud run revisions list \
  --service=market-screener-backend

# Rollback to previous revision
gcloud run services update-traffic market-screener-backend \
  --to-revisions=market-screener-backend-00002-xyz=100

# Delete service
gcloud run services delete market-screener-backend

# View all environment variables
gcloud run services describe market-screener-backend \
  --format="get(spec.template.spec.containers[0].env)"

# Update a single environment variable
gcloud run services update market-screener-backend \
  --update-env-vars="NEW_VAR=value"

# Stream live logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=market-screener-backend"
```

## Resources

- **Cloud Run Documentation**: https://cloud.google.com/run/docs
- **Pricing Calculator**: https://cloud.google.com/products/calculator
- **Best Practices**: https://cloud.google.com/run/docs/best-practices
- **Quotas and Limits**: https://cloud.google.com/run/quotas
- **Support**: https://cloud.google.com/support

## Next Steps

1. **Set up monitoring dashboards** in Cloud Monitoring
2. **Configure alerting** for errors and downtime
3. **Implement CI/CD** with Cloud Build triggers
4. **Set up staging environment** for testing
5. **Configure custom domain** for professional URLs
6. **Enable Cloud CDN** for frontend (optional)
7. **Implement database backups** (if using Cloud SQL)
8. **Set up load testing** to verify performance

---

**Questions or Issues?**
- Check Cloud Run logs for errors
- Review quota limits for your project
- Ensure all APIs are enabled
- Verify IAM permissions for service accounts
- Contact Google Cloud support for infrastructure issues
