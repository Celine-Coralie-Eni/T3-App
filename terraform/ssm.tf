# SSM Parameter for NextAuth Secret
resource "aws_ssm_parameter" "nextauth_secret" {
  name  = "/${var.project_name}/nextauth-secret"
  type  = "SecureString"
  value = "change-me-in-production"

  description = "NextAuth secret for JWT signing"

  tags = {
    Name        = "${var.project_name}-nextauth-secret"
    Environment = var.environment
  }
}

# SSM Parameter for Database Password
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/db-password"
  type  = "SecureString"
  value = var.db_password

  description = "Database master password"

  tags = {
    Name        = "${var.project_name}-db-password"
    Environment = var.environment
  }
}
