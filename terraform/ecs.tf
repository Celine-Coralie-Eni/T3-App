# ECS configuration for T3 App

# =============================================
# ECS CLUSTERS
# =============================================

# Main ECS Cluster for Application Services
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.app_name}-cluster"
    Type = "Application"
  }
}

# Separate ECS Cluster for Database Services
resource "aws_ecs_cluster" "database" {
  name = "${var.app_name}-db-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.app_name}-db-cluster"
    Type = "Database"
  }
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

# =============================================
# CLOUDWATCH LOG GROUPS
# =============================================

# CloudWatch Log Group for Application Services
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.app_name}-log-group"
    Type = "Application"
  }
}

# CloudWatch Log Group for Database Services
resource "aws_cloudwatch_log_group" "database" {
  name              = "/ecs/${var.app_name}-db"
  retention_in_days = 14  # Keep database logs longer

  tags = {
    Name = "${var.app_name}-db-log-group"
    Type = "Database"
  }
}

# =============================================
# EFS FILE SYSTEM FOR DATABASE PERSISTENCE
# =============================================

# EFS File System for PostgreSQL data persistence
resource "aws_efs_file_system" "database" {
  creation_token = "${var.app_name}-db-efs"
  
  # Enable encryption at rest
  encrypted = true
  
  # Performance mode
  performance_mode = "generalPurpose"
  throughput_mode  = "provisioned"
  provisioned_throughput_in_mibps = 20

  tags = {
    Name = "${var.app_name}-database-efs"
    Type = "Database Storage"
  }
}

# EFS Mount Targets for each private subnet
resource "aws_efs_mount_target" "database" {
  count           = length(aws_subnet.private)
  file_system_id  = aws_efs_file_system.database.id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.efs.id]
}

# =============================================
# DATABASE TASK DEFINITION
# =============================================

# ECS Database Task Definition with Persistent Storage
resource "aws_ecs_task_definition" "db_task" {
  family                   = "${var.app_name}-db-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512   # Increased for better DB performance
  memory                   = 1024  # Increased for better DB performance
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  # EFS Volume for persistent database storage
  volume {
    name = "database-storage"
    
    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.database.id
      root_directory     = "/"
      transit_encryption = "ENABLED"
      
      authorization_config {
        access_point_id = aws_efs_access_point.database.id
        iam             = "ENABLED"
      }
    }
  }

  container_definitions = jsonencode([
    {
      name      = "${var.app_name}-db"
      image     = "postgres:15"
      essential = true
      
      # Port mapping for PostgreSQL
      portMappings = [
        {
          containerPort = 5432  # Standard PostgreSQL port
          protocol      = "tcp"
        }
      ]
      
      # Environment variables for PostgreSQL configuration
      environment = [
        { name = "POSTGRES_USER", value = "celine" },
        { name = "POSTGRES_PASSWORD", value = "celine45" },
        { name = "POSTGRES_DB", value = "todo" },
        { name = "PGDATA", value = "/var/lib/postgresql/data/pgdata" },  # Custom data directory
        { name = "POSTGRES_INITDB_ARGS", value = "--encoding=UTF8 --locale=C" }  # Initialize with proper encoding
      ]
      
      # Mount EFS volume for data persistence
      mountPoints = [
        {
          sourceVolume  = "database-storage"
          containerPath = "/var/lib/postgresql/data"
          readOnly      = false
        }
      ]
      
      # Health check for PostgreSQL
      healthCheck = {
        command = [
          "CMD-SHELL",
          "pg_isready -U celine -d todo"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      # Logging configuration
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.database.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "postgresql"
        }
      }
    }
  ])

  tags = {
    Name = "${var.app_name}-db-task-definition"
    Type = "Database"
  }
}

# EFS Access Point for PostgreSQL data
resource "aws_efs_access_point" "database" {
  file_system_id = aws_efs_file_system.database.id
  
  posix_user {
    gid = 999  # postgres group
    uid = 999  # postgres user
  }
  
  root_directory {
    path = "/postgresql"
    creation_info {
      owner_gid   = 999
      owner_uid   = 999
      permissions = "755"
    }
  }
  
  tags = {
    Name = "${var.app_name}-db-access-point"
  }
}

# =============================================
# DATABASE SERVICE
# =============================================

# Database Migration Task Definition (One-time setup)
resource "aws_ecs_task_definition" "db_migration" {
  family                   = "${var.app_name}-db-migration"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn
  
  # Database migration task definition - runs schema migrations and imports existing data
  container_definitions = jsonencode([
    {
      name  = "db-migration"
      image = "ghcr.io/celine-coralie-eni/t3-app:latest"
      
      # Override the default command to run migrations and import existing data
      command = [
        "sh", "-c", 
        "npx prisma migrate deploy && node scripts/import-data.js"
      ]
      environment = [
        { name = "DATABASE_URL", value = "postgresql://celine:celine45@${var.app_name}-db.${var.app_name}.local:5432/todo" },
        { name = "NODE_ENV", value = "production" }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.database.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "migration"
        }
      }
    }
  ])

  tags = {
    Name = "${var.app_name}-db-migration-task"
    Type = "Migration"
  }
}

# ECS Database Service running in dedicated database cluster
resource "aws_ecs_service" "db_service" {
  name            = "${var.app_name}-db-service"
  cluster         = aws_ecs_cluster.database.id  # Running in separate DB cluster
  task_definition = aws_ecs_task_definition.db_task.arn
  desired_count   = 1  # Single database instance
  launch_type     = "FARGATE"
  
  # Enable service discovery for internal communication
  service_registries {
    registry_arn = aws_service_discovery_service.database.arn
  }

  network_configuration {
    security_groups  = [aws_security_group.database.id]  # Dedicated DB security group
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }
  
  # Database services don't use deployment_configuration

  tags = {
    Name = "${var.app_name}-db-service"
    Type = "Database"
  }
}

# =============================================
# APPLICATION TASK DEFINITION
# =============================================

# ECS App Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.app_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
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
          # Connect to database service via service discovery
          value = "postgresql://celine:celine45@${var.app_name}-db.${var.app_name}.local:5432/todo"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      essential = true
    }
  ])

  tags = {
    Name = "${var.app_name}-task-definition"
  }
}

# =============================================
# APPLICATION SERVICE
# =============================================

# ECS App Service running in main application cluster
resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.app_name
    container_port   = var.container_port
  }

  # Ensure database service is running before starting app
  depends_on = [aws_lb_listener.web, aws_ecs_service.db_service]

  tags = {
    Name = "${var.app_name}-service"
  }
}