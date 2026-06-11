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

output "frontend_ecr_repository_url" {
  description = "ECR repository URL for frontend Docker images."
  value       = local.deploy_app_stack ? aws_ecr_repository.frontend[0].repository_url : null
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

output "orders_expiry_task_definition_arn" {
  description = "Task definition ARN for the Stripe Checkout reconciliation job."
  value       = local.deploy_jobs_stack ? aws_ecs_task_definition.orders_expiry[0].arn : null
}

output "orders_expiry_schedule_name" {
  description = "EventBridge Scheduler schedule name for Stripe Checkout reconciliation."
  value       = local.deploy_jobs_stack ? aws_scheduler_schedule.orders_expiry[0].name : null
}

output "backend_load_balancer_dns_name" {
  description = "Public DNS name for the backend load balancer when the backend service is enabled."
  value       = local.deploy_app_stack && var.backend_service_enabled ? aws_lb.backend[0].dns_name : null
}

output "frontend_load_balancer_dns_name" {
  description = "Public DNS name for the frontend load balancer when the frontend service is enabled."
  value       = local.deploy_frontend_service ? aws_lb.frontend[0].dns_name : null
}

output "backend_public_url" {
  description = "Public backend API URL. Uses backend_domain over HTTPS after certificate validation is enabled, otherwise the backend ALB HTTP URL."
  value = local.deploy_app_stack && var.backend_service_enabled ? (
    local.backend_https_enabled ? local.backend_public_url : "http://${aws_lb.backend[0].dns_name}"
  ) : null
}

output "frontend_public_url" {
  description = "Public frontend URL. Uses frontend_domain over HTTPS after certificate validation is enabled, otherwise the frontend ALB HTTP URL."
  value = local.deploy_frontend_service ? (
    local.frontend_https_enabled ? local.frontend_public_url : "http://${aws_lb.frontend[0].dns_name}"
  ) : null
}

output "backend_domain" {
  description = "Configured backend API hostname, if any."
  value       = local.backend_domain
}

output "frontend_domain" {
  description = "Configured frontend hostname, if any."
  value       = local.frontend_domain
}

output "backend_acm_validation_records" {
  description = "DNS CNAME records to add for backend ACM certificate validation."
  value = local.deploy_app_stack && var.backend_service_enabled && local.backend_domain != "" ? [
    for option in aws_acm_certificate.backend[0].domain_validation_options : {
      name  = option.resource_record_name
      type  = option.resource_record_type
      value = option.resource_record_value
    }
  ] : []
}

output "frontend_acm_validation_records" {
  description = "DNS CNAME records to add for frontend ACM certificate validation."
  value = local.deploy_frontend_service && local.frontend_domain != "" ? [
    for option in aws_acm_certificate.frontend[0].domain_validation_options : {
      name  = option.resource_record_name
      type  = option.resource_record_type
      value = option.resource_record_value
    }
  ] : []
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
