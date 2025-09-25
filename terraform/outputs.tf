# Output values for T3 App deployment

output "vpc_id" {
  description = "ID of the VPC"
  value       = data.aws_vpc.alb_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = data.aws_subnets.alb_subnets.ids
}

# Private subnets removed for simplified practice deployment
# output "private_subnet_ids" {
#   description = "IDs of the private subnets"
#   value       = aws_subnet.private[*].id
# }

output "alb_dns_name" {
  description = "DNS name of the load balancer (FQDN)"
  value       = local.alb_fqdn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "application_url" {
  description = "URL to access the application via FQDN"
  value       = "http://${local.alb_fqdn}"
}

# CloudWatch outputs removed 