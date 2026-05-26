resource "aws_ecr_repository" "backend" {
  name                 = "${local.name_prefix}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep the last 10 backend images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name_prefix}-backend"
  retention_in_days = 14
}

resource "aws_ecs_cluster" "main" {
  name = local.name_prefix
}

resource "aws_security_group" "alb" {
  count = var.backend_service_enabled ? 1 : 0

  name        = "${local.name_prefix}-alb"
  description = "Public HTTP access to ${local.name_prefix} backend"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-alb"
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  count = var.backend_service_enabled ? 1 : 0

  security_group_id = aws_security_group.alb[0].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
  description       = "Public HTTP"
}

resource "aws_vpc_security_group_egress_rule" "alb_backend" {
  count = var.backend_service_enabled ? 1 : 0

  security_group_id            = aws_security_group.alb[0].id
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = var.backend_container_port
  ip_protocol                  = "tcp"
  to_port                      = var.backend_container_port
  description                  = "Forward HTTP to backend tasks"
}

resource "aws_vpc_security_group_ingress_rule" "backend_alb" {
  count = var.backend_service_enabled ? 1 : 0

  security_group_id            = aws_security_group.backend.id
  referenced_security_group_id = aws_security_group.alb[0].id
  from_port                    = var.backend_container_port
  ip_protocol                  = "tcp"
  to_port                      = var.backend_container_port
  description                  = "Backend HTTP from ALB"
}

resource "aws_lb" "backend" {
  count = var.backend_service_enabled ? 1 : 0

  name               = "${local.name_prefix}-backend"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = aws_subnet.app_public[*].id
}

resource "aws_lb_target_group" "backend" {
  count = var.backend_service_enabled ? 1 : 0

  name        = "${local.name_prefix}-backend"
  port        = var.backend_container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "backend_http" {
  count = var.backend_service_enabled ? 1 : 0

  load_balancer_arn = aws_lb.backend[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }
}

resource "aws_iam_role" "backend_task_execution" {
  name = "${local.name_prefix}-backend-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend_task_execution" {
  role       = aws_iam_role.backend_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "backend_task_execution_secrets" {
  name = "${local.name_prefix}-backend-secrets"
  role = aws_iam_role.backend_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_db_instance.postgres.master_user_secret[0].secret_arn
      }
    ]
  })
}

resource "aws_iam_role" "backend_task" {
  name = "${local.name_prefix}-backend-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_ecs_task_definition" "backend" {
  count = var.backend_service_enabled ? 1 : 0

  family                   = "${local.name_prefix}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.backend_task_execution.arn
  task_role_arn            = aws_iam_role.backend_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      essential = true
      portMappings = [
        {
          containerPort = var.backend_container_port
          hostPort      = var.backend_container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "DB_HOST"
          value = aws_db_instance.postgres.address
        },
        {
          name  = "DB_PORT"
          value = tostring(aws_db_instance.postgres.port)
        },
        {
          name  = "DB_NAME"
          value = var.postgres_db_name
        },
        {
          name  = "HOST"
          value = "0.0.0.0"
        },
        {
          name  = "PORT"
          value = tostring(var.backend_container_port)
        },
        {
          name  = "LOG_LEVEL"
          value = "info"
        }
      ]
      secrets = [
        {
          name      = "DB_SECRET_JSON"
          valueFrom = aws_db_instance.postgres.master_user_secret[0].secret_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "backend_migration" {
  family                   = "${local.name_prefix}-backend-migration"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.backend_task_execution.arn
  task_role_arn            = aws_iam_role.backend_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "backend-migration"
      image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      essential = true
      command   = ["npm", "run", "db:deploy"]
      environment = [
        {
          name  = "DB_HOST"
          value = aws_db_instance.postgres.address
        },
        {
          name  = "DB_PORT"
          value = tostring(aws_db_instance.postgres.port)
        },
        {
          name  = "DB_NAME"
          value = var.postgres_db_name
        },
        {
          name  = "LOG_LEVEL"
          value = "info"
        }
      ]
      secrets = [
        {
          name      = "DB_SECRET_JSON"
          valueFrom = aws_db_instance.postgres.master_user_secret[0].secret_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "migration"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  count = var.backend_service_enabled ? 1 : 0

  name            = "${local.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend[0].arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.app_public[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend[0].arn
    container_name   = "backend"
    container_port   = var.backend_container_port
  }

  depends_on = [
    aws_lb_listener.backend_http,
    aws_iam_role_policy_attachment.backend_task_execution,
    aws_iam_role_policy.backend_task_execution_secrets
  ]
}
