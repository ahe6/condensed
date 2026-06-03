locals {
  deploy_app_stack        = var.deploy_app_stack
  deploy_jobs_stack       = var.deploy_app_stack && var.deploy_jobs_stack
  deploy_frontend_service = var.deploy_app_stack && var.frontend_service_enabled
  frontend_domain         = trimspace(var.frontend_domain)
  backend_domain          = trimspace(var.backend_domain)
  frontend_base_url       = local.frontend_domain != "" ? "https://${local.frontend_domain}" : var.app_base_url
  backend_app_base_url    = local.frontend_https_enabled ? local.frontend_base_url : var.app_base_url
  backend_public_url      = local.backend_domain != "" ? "https://${local.backend_domain}" : null
  frontend_public_url     = local.frontend_domain != "" ? local.frontend_base_url : null
  backend_https_enabled   = local.deploy_app_stack && var.backend_service_enabled && local.backend_domain != "" && var.validate_domain_certificates
  frontend_https_enabled  = local.deploy_frontend_service && local.frontend_domain != "" && var.validate_domain_certificates
  auth_callback_urls      = distinct(concat(var.auth_callback_urls, local.frontend_domain != "" ? ["${local.frontend_base_url}/auth/callback"] : []))
  auth_logout_urls        = distinct(concat(var.auth_logout_urls, local.frontend_domain != "" ? [local.frontend_base_url] : []))
  name_prefix             = "${var.project}-${var.environment}"
  cognito_domain_prefix   = "${local.name_prefix}-${data.aws_caller_identity.current.account_id}"

  default_tags = {
    Project     = var.project
    ManagedBy   = "terraform"
    Environment = var.environment
  }
}
