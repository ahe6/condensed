resource "aws_security_group" "postgres" {
  count = local.deploy_app_stack ? 1 : 0

  name        = "${local.name_prefix}-postgres"
  description = "Controls access to the ${local.name_prefix} Postgres database"
  vpc_id      = aws_vpc.main[0].id

  tags = {
    Name = "${local.name_prefix}-postgres"
  }
}

resource "aws_security_group" "backend" {
  count = local.deploy_app_stack ? 1 : 0

  name        = "${local.name_prefix}-backend"
  description = "Security group for ${local.name_prefix} backend workloads"
  vpc_id      = aws_vpc.main[0].id

  tags = {
    Name = "${local.name_prefix}-backend"
  }
}

resource "aws_vpc_security_group_egress_rule" "backend_all" {
  count = local.deploy_app_stack ? 1 : 0

  security_group_id = aws_security_group.backend[0].id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow outbound traffic"
}

resource "aws_vpc_security_group_ingress_rule" "postgres_backend" {
  count = local.deploy_app_stack ? 1 : 0

  security_group_id            = aws_security_group.postgres[0].id
  referenced_security_group_id = aws_security_group.backend[0].id
  from_port                    = 5432
  ip_protocol                  = "tcp"
  to_port                      = 5432
  description                  = "Postgres access from backend workloads"
}

resource "aws_vpc_security_group_ingress_rule" "postgres_cidr" {
  for_each = local.deploy_app_stack ? var.allowed_postgres_cidr_blocks : toset([])

  security_group_id = aws_security_group.postgres[0].id
  cidr_ipv4         = each.value
  from_port         = 5432
  ip_protocol       = "tcp"
  to_port           = 5432
  description       = "Postgres access from ${each.value}"
}

resource "aws_vpc_security_group_egress_rule" "postgres_all" {
  count = local.deploy_app_stack ? 1 : 0

  security_group_id = aws_security_group.postgres[0].id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow outbound traffic"
}

resource "aws_db_instance" "postgres" {
  count = local.deploy_app_stack ? 1 : 0

  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  instance_class = var.postgres_instance_class

  allocated_storage     = var.postgres_allocated_storage_gb
  max_allocated_storage = var.postgres_max_allocated_storage_gb
  storage_encrypted     = true
  storage_type          = "gp3"

  db_name  = var.postgres_db_name
  username = var.postgres_username

  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.postgres[0].name
  vpc_security_group_ids = [aws_security_group.postgres[0].id]
  publicly_accessible    = false

  backup_retention_period = var.postgres_backup_retention_days
  copy_tags_to_snapshot   = true
  deletion_protection     = false
  skip_final_snapshot     = true

  apply_immediately = true
}
