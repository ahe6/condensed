#!/usr/bin/env bash
set -euo pipefail

profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"
confirm="${CONFIRM:-}"

if [[ "$confirm" != "health-dev" ]]; then
  echo "Usage: CONFIRM=health-dev $0" >&2
  echo "This resets AWS dev app data, syncs Stripe test credentials/webhook, applies Terraform, rolls backend, and deploys frontend." >&2
  exit 2
fi

cluster="$(terraform -chdir="$terraform_dir" output -raw ecs_cluster_name)"

echo "==> Resetting and seeding AWS dev app data"
AWS_PROFILE="$profile" AWS_REGION="$region" TERRAFORM_DIR="$terraform_dir" scripts/reset-aws-dev-data.sh --yes --seed

echo "==> Syncing Stripe test secrets from .env.test"
AWS_PROFILE="$profile" AWS_REGION="$region" TERRAFORM_DIR="$terraform_dir" scripts/sync-aws-dev-stripe-secrets.sh .env.test

echo "==> Ensuring Stripe webhook endpoint points at AWS dev"
AWS_PROFILE="$profile" AWS_REGION="$region" scripts/sync-aws-dev-stripe-webhook-endpoint.sh .env.test

echo "==> Applying Terraform"
terraform -chdir="$terraform_dir" apply -auto-approve

echo "==> Rolling backend to pick up current Secrets Manager values"
aws ecs update-service \
  --cluster "$cluster" \
  --service "${cluster}-backend" \
  --force-new-deployment \
  --region "$region" \
  --profile "$profile" >/dev/null

aws ecs wait services-stable \
  --cluster "$cluster" \
  --services "${cluster}-backend" \
  --region "$region" \
  --profile "$profile"

echo "==> Deploying frontend with current build-time public env"
AWS_PROFILE="$profile" AWS_REGION="$region" TERRAFORM_DIR="$terraform_dir" make frontend-deploy-aws

echo "AWS dev smoke preparation complete."
