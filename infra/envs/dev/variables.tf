variable "aws_region" {
  description = "AWS region for dev resources."
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "Local AWS CLI profile used by Terraform."
  type        = string
  default     = "dev"
}

variable "project" {
  description = "Short project name used in resource names and tags."
  type        = string
  default     = "tele"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "vpc_cidr_block" {
  description = "CIDR block for the dev VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "db_subnet_cidr_blocks" {
  description = "Private subnet CIDR blocks used by RDS. Provide at least two, in different AZs."
  type        = list(string)
  default     = ["10.20.10.0/24", "10.20.11.0/24"]

  validation {
    condition     = length(var.db_subnet_cidr_blocks) >= 2
    error_message = "RDS requires at least two subnet CIDR blocks."
  }
}

variable "app_subnet_cidr_blocks" {
  description = "Public subnet CIDR blocks used by application load balancers and ECS tasks."
  type        = list(string)
  default     = ["10.20.20.0/24", "10.20.21.0/24"]

  validation {
    condition     = length(var.app_subnet_cidr_blocks) >= 2
    error_message = "Application load balancing requires at least two subnet CIDR blocks."
  }
}

variable "postgres_db_name" {
  description = "Initial Postgres database name."
  type        = string
  default     = "tele"
}

variable "postgres_username" {
  description = "Postgres master username. AWS manages the password in Secrets Manager."
  type        = string
  default     = "tele_admin"
}

variable "postgres_instance_class" {
  description = "RDS instance class for Postgres."
  type        = string
  default     = "db.t4g.micro"
}

variable "postgres_allocated_storage_gb" {
  description = "Initial allocated storage for Postgres in GB."
  type        = number
  default     = 20
}

variable "postgres_max_allocated_storage_gb" {
  description = "Maximum storage autoscaling limit for Postgres in GB."
  type        = number
  default     = 100
}

variable "postgres_backup_retention_days" {
  description = "Number of days to retain automated Postgres backups."
  type        = number
  default     = 7
}

variable "allowed_postgres_cidr_blocks" {
  description = "CIDR blocks allowed to connect to Postgres. Keep empty until a backend or VPN path exists."
  type        = set(string)
  default     = []
}

variable "deploy_app_stack" {
  description = "Whether to deploy network, RDS, ECR, ECS, and backend infrastructure. Set false to deploy Cognito only."
  type        = bool
  default     = true
}

variable "backend_service_enabled" {
  description = "Whether to run the backend ECS service and public load balancer."
  type        = bool
  default     = false
}

variable "deploy_jobs_stack" {
  description = "Whether to deploy scheduled backend jobs. Requires deploy_app_stack because jobs run in ECS against private RDS."
  type        = bool
  default     = false
}

variable "orders_expiry_enabled" {
  description = "Whether the unpaid-order expiry schedule is enabled."
  type        = bool
  default     = true
}

variable "orders_expiry_schedule_expression" {
  description = "EventBridge Scheduler expression for unpaid-order expiry."
  type        = string
  default     = "rate(15 minutes)"
}

variable "orders_expiry_minutes" {
  description = "Age in minutes before unpaid orders are eligible for expiry."
  type        = number
  default     = 15
}

variable "orders_expiry_batch_size" {
  description = "Maximum number of unpaid orders to expire per scheduled run."
  type        = number
  default     = 50
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy for the backend ECS service."
  type        = string
  default     = "latest"
}

variable "backend_container_port" {
  description = "Port exposed by the backend container."
  type        = number
  default     = 3000
}

variable "backend_desired_count" {
  description = "Number of backend ECS tasks to run."
  type        = number
  default     = 1
}

variable "backend_cpu" {
  description = "Backend ECS task CPU units."
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Backend ECS task memory in MiB."
  type        = number
  default     = 512
}

variable "stripe_api_key_secret_arn" {
  description = "Optional Secrets Manager ARN containing STRIPE_API_KEY for deployed backend tasks."
  type        = string
  default     = ""
}

variable "stripe_webhook_secret_arn" {
  description = "Optional Secrets Manager ARN containing STRIPE_WEBHOOK_SECRET for deployed backend service tasks."
  type        = string
  default     = ""
}

variable "email_provider" {
  description = "Backend email provider. Use none to record notification events without sending email."
  type        = string
  default     = "none"

  validation {
    condition     = contains(["none", "ses"], var.email_provider)
    error_message = "email_provider must be none or ses."
  }
}

variable "email_from" {
  description = "Sender email address for deployed backend email notifications."
  type        = string
  default     = ""
}

variable "app_base_url" {
  description = "Public frontend base URL used in customer notification links."
  type        = string
  default     = "http://localhost:3001"
}

variable "ses_identity_arn" {
  description = "Optional SES identity ARN allowed for sending email. Leave empty to allow SES send actions on all identities in dev."
  type        = string
  default     = ""
}

variable "auth_callback_urls" {
  description = "Allowed Cognito Hosted UI callback URLs."
  type        = list(string)
  default = [
    "http://localhost:3001/auth/callback",
    "http://127.0.0.1:3001/auth/callback"
  ]
}

variable "auth_logout_urls" {
  description = "Allowed Cognito Hosted UI logout URLs."
  type        = list(string)
  default = [
    "http://localhost:3001",
    "http://127.0.0.1:3001"
  ]
}
