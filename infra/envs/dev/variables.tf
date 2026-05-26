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

variable "backend_service_enabled" {
  description = "Whether to run the backend ECS service and public load balancer."
  type        = bool
  default     = false
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
