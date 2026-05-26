locals {
  default_tags = {
    Project     = var.project
    ManagedBy   = "terraform"
    Environment = "bootstrap"
  }
}

