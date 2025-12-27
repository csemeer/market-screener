#!/bin/bash

##############################################################################
# Google Cloud Platform Deployment Script
# Market Screener Pro - Complete GCP Cloud Run Deployment
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
SERVICE_BACKEND="market-screener-backend"
SERVICE_FRONTEND="market-screener-frontend"

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

##############################################################################
# Check Prerequisites
##############################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI not found. Please install Google Cloud SDK."
        echo "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "gcloud CLI found"

    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker found"

    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        print_warning "Not authenticated with gcloud. Please run:"
        echo "  gcloud auth login"
        exit 1
    fi
    print_success "gcloud authenticated"
}

##############################################################################
# Setup Google Cloud Project
##############################################################################

setup_project() {
    print_header "Google Cloud Project Setup"

    # Get or set project ID
    if [ -z "$PROJECT_ID" ]; then
        echo "Enter your Google Cloud Project ID:"
        read -r PROJECT_ID
    fi

    print_info "Setting project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"

    # Get or set region
    echo ""
    echo "Enter your preferred region (default: us-central1):"
    echo "Common regions: us-central1, us-east1, europe-west1, asia-southeast1"
    read -r input_region
    if [ -n "$input_region" ]; then
        REGION="$input_region"
    fi
    print_info "Using region: $REGION"
}

##############################################################################
# Enable Required APIs
##############################################################################

enable_apis() {
    print_header "Enabling Required Google Cloud APIs"

    print_info "This may take a few minutes..."

    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        artifactregistry.googleapis.com \
        --project="$PROJECT_ID"

    print_success "All required APIs enabled"
}

##############################################################################
# Build and Push Docker Images
##############################################################################

build_and_push() {
    print_header "Building and Pushing Docker Images"

    # Configure Docker to use gcloud as credential helper
    print_info "Configuring Docker authentication..."
    gcloud auth configure-docker

    # Build Backend
    print_info "Building backend image..."
    docker build \
        -t "gcr.io/$PROJECT_ID/$SERVICE_BACKEND:latest" \
        -f backend/Dockerfile \
        ./backend

    print_success "Backend image built"

    print_info "Pushing backend image to GCR..."
    docker push "gcr.io/$PROJECT_ID/$SERVICE_BACKEND:latest"
    print_success "Backend image pushed"

    # Get backend URL (if already deployed, otherwise use placeholder)
    BACKEND_URL="https://$SERVICE_BACKEND-$(echo $REGION | tr '[:upper:]' '[:lower:]' | tr '-' '').a.run.app"

    # Build Frontend with backend URL
    print_info "Building frontend image..."
    docker build \
        -t "gcr.io/$PROJECT_ID/$SERVICE_FRONTEND:latest" \
        -f frontend/Dockerfile \
        --build-arg VITE_API_URL="$BACKEND_URL/api" \
        ./frontend

    print_success "Frontend image built"

    print_info "Pushing frontend image to GCR..."
    docker push "gcr.io/$PROJECT_ID/$SERVICE_FRONTEND:latest"
    print_success "Frontend image pushed"
}

##############################################################################
# Deploy to Cloud Run
##############################################################################

deploy_backend() {
    print_header "Deploying Backend to Cloud Run"

    gcloud run deploy "$SERVICE_BACKEND" \
        --image="gcr.io/$PROJECT_ID/$SERVICE_BACKEND:latest" \
        --region="$REGION" \
        --platform=managed \
        --allow-unauthenticated \
        --memory=512Mi \
        --cpu=1 \
        --max-instances=10 \
        --port=3001 \
        --set-env-vars="NODE_ENV=production,PORT=3001" \
        --project="$PROJECT_ID"

    # Get backend URL
    BACKEND_URL=$(gcloud run services describe "$SERVICE_BACKEND" \
        --region="$REGION" \
        --format='value(status.url)' \
        --project="$PROJECT_ID")

    print_success "Backend deployed successfully!"
    print_info "Backend URL: $BACKEND_URL"
}

deploy_frontend() {
    print_header "Deploying Frontend to Cloud Run"

    # Rebuild frontend with actual backend URL
    print_info "Rebuilding frontend with backend URL: $BACKEND_URL/api"

    docker build \
        -t "gcr.io/$PROJECT_ID/$SERVICE_FRONTEND:latest" \
        -f frontend/Dockerfile \
        --build-arg VITE_API_URL="$BACKEND_URL/api" \
        ./frontend

    docker push "gcr.io/$PROJECT_ID/$SERVICE_FRONTEND:latest"

    gcloud run deploy "$SERVICE_FRONTEND" \
        --image="gcr.io/$PROJECT_ID/$SERVICE_FRONTEND:latest" \
        --region="$REGION" \
        --platform=managed \
        --allow-unauthenticated \
        --memory=256Mi \
        --cpu=1 \
        --max-instances=10 \
        --port=3000 \
        --project="$PROJECT_ID"

    # Get frontend URL
    FRONTEND_URL=$(gcloud run services describe "$SERVICE_FRONTEND" \
        --region="$REGION" \
        --format='value(status.url)' \
        --project="$PROJECT_ID")

    print_success "Frontend deployed successfully!"
    print_info "Frontend URL: $FRONTEND_URL"
}

