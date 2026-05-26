variable "aws_region" {
  description = "AWS region for bootstrap resources."
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

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform state."
  type        = string
}

