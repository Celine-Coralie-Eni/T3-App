# Input variables for the T3 App infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "t3-app"
}

variable "container_image" {
  description = "Docker image URI from GitHub Container Registry"
  type        = string
  default     = "ghcr.io/celine-coralie-eni/t3-app:latest"
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

# Database configuration
variable "database_url" {
  description = "PostgreSQL database URL"
  type        = string
  sensitive   = true
}

variable "auth_secret" {
  description = "Auth secret"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth secret"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "NextAuth URL"
  type        = string
  sensitive   = true
}

variable "auth_google_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "auth_google_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "auth_trust_host" {
  description = "NextAuth trust host setting"
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}