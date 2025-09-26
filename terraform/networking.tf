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

resource "aws_security_group_rule" "allow_db_traffic_vpc_cidr" {
  type              = "ingress"
  from_port         = 5433 # PostgreSQL port
  to_port           = 5433
  protocol          = "tcp"
  security_group_id = data.aws_security_group.default.id
  cidr_blocks       = [data.aws_vpc.alb_vpc.cidr_block]
  description       = "Allow PostgreSQL traffic from within the VPC CIDR"
}

# Allow DNS resolution for service discovery
resource "aws_security_group_rule" "allow_dns_tcp" {
  type              = "ingress"
  from_port         = 53
  to_port           = 53
  protocol          = "tcp"
  security_group_id = data.aws_security_group.default.id
  cidr_blocks       = [data.aws_vpc.alb_vpc.cidr_block]
  description       = "Allow DNS TCP traffic for service discovery"
}

resource "aws_security_group_rule" "allow_dns_udp" {
  type              = "ingress"
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  security_group_id = data.aws_security_group.default.id
  cidr_blocks       = [data.aws_vpc.alb_vpc.cidr_block]
  description       = "Allow DNS UDP traffic for service discovery"
}

# Get the existing Internet Gateway for the VPC
data "aws_internet_gateway" "existing" {
  filter {
    name   = "attachment.vpc-id"
    values = [data.aws_vpc.alb_vpc.id]
  }
}

# Get existing route table for the VPC
data "aws_route_tables" "existing" {
  vpc_id = data.aws_vpc.alb_vpc.id
  filter {
    name   = "route.gateway-id"
    values = [data.aws_internet_gateway.existing.id]
  }
}

# Create a dedicated subnet for database with predictable IP range
resource "aws_subnet" "database_subnet" {
  vpc_id            = data.aws_vpc.alb_vpc.id
  cidr_block        = "10.0.100.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  
  map_public_ip_on_launch = true
  
  # Tags omitted due to potential ec2:CreateTags permission issue
  # tags = {
  #   Name = "${var.app_name}-database-subnet"
  # }
}

# Associate database subnet with existing route table that has internet access
resource "aws_route_table_association" "database_subnet" {
  subnet_id      = aws_subnet.database_subnet.id
  route_table_id = data.aws_route_tables.existing.ids[0]
}

