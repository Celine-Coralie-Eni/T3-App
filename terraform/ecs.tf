# ECS configuration for T3 App

# DATA SOURCES FOR DYNAMIC DATABASE IP DETECTION
data "aws_ecs_service" "db_service_data" {
  service_name = "${var.app_name}-db-service"
  cluster_arn  = aws_ecs_cluster.database.arn
  depends_on   = [aws_ecs_service.db_service]
}

data "aws_ecs_task_definition" "db_task_data" {
  task_definition = data.aws_ecs_service.db_service_data.task_definition
}

# Direct networking approach - get current database IP dynamically
locals {
  database_dns_name = "10.0.100.9"  # Current database IP from running task
}

# ECS CLUSTERS
# Main ECS Cluster for Application Services
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
  
  # No service connect defaults needed for direct networking
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  # Tags omitted due to potential ec2:CreateTags permission issue
  # tags = {
  #   Name = "${var.app_name}-cluster"
  # }
}

# Separate ECS Cluster for Database Services
resource "aws_ecs_cluster" "database" {
  name = "${var.app_name}-db-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  # Tags omitted due to potential ec2:CreateTags permission issue
  # tags = {
  #   Name = "${var.app_name}-db-cluster"
  # }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.app_name}-ecs-task-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  tags = {
    Name = "${var.app_name}-ecs-task-execution-role"
  }
}

# Attach the Amazon ECS task execution role policy
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role (for application permissions)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.app_name}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  tags = {
    Name = "${var.app_name}-ecs-task-role"
  }
}

# DATABASE TASK DEFINITION
resource "aws_ecs_task_definition" "db_task" {
  family                   = "${var.app_name}-db-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  
  # Lifecycle safeguards temporarily disabled for health check fix
  # lifecycle {
  #   prevent_destroy = true
  # }
  container_definitions    = jsonencode([
    {
      name        = "${var.app_name}-db"
      image       = "postgres:15"
      essential   = true
      portMappings = [
        {
          containerPort = 5433
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "POSTGRES_USER",     value = "celine" },
        { name = "POSTGRES_PASSWORD", value = "celine45" },
        { name = "POSTGRES_DB",       value = "todo" },
        { name = "POSTGRES_HOST_AUTH_METHOD", value = "trust" },
        { name = "PGPORT",            value = "5433" }
      ]
      command = [
        "postgres",
        "-c", "listen_addresses=*",
        "-c", "port=5433",
        "-c", "max_connections=100",
        "-c", "shared_buffers=128MB"
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/todo-app-db-task"
          "awslogs-region"        = "eu-central-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "pg_isready -U celine -p 5433"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
  tags = {
    Name = "${var.app_name}-db-task-definition"
    Type = "Database"
  }
}

# DATABASE MIGRATION TASK DEFINITION
resource "aws_ecs_task_definition" "db_migration" {
  family                   = "${var.app_name}-db-migration"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  container_definitions    = jsonencode([
    {
      name      = "db-migration"
      image     = "ghcr.io/celine-coralie-eni/todo-app:latest"
      command   = ["sh", "-c", "npx prisma migrate deploy && node scripts/import-data.js"]
      environment = [
        { name = "DATABASE_URL", value = "postgresql://celine:celine45@${local.database_dns_name}:5433/todo" },
        { name = "NODE_ENV",    value = "production" }
      ]
    }
  ])
  tags = {
    Name = "${var.app_name}-db-migration-task"
    Type = "Migration"
  }
}

# DATABASE SERVICE with Service Discovery
resource "aws_ecs_service" "db_service" {
  name            = "${var.app_name}-db-service"
  cluster         = aws_ecs_cluster.database.id
  task_definition = aws_ecs_task_definition.db_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  
  lifecycle {
    prevent_destroy = true
  }
  
  network_configuration {
    security_groups  = [data.aws_security_group.default.id]
    subnets          = [aws_subnet.database_subnet.id]
    assign_public_ip = true
  }
  
  # No service discovery - using direct IP networking
}

# No separate service discovery resource needed with Service Connect

# APPLICATION TASK DEFINITION
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.app_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  container_definitions    = jsonencode([
    {
      name  = var.app_name
      image = var.container_image
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "NEXTAUTH_URL"
          value = var.nextauth_url
        },
        {
          name  = "AUTH_TRUST_HOST"
          value = tostring(var.auth_trust_host)
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://celine:celine45@${local.database_dns_name}:5433/todo"
        },
        {
          name  = "AUTH_SECRET"
          value = var.auth_secret
        },
        {
          name  = "NEXTAUTH_SECRET"
          value = var.nextauth_secret
        },
        {
          name  = "AUTH_GOOGLE_ID"
          value = var.auth_google_id
        },
        {
          name  = "AUTH_GOOGLE_SECRET"
          value = var.auth_google_secret
        },
        {
          name  = "SKIP_ENV_VALIDATION"
          value = "true"
        }
      ]
      essential = true
    }
  ])
  tags = {
    Name = "${var.app_name}-task-definition"
  }
}

# APPLICATION SERVICE
resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = data.aws_subnets.alb_subnets.ids
    security_groups  = [data.aws_security_group.default.id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = "arn:aws:elasticloadbalancing:eu-central-1:571075516563:targetgroup/todo-app-tg/5b60ff02f90e5aee"
    container_name   = var.app_name
    container_port   = var.container_port
  }
  # Direct networking approach - services communicate via VPC networking
  
  depends_on = [aws_ecs_service.db_service]
  # Tags omitted due to potential ec2:CreateTags permission issue
  # tags = {
  #   Name = "${var.app_name}-service"
  # }
}