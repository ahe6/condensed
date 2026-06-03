#!/usr/bin/env bash
set -euo pipefail

profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"
backend_image="${BACKEND_IMAGE:-health/backend}"
backend_tag="${BACKEND_TAG:-latest}"
apply_terraform=0
run_migrations=1
check_health=1

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-aws-backend.sh [options]

Builds and deploys the backend image to the AWS dev ECS service.

Options:
  --apply-terraform   Run terraform apply before building the image.
  --skip-migrations  Do not run the one-off AWS migration task.
  --skip-health      Do not call the deployed /health endpoint.
  -h, --help         Show this help.

Environment:
  AWS_PROFILE        AWS profile to use. Defaults to dev.
  AWS_REGION         AWS region to use. Defaults to us-east-2.
  TERRAFORM_DIR      Terraform dev env directory. Defaults to infra/envs/dev.
  BACKEND_IMAGE      Local Docker image name. Defaults to health/backend.
  BACKEND_TAG        Image tag. Defaults to latest.
  BACKEND_SERVICE    ECS service name. Defaults to <ecs_cluster_name>-backend.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply-terraform)
      apply_terraform=1
      shift
      ;;
    --skip-migrations)
      run_migrations=0
      shift
      ;;
    --skip-health)
      check_health=0
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

log() {
  printf "\n==> %s\n" "$*"
}

terraform_output() {
  terraform -chdir="$terraform_dir" output -raw "$1"
}

optional_terraform_output() {
  terraform -chdir="$terraform_dir" output -raw "$1" 2>/dev/null || true
}

if [[ "$apply_terraform" == "1" ]]; then
  log "Applying Terraform in $terraform_dir"
  terraform -chdir="$terraform_dir" apply -auto-approve
fi

log "Reading Terraform outputs"
backend_repository_url="$(terraform_output backend_ecr_repository_url)"
cluster="$(terraform_output ecs_cluster_name)"
public_url="$(optional_terraform_output backend_public_url)"
load_balancer_dns="$(optional_terraform_output backend_load_balancer_dns_name)"
backend_service="${BACKEND_SERVICE:-${cluster}-backend}"

if [[ -z "$backend_repository_url" || "$backend_repository_url" == "null" ]]; then
  echo "backend_ecr_repository_url is not available. Deploy the AWS app stack first." >&2
  exit 2
fi

if [[ -z "$cluster" || "$cluster" == "null" ]]; then
  echo "ecs_cluster_name is not available. Deploy the AWS app stack first." >&2
  exit 2
fi

log "Building backend image $backend_image:$backend_tag"
docker build -f apps/backend/Dockerfile -t "$backend_image:$backend_tag" .

log "Logging in to ECR"
registry="${backend_repository_url%%/*}"
aws ecr get-login-password \
  --region "$region" \
  --profile "$profile" |
  docker login --username AWS --password-stdin "$registry"

log "Pushing backend image to $backend_repository_url:$backend_tag"
docker tag "$backend_image:$backend_tag" "$backend_repository_url:$backend_tag"
docker push "$backend_repository_url:$backend_tag"

if [[ "$run_migrations" == "1" ]]; then
  log "Running AWS database migrations"
  AWS_PROFILE="$profile" AWS_REGION="$region" TERRAFORM_DIR="$terraform_dir" scripts/run-aws-migration.sh
fi

log "Forcing ECS deployment for $backend_service"
aws ecs update-service \
  --cluster "$cluster" \
  --service "$backend_service" \
  --force-new-deployment \
  --region "$region" \
  --profile "$profile" \
  --output json \
  --query 'service.{serviceName:serviceName,running:runningCount,pending:pendingCount,deployments:deployments[].{status:status,rollout:rolloutState,desired:desiredCount,running:runningCount}}'

log "Waiting for ECS service to become stable"
aws ecs wait services-stable \
  --cluster "$cluster" \
  --services "$backend_service" \
  --region "$region" \
  --profile "$profile"

if [[ "$check_health" == "1" ]]; then
  if [[ -z "$public_url" || "$public_url" == "null" ]]; then
    if [[ -n "$load_balancer_dns" && "$load_balancer_dns" != "null" ]]; then
      public_url="http://${load_balancer_dns}"
    fi
  fi

  if [[ -z "$public_url" || "$public_url" == "null" ]]; then
    echo "backend_public_url is not available; skipping health check." >&2
  else
    health_url="${public_url%/}/health"
    log "Checking $health_url"
    curl -fsS "$health_url"
    printf "\n"
  fi
fi

log "Backend deploy complete"
