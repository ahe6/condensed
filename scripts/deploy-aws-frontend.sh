#!/usr/bin/env bash
set -euo pipefail

profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"
frontend_image="${FRONTEND_IMAGE:-health/frontend}"
frontend_tag="${FRONTEND_TAG:-latest}"
apply_terraform=0
check_health=1

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-aws-frontend.sh [options]

Builds and deploys the frontend image to the AWS dev ECS service.

Options:
  --apply-terraform   Run terraform apply before building the image.
  --skip-health      Do not call the deployed frontend URL.
  -h, --help         Show this help.

Environment:
  AWS_PROFILE        AWS profile to use. Defaults to dev.
  AWS_REGION         AWS region to use. Defaults to us-east-2.
  TERRAFORM_DIR      Terraform dev env directory. Defaults to infra/envs/dev.
  FRONTEND_IMAGE     Local Docker image name. Defaults to health/frontend.
  FRONTEND_TAG       Image tag. Defaults to latest.
  FRONTEND_SERVICE   ECS service name. Defaults to <ecs_cluster_name>-frontend.
  FRONTEND_API_URL   Public API URL baked into the frontend. Defaults to backend_public_url.
                     Set to an empty string for a frontend-only deploy.
  FRONTEND_ENABLE_COGNITO
                     Set to 1 to force Cognito config into the image, 0 to force it off.
                     Defaults to auto, enabled only when frontend_public_url is HTTPS.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply-terraform)
      apply_terraform=1
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

read_env_var() {
  local file="$1"
  local key="$2"

  if [[ ! -f "$file" ]]; then
    return 0
  fi

  awk -F= -v key="$key" '$1 == key { value = substr($0, length(key) + 2); gsub(/^"|"$/, "", value); print value; exit }' "$file"
}

if [[ "$apply_terraform" == "1" ]]; then
  log "Applying Terraform in $terraform_dir"
  terraform -chdir="$terraform_dir" apply -auto-approve
fi

log "Reading Terraform outputs"
frontend_repository_url="$(optional_terraform_output frontend_ecr_repository_url)"

if [[ -z "$frontend_repository_url" || "$frontend_repository_url" == "null" ]]; then
  log "Creating frontend ECR repository prerequisites"
  terraform -chdir="$terraform_dir" apply -auto-approve -var frontend_service_enabled=false
  frontend_repository_url="$(terraform_output frontend_ecr_repository_url)"
fi

backend_public_url="$(optional_terraform_output backend_public_url)"
backend_dns="$(optional_terraform_output backend_load_balancer_dns_name)"
cluster="$(terraform_output ecs_cluster_name)"
cognito_domain="$(terraform_output cognito_hosted_ui_domain)"
cognito_client_id="$(terraform_output cognito_frontend_client_id)"
frontend_public_url="$(optional_terraform_output frontend_public_url)"
frontend_dns="$(optional_terraform_output frontend_load_balancer_dns_name)"
frontend_service="${FRONTEND_SERVICE:-${cluster}-frontend}"
stripe_publishable_key="${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-$(read_env_var "apps/frontend/.env.local" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")}"
api_url="${FRONTEND_API_URL-}"
cognito_build_domain=""
cognito_build_client_id=""

if [[ -z "${FRONTEND_API_URL+x}" ]]; then
  api_url="$backend_public_url"
fi

if [[ -z "$api_url" || "$api_url" == "null" ]]; then
  if [[ -n "$backend_dns" && "$backend_dns" != "null" ]]; then
    api_url="http://${backend_dns}"
  fi
fi

enable_cognito="${FRONTEND_ENABLE_COGNITO:-auto}"
if [[ "$enable_cognito" == "auto" ]]; then
  if [[ "$frontend_public_url" == https://* ]]; then
    enable_cognito=1
  else
    enable_cognito=0
  fi
fi

if [[ "$enable_cognito" == "1" ]]; then
  cognito_build_domain="$cognito_domain"
  cognito_build_client_id="$cognito_client_id"
fi

if [[ -z "$frontend_repository_url" || "$frontend_repository_url" == "null" ]]; then
  echo "frontend_ecr_repository_url is not available. Deploy the AWS app stack first." >&2
  exit 2
fi

if [[ -z "$api_url" || "$api_url" == "null" ]]; then
  echo "backend_public_url is not available; building frontend with an empty NEXT_PUBLIC_API_URL." >&2
  api_url=""
fi

log "Building frontend image $frontend_image:$frontend_tag"
docker build \
  -f apps/frontend/Dockerfile \
  --build-arg "NEXT_PUBLIC_API_URL=$api_url" \
  --build-arg "NEXT_PUBLIC_COGNITO_DOMAIN=$cognito_build_domain" \
  --build-arg "NEXT_PUBLIC_COGNITO_CLIENT_ID=$cognito_build_client_id" \
  --build-arg "NEXT_PUBLIC_COGNITO_REGION=$region" \
  --build-arg "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripe_publishable_key" \
  -t "$frontend_image:$frontend_tag" \
  .

log "Logging in to ECR"
registry="${frontend_repository_url%%/*}"
aws ecr get-login-password \
  --region "$region" \
  --profile "$profile" |
  docker login --username AWS --password-stdin "$registry"

log "Pushing frontend image to $frontend_repository_url:$frontend_tag"
docker tag "$frontend_image:$frontend_tag" "$frontend_repository_url:$frontend_tag"
docker push "$frontend_repository_url:$frontend_tag"

if [[ -z "$frontend_dns" || "$frontend_dns" == "null" ]]; then
  log "Applying Terraform frontend service resources"
  terraform -chdir="$terraform_dir" apply -auto-approve
  frontend_public_url="$(optional_terraform_output frontend_public_url)"
  frontend_dns="$(optional_terraform_output frontend_load_balancer_dns_name)"
fi

log "Forcing ECS deployment for $frontend_service"
aws ecs update-service \
  --cluster "$cluster" \
  --service "$frontend_service" \
  --force-new-deployment \
  --region "$region" \
  --profile "$profile" \
  --output json \
  --query 'service.{serviceName:serviceName,running:runningCount,pending:pendingCount,deployments:deployments[].{status:status,rollout:rolloutState,desired:desiredCount,running:runningCount}}'

log "Waiting for ECS service to become stable"
aws ecs wait services-stable \
  --cluster "$cluster" \
  --services "$frontend_service" \
  --region "$region" \
  --profile "$profile"

if [[ "$check_health" == "1" ]]; then
  if [[ -z "$frontend_public_url" || "$frontend_public_url" == "null" ]]; then
    if [[ -n "$frontend_dns" && "$frontend_dns" != "null" ]]; then
      frontend_public_url="http://${frontend_dns}"
    fi
  fi

  if [[ -z "$frontend_public_url" || "$frontend_public_url" == "null" ]]; then
    echo "frontend_public_url is not available; skipping health check." >&2
  else
    log "Checking $frontend_public_url"
    curl -fsS "$frontend_public_url" >/dev/null
    printf "Frontend is responding at %s\n" "$frontend_public_url"
  fi
fi

log "Frontend deploy complete"
