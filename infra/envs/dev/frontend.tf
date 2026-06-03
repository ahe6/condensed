resource "aws_ecr_repository" "frontend" {
  count = local.deploy_app_stack ? 1 : 0

  name                 = "${local.name_prefix}-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  count = local.deploy_app_stack ? 1 : 0

  repository = aws_ecr_repository.frontend[0].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep the last 10 frontend images"
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

resource "aws_cloudwatch_log_group" "frontend" {
  count = local.deploy_app_stack ? 1 : 0

  name              = "/ecs/${local.name_prefix}-frontend"
  retention_in_days = 14
}

resource "aws_security_group" "frontend_alb" {
  count = local.deploy_frontend_service ? 1 : 0

  name        = "${local.name_prefix}-frontend-alb"
  description = "Public HTTP access to ${local.name_prefix} frontend"
  vpc_id      = aws_vpc.main[0].id

  tags = {
    Name = "${local.name_prefix}-frontend-alb"
  }
}

resource "aws_security_group" "frontend" {
  count = local.deploy_frontend_service ? 1 : 0

  name        = "${local.name_prefix}-frontend"
  description = "Frontend ECS task traffic for ${local.name_prefix}"
  vpc_id      = aws_vpc.main[0].id

  tags = {
    Name = "${local.name_prefix}-frontend"
  }
}

resource "aws_vpc_security_group_ingress_rule" "frontend_alb_http" {
  count = local.deploy_frontend_service ? 1 : 0

  security_group_id = aws_security_group.frontend_alb[0].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
  description       = "Public HTTP"
}

resource "aws_vpc_security_group_ingress_rule" "frontend_alb_https" {
  count = local.frontend_https_enabled ? 1 : 0

  security_group_id = aws_security_group.frontend_alb[0].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
  description       = "Public HTTPS"
}

resource "aws_vpc_security_group_egress_rule" "frontend_alb_frontend" {
  count = local.deploy_frontend_service ? 1 : 0

  security_group_id            = aws_security_group.frontend_alb[0].id
  referenced_security_group_id = aws_security_group.frontend[0].id
  from_port                    = var.frontend_container_port
  ip_protocol                  = "tcp"
  to_port                      = var.frontend_container_port
  description                  = "Forward HTTP to frontend tasks"
}

resource "aws_vpc_security_group_ingress_rule" "frontend_alb" {
  count = local.deploy_frontend_service ? 1 : 0

  security_group_id            = aws_security_group.frontend[0].id
  referenced_security_group_id = aws_security_group.frontend_alb[0].id
  from_port                    = var.frontend_container_port
  ip_protocol                  = "tcp"
  to_port                      = var.frontend_container_port
  description                  = "Frontend HTTP from ALB"
}

resource "aws_vpc_security_group_egress_rule" "frontend_http" {
  count = local.deploy_frontend_service ? 1 : 0

  security_group_id = aws_security_group.frontend[0].id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Frontend outbound HTTP and HTTPS"
}

resource "aws_lb" "frontend" {
  count = local.deploy_frontend_service ? 1 : 0

  name               = "${local.name_prefix}-frontend"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.frontend_alb[0].id]
  subnets            = aws_subnet.app_public[*].id
}

resource "aws_lb_target_group" "frontend" {
  count = local.deploy_frontend_service ? 1 : 0

  name        = "${local.name_prefix}-frontend"
  port        = var.frontend_container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main[0].id

  health_check {
    enabled             = true
    path                = "/"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_acm_certificate" "frontend" {
  count = local.deploy_frontend_service && local.frontend_domain != "" ? 1 : 0

  domain_name       = local.frontend_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "frontend" {
  count = local.frontend_https_enabled ? 1 : 0

  certificate_arn         = aws_acm_certificate.frontend[0].arn
  validation_record_fqdns = [for option in aws_acm_certificate.frontend[0].domain_validation_options : option.resource_record_name]
}

resource "aws_lb_listener" "frontend_http_forward" {
  count = local.deploy_frontend_service && !local.frontend_https_enabled ? 1 : 0

  load_balancer_arn = aws_lb.frontend[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend[0].arn
  }
}

resource "aws_lb_listener" "frontend_http_redirect" {
  count = local.frontend_https_enabled ? 1 : 0

  load_balancer_arn = aws_lb.frontend[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "frontend_https" {
  count = local.frontend_https_enabled ? 1 : 0

  load_balancer_arn = aws_lb.frontend[0].arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.frontend[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend[0].arn
  }
}

resource "aws_ecs_task_definition" "frontend" {
  count = local.deploy_frontend_service ? 1 : 0

  family                   = "${local.name_prefix}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.backend_task_execution[0].arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${aws_ecr_repository.frontend[0].repository_url}:${var.frontend_image_tag}"
      essential = true
      portMappings = [
        {
          containerPort = var.frontend_container_port
          hostPort      = var.frontend_container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "HOSTNAME"
          value = "0.0.0.0"
        },
        {
          name  = "PORT"
          value = tostring(var.frontend_container_port)
        },
        {
          name  = "NEXT_TELEMETRY_DISABLED"
          value = "1"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend[0].name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "frontend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "frontend" {
  count = local.deploy_frontend_service ? 1 : 0

  name            = "${local.name_prefix}-frontend"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.frontend[0].arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.app_public[*].id
    security_groups  = [aws_security_group.frontend[0].id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend[0].arn
    container_name   = "frontend"
    container_port   = var.frontend_container_port
  }

  depends_on = [
    aws_lb_listener.frontend_http_forward,
    aws_lb_listener.frontend_http_redirect,
    aws_lb_listener.frontend_https,
    aws_iam_role_policy_attachment.backend_task_execution
  ]
}
