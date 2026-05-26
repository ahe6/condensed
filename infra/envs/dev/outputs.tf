output "account_id" {
  description = "AWS account ID used by the dev environment."
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS region used by the dev environment."
  value       = data.aws_region.current.region
}

output "postgres_endpoint" {
  description = "Postgres database endpoint."
  value       = aws_db_instance.postgres.address
}

output "postgres_port" {
  description = "Postgres database port."
  value       = aws_db_instance.postgres.port
}

output "postgres_security_group_id" {
  description = "Security group attached to the Postgres database."
  value       = aws_security_group.postgres.id
}

output "backend_security_group_id" {
  description = "Security group to attach to backend workloads that need Postgres access."
  value       = aws_security_group.backend.id
}

output "backend_ecr_repository_url" {
  description = "ECR repository URL for backend Docker images."
  value       = aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name for dev workloads."
  value       = aws_ecs_cluster.main.name
}

output "app_public_subnet_ids_csv" {
  description = "Comma-separated public app subnet IDs for AWS CLI run-task commands."
  value       = join(",", aws_subnet.app_public[*].id)
}

output "backend_migration_task_definition_arn" {
  description = "Task definition ARN for one-off backend database migrations."
  value       = aws_ecs_task_definition.backend_migration.arn
}

output "backend_load_balancer_dns_name" {
  description = "Public DNS name for the backend load balancer when the backend service is enabled."
  value       = var.backend_service_enabled ? aws_lb.backend[0].dns_name : null
}

output "postgres_master_user_secret_arn" {
  description = "Secrets Manager ARN for the AWS-managed Postgres master password."
  value       = aws_db_instance.postgres.master_user_secret[0].secret_arn
  sensitive   = true
}
