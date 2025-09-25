# VPC and networking configuration for T3 App

# Use ALB's VPC for connectivity
data "aws_vpc" "alb_vpc" {
  id = "vpc-0b6ff70b3e2a166de"
}

# Use ALB's VPC subnets
data "aws_subnets" "alb_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.alb_vpc.id]
  }
}

# Use default security group in ALB's VPC
data "aws_security_group" "default" {
  vpc_id = data.aws_vpc.alb_vpc.id
  name   = "default"
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}