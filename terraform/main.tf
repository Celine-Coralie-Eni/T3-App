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
  
  # Temporarily removed default tags due to ec2:CreateTags permission issue
  # default_tags {
  #   tags = {
  #     Project     = "todo-app"
  #     Environment = var.environment
  #     ManagedBy   = "terraform"
  #   }
  # }
}