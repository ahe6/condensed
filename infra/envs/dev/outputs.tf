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
  value       = local.deploy_app_stack ? aws_db_instance.postgres[0].address : null
}

output "postgres_port" {
  description = "Postgres database port."
  value       = local.deploy_app_stack ? aws_db_instance.postgres[0].port : null
}

output "postgres_security_group_id" {
  description = "Security group attached to the Postgres database."
  value       = local.deploy_app_stack ? aws_security_group.postgres[0].id : null
}

output "backend_security_group_id" {
  description = "Security group to attach to backend workloads that need Postgres access."
  value       = local.deploy_app_stack ? aws_security_group.backend[0].id : null
}

output "backend_ecr_repository_url" {
  description = "ECR repository URL for backend Docker images."
  value       = local.deploy_app_stack ? aws_ecr_repository.backend[0].repository_url : null
}

output "ecs_cluster_name" {
  description = "ECS cluster name for dev workloads."
  value       = local.deploy_app_stack ? aws_ecs_cluster.main[0].name : null
}

output "app_public_subnet_ids_csv" {
  description = "Comma-separated public app subnet IDs for AWS CLI run-task commands."
  value       = join(",", aws_subnet.app_public[*].id)
}

output "backend_migration_task_definition_arn" {
  description = "Task definition ARN for one-off backend database migrations."
  value       = local.deploy_app_stack ? aws_ecs_task_definition.backend_migration[0].arn : null
}

output "backend_load_balancer_dns_name" {
  description = "Public DNS name for the backend load balancer when the backend service is enabled."
  value       = local.deploy_app_stack && var.backend_service_enabled ? aws_lb.backend[0].dns_name : null
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID for app authentication."
  value       = aws_cognito_user_pool.main.id
}

output "cognito_frontend_client_id" {
  description = "Cognito app client ID for the frontend."
  value       = aws_cognito_user_pool_client.frontend.id
}

output "cognito_issuer" {
  description = "OIDC issuer URL for Cognito JWT verification."
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "cognito_hosted_ui_domain" {
  description = "Cognito Hosted UI domain for login/logout."
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "postgres_master_user_secret_arn" {
  description = "Secrets Manager ARN for the AWS-managed Postgres master password."
  value       = local.deploy_app_stack ? aws_db_instance.postgres[0].master_user_secret[0].secret_arn : null
  sensitive   = true
}
