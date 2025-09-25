# Application Load Balancer configuration for T3 App
# Note: Due to permission constraints, using existing ALB infrastructure

# FQDN for the existing ALB (working solution)
locals {
  alb_fqdn = "todo-app-alb-947148443.eu-central-1.elb.amazonaws.com"
}