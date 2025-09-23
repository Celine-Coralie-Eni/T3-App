# Terraform configuration for T3 App deployment to AWS ECS
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "t3-app"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}