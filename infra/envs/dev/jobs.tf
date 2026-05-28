resource "aws_ecs_task_definition" "orders_expiry" {
  count = local.deploy_jobs_stack ? 1 : 0

  family                   = "${local.name_prefix}-orders-expiry"
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
      name      = "orders-expiry"
      image     = "${aws_ecr_repository.backend[0].repository_url}:${var.backend_image_tag}"
      essential = true
      command   = ["npm", "run", "orders:expire"]
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
        },
        {
          name  = "ORDER_EXPIRY_MINUTES"
          value = tostring(var.orders_expiry_minutes)
        },
        {
          name  = "ORDER_EXPIRY_BATCH_SIZE"
          value = tostring(var.orders_expiry_batch_size)
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
        ]
      )
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend[0].name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "orders-expiry"
        }
      }
    }
  ])
}

resource "aws_iam_role" "scheduler" {
  count = local.deploy_jobs_stack ? 1 : 0

  name = "${local.name_prefix}-scheduler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "scheduler_run_orders_expiry" {
  count = local.deploy_jobs_stack ? 1 : 0

  name = "${local.name_prefix}-run-orders-expiry"
  role = aws_iam_role.scheduler[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask"
        ]
        Resource = aws_ecs_task_definition.orders_expiry[0].arn
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.backend_task_execution[0].arn,
          aws_iam_role.backend_task[0].arn
        ]
        Condition = {
          StringLike = {
            "iam:PassedToService" = "ecs-tasks.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_scheduler_schedule" "orders_expiry" {
  count = local.deploy_jobs_stack ? 1 : 0

  name        = "${local.name_prefix}-orders-expiry"
  description = "Expire unpaid orders and release reserved inventory."
  state       = var.orders_expiry_enabled ? "ENABLED" : "DISABLED"

  schedule_expression = var.orders_expiry_schedule_expression

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_ecs_cluster.main[0].arn
    role_arn = aws_iam_role.scheduler[0].arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.orders_expiry[0].arn
      launch_type         = "FARGATE"
      platform_version    = "LATEST"
      task_count          = 1

      network_configuration {
        subnets          = aws_subnet.app_public[*].id
        security_groups  = [aws_security_group.backend[0].id]
        assign_public_ip = true
      }
    }
  }

  depends_on = [
    aws_iam_role_policy.scheduler_run_orders_expiry
  ]
}
