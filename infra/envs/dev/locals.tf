locals {
  name_prefix = "${var.project}-${var.environment}"

  default_tags = {
    Project     = var.project
    ManagedBy   = "terraform"
    Environment = var.environment
  }
}

