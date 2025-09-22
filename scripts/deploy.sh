#!/bin/bash

# Deploy script for Todo App GitOps Pipeline
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="todo-app"
AWS_REGION="us-east-1"
TERRAFORM_DIR="./terraform"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed. Aborting."; exit 1; }
    command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed. Aborting."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || { log_error "AWS credentials not configured. Run 'aws configure' first."; exit 1; }
    
    log_success "Prerequisites check passed"
}

init_terraform() {
    log_info "Initializing Terraform..."
    cd "$TERRAFORM_DIR"
    
    if [ ! -f "terraform.tfvars" ]; then
        log_warning "terraform.tfvars not found. Please copy terraform.tfvars.example and configure it."
        cp terraform.tfvars.example terraform.tfvars
        log_info "Created terraform.tfvars from example. Please edit it with your values."
        exit 1
    fi
    
    terraform init
    log_success "Terraform initialized"
}

plan_terraform() {
    log_info "Planning Terraform deployment..."
    terraform plan -out=tfplan
    log_success "Terraform plan created"
}

apply_terraform() {
    log_info "Applying Terraform configuration..."
    terraform apply tfplan
    log_success "Infrastructure deployed successfully"
}

build_and_push_image() {
    log_info "Building and pushing Docker image..."
    cd ..
    
    # Get ECR repository URL from Terraform output
    ECR_REPO=$(cd terraform && terraform output -raw ecr_repository_url)
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPO"
    
    # Build and tag image
    docker build -t "$PROJECT_NAME" .
    docker tag "$PROJECT_NAME:latest" "$ECR_REPO:latest"
    docker tag "$PROJECT_NAME:latest" "$ECR_REPO:$(git rev-parse --short HEAD)"
    
    # Push image
    docker push "$ECR_REPO:latest"
    docker push "$ECR_REPO:$(git rev-parse --short HEAD)"
    
    log_success "Docker image pushed to ECR"
}

update_ecs_service() {
    log_info "Updating ECS service..."
    cd terraform
    
    # Force new deployment
    aws ecs update-service \
        --cluster "${PROJECT_NAME}-cluster" \
        --service "${PROJECT_NAME}-service" \
        --force-new-deployment \
        --region "$AWS_REGION"
    
    log_success "ECS service updated"
}

wait_for_deployment() {
    log_info "Waiting for deployment to complete..."
    cd terraform
    
    aws ecs wait services-stable \
        --cluster "${PROJECT_NAME}-cluster" \
        --services "${PROJECT_NAME}-service" \
        --region "$AWS_REGION"
    
    log_success "Deployment completed successfully"
}

show_outputs() {
    log_info "Deployment outputs:"
    cd terraform
    
    echo "Application URL: $(terraform output -raw application_url)"
    echo "ALB DNS Name: $(terraform output -raw alb_dns_name)"
    echo "ECR Repository: $(terraform output -raw ecr_repository_url)"
    echo "GitHub Actions Role ARN: $(terraform output -raw github_actions_role_arn)"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    cd terraform
    rm -f tfplan
}

# Main deployment flow
main() {
    log_info "Starting deployment of $PROJECT_NAME..."
    
    case "${1:-deploy}" in
        "init")
            check_prerequisites
            init_terraform
            ;;
        "plan")
            check_prerequisites
            init_terraform
            plan_terraform
            ;;
        "deploy")
            check_prerequisites
            init_terraform
            plan_terraform
            apply_terraform
            build_and_push_image
            update_ecs_service
            wait_for_deployment
            show_outputs
            cleanup
            log_success "Deployment completed successfully!"
            ;;
        "destroy")
            log_warning "This will destroy all infrastructure. Are you sure? (y/N)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                cd terraform
                terraform destroy
                log_success "Infrastructure destroyed"
            else
                log_info "Destruction cancelled"
            fi
            ;;
        *)
            echo "Usage: $0 {init|plan|deploy|destroy}"
            echo "  init    - Initialize Terraform"
            echo "  plan    - Plan Terraform deployment"
            echo "  deploy  - Full deployment (default)"
            echo "  destroy - Destroy infrastructure"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
