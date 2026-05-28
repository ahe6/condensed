resource "aws_ecr_repository" "backend" {
  count = local.deploy_app_stack ? 1 : 0

  name                 = "${local.name_prefix}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  count = local.deploy_app_stack ? 1 : 0

  repository = aws_ecr_repository.backend[0].name

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
  count = local.deploy_app_stack ? 1 : 0

  name              = "/ecs/${local.name_prefix}-backend"
  retention_in_days = 14
}

resource "aws_ecs_cluster" "main" {
  count = local.deploy_app_stack ? 1 : 0

  name = local.name_prefix
}

resource "aws_security_group" "alb" {
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  name        = "${local.name_prefix}-alb"
  description = "Public HTTP access to ${local.name_prefix} backend"
  vpc_id      = aws_vpc.main[0].id

  tags = {
    Name = "${local.name_prefix}-alb"
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  security_group_id = aws_security_group.alb[0].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
  description       = "Public HTTP"
}

resource "aws_vpc_security_group_egress_rule" "alb_backend" {
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  security_group_id            = aws_security_group.alb[0].id
  referenced_security_group_id = aws_security_group.backend[0].id
  from_port                    = var.backend_container_port
  ip_protocol                  = "tcp"
  to_port                      = var.backend_container_port
  description                  = "Forward HTTP to backend tasks"
}

resource "aws_vpc_security_group_ingress_rule" "backend_alb" {
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  security_group_id            = aws_security_group.backend[0].id
  referenced_security_group_id = aws_security_group.alb[0].id
  from_port                    = var.backend_container_port
  ip_protocol                  = "tcp"
  to_port                      = var.backend_container_port
  description                  = "Backend HTTP from ALB"
}

resource "aws_lb" "backend" {
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  name               = "${local.name_prefix}-backend"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = aws_subnet.app_public[*].id
}

resource "aws_lb_target_group" "backend" {
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  name        = "${local.name_prefix}-backend"
  port        = var.backend_container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main[0].id

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
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  load_balancer_arn = aws_lb.backend[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }
}

resource "aws_iam_role" "backend_task_execution" {
  count = local.deploy_app_stack ? 1 : 0

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
  count = local.deploy_app_stack ? 1 : 0

  role       = aws_iam_role.backend_task_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "backend_task_execution_secrets" {
  count = local.deploy_app_stack ? 1 : 0

  name = "${local.name_prefix}-backend-secrets"
  role = aws_iam_role.backend_task_execution[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = compact([
          aws_db_instance.postgres[0].master_user_secret[0].secret_arn,
          var.stripe_api_key_secret_arn,
          var.stripe_webhook_secret_arn
        ])
      }
    ]
  })
}

resource "aws_iam_role" "backend_task" {
  count = local.deploy_app_stack ? 1 : 0

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

resource "aws_iam_role_policy" "backend_task_ses" {
  count = local.deploy_app_stack && var.email_provider == "ses" ? 1 : 0

  name = "${local.name_prefix}-backend-ses"
  role = aws_iam_role.backend_task[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = var.ses_identity_arn == "" ? "*" : var.ses_identity_arn
      }
    ]
  })
}

resource "aws_ecs_task_definition" "backend" {
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  family                   = "${local.name_prefix}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.backend_task_execution[0].arn
  task_role_arn            = aws_iam_role.backend_task[0].arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend[0].repository_url}:${var.backend_image_tag}"
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
          value = aws_db_instance.postgres[0].address
        },
        {
          name  = "DB_PORT"
          value = tostring(aws_db_instance.postgres[0].port)
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
        },
        {
          name  = "COGNITO_ISSUER"
          value = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
        },
        {
          name  = "COGNITO_CLIENT_ID"
          value = aws_cognito_user_pool_client.frontend.id
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "EMAIL_PROVIDER"
          value = var.email_provider
        },
        {
          name  = "EMAIL_FROM"
          value = var.email_from
        },
        {
          name  = "APP_BASE_URL"
          value = var.app_base_url
        }
      ]
      secrets = concat(
        [
          {
            name      = "DB_SECRET_JSON"
            valueFrom = aws_db_instance.postgres[0].master_user_secret[0].secret_arn
          }
        ],
        var.stripe_api_key_secret_arn == "" ? [] : [
          {
            name      = "STRIPE_API_KEY"
            valueFrom = var.stripe_api_key_secret_arn
          }
        ],
        var.stripe_webhook_secret_arn == "" ? [] : [
          {
            name      = "STRIPE_WEBHOOK_SECRET"
            valueFrom = var.stripe_webhook_secret_arn
          }
        ]
      )
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend[0].name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "backend_migration" {
  count = local.deploy_app_stack ? 1 : 0

  family                   = "${local.name_prefix}-backend-migration"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.backend_task_execution[0].arn
  task_role_arn            = aws_iam_role.backend_task[0].arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "backend-migration"
      image     = "${aws_ecr_repository.backend[0].repository_url}:${var.backend_image_tag}"
      essential = true
      command   = ["npm", "run", "db:deploy"]
      environment = [
        {
          name  = "DB_HOST"
          value = aws_db_instance.postgres[0].address
        },
        {
          name  = "DB_PORT"
          value = tostring(aws_db_instance.postgres[0].port)
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
          valueFrom = aws_db_instance.postgres[0].master_user_secret[0].secret_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend[0].name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "migration"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  count = local.deploy_app_stack && var.backend_service_enabled ? 1 : 0

  name            = "${local.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.backend[0].arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.app_public[*].id
    security_groups  = [aws_security_group.backend[0].id]
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