##############################################################################
# Deploy using Cloud Build (Alternative Method)
##############################################################################

deploy_with_cloud_build() {
    print_header "Deploying with Cloud Build"

    print_info "Submitting build to Cloud Build..."

    gcloud builds submit \
        --config=cloudbuild.yaml \
        --substitutions=_REGION="$REGION" \
        --project="$PROJECT_ID"

    print_success "Cloud Build deployment completed!"

    # Get service URLs
    BACKEND_URL=$(gcloud run services describe "$SERVICE_BACKEND" \
        --region="$REGION" \
        --format='value(status.url)' \
        --project="$PROJECT_ID")

    FRONTEND_URL=$(gcloud run services describe "$SERVICE_FRONTEND" \
        --region="$REGION" \
        --format='value(status.url)' \
        --project="$PROJECT_ID")

    print_info "Backend URL: $BACKEND_URL"
    print_info "Frontend URL: $FRONTEND_URL"
}

##############################################################################
# Display Deployment Summary
##############################################################################

display_summary() {
    print_header "Deployment Summary"

    echo ""
    echo -e "${GREEN}🎉 Deployment Successful!${NC}"
    echo ""
    echo -e "${BLUE}Application URLs:${NC}"
    echo -e "  Frontend: ${GREEN}$FRONTEND_URL${NC}"
    echo -e "  Backend:  ${GREEN}$BACKEND_URL${NC}"
    echo ""
    echo -e "${BLUE}Service Details:${NC}"
    echo -e "  Project:  $PROJECT_ID"
    echo -e "  Region:   $REGION"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Open your application: $FRONTEND_URL"
    echo "  2. View logs: gcloud run services logs tail $SERVICE_FRONTEND --project=$PROJECT_ID"
    echo "  3. Monitor services: https://console.cloud.google.com/run?project=$PROJECT_ID"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  # View backend logs"
    echo "  gcloud run services logs tail $SERVICE_BACKEND --region=$REGION --project=$PROJECT_ID"
    echo ""
    echo "  # View frontend logs"
    echo "  gcloud run services logs tail $SERVICE_FRONTEND --region=$REGION --project=$PROJECT_ID"
    echo ""
    echo "  # Update backend"
    echo "  ./deploy-gcp.sh backend"
    echo ""
    echo "  # Update frontend"
    echo "  ./deploy-gcp.sh frontend"
    echo ""
}

##############################################################################
# Deploy Specific Service (for updates)
##############################################################################

deploy_specific_service() {
    local service=$1

    if [ "$service" = "backend" ]; then
        print_header "Deploying Backend Only"

        docker build -t "gcr.io/$PROJECT_ID/$SERVICE_BACKEND:latest" -f backend/Dockerfile ./backend
        docker push "gcr.io/$PROJECT_ID/$SERVICE_BACKEND:latest"
        deploy_backend

    elif [ "$service" = "frontend" ]; then
        print_header "Deploying Frontend Only"

        # Get backend URL
        BACKEND_URL=$(gcloud run services describe "$SERVICE_BACKEND" \
            --region="$REGION" \
            --format='value(status.url)' \
            --project="$PROJECT_ID" 2>/dev/null)

        if [ -z "$BACKEND_URL" ]; then
            print_error "Backend service not found. Deploy backend first."
            exit 1
        fi

        docker build \
            -t "gcr.io/$PROJECT_ID/$SERVICE_FRONTEND:latest" \
            -f frontend/Dockerfile \
            --build-arg VITE_API_URL="$BACKEND_URL/api" \
            ./frontend

        docker push "gcr.io/$PROJECT_ID/$SERVICE_FRONTEND:latest"
        deploy_frontend
    else
        print_error "Unknown service: $service"
        echo "Usage: ./deploy-gcp.sh [backend|frontend]"
        exit 1
    fi
}

##############################################################################
# Main Deployment Flow
##############################################################################

main() {
    # Check if specific service deployment requested
    if [ "$1" = "backend" ] || [ "$1" = "frontend" ]; then
        setup_project
        deploy_specific_service "$1"
        display_summary
        exit 0
    fi

    # Full deployment
    print_header "Market Screener Pro - GCP Deployment"

    echo "This script will deploy the Market Screener application to Google Cloud Run."
    echo ""
    echo "Deployment method:"
    echo "  1. Standard deployment (step-by-step)"
    echo "  2. Cloud Build (automated, recommended)"
    echo ""
    read -p "Select deployment method (1 or 2): " method

    check_prerequisites
    setup_project
    enable_apis

    if [ "$method" = "2" ]; then
        deploy_with_cloud_build
    else
        build_and_push
        deploy_backend
        deploy_frontend
    fi

    display_summary
}

##############################################################################
# Script Entry Point
##############################################################################

main "$@"
