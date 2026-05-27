locals {
  deploy_app_stack      = var.deploy_app_stack
  name_prefix           = "${var.project}-${var.environment}"
  cognito_domain_prefix = "${local.name_prefix}-${data.aws_caller_identity.current.account_id}"

  default_tags = {
    Project     = var.project
    ManagedBy   = "terraform"
    Environment = var.environment
  }
}
