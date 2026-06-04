#!/usr/bin/env bash
set -euo pipefail

terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"
default_backend_url="${DEV_BACKEND_URL:-https://api-dev.condensedhealth.com}"
frontend_env="${FRONTEND_ENV_FILE:-apps/frontend/.env.local}"
test_env="${TEST_ENV_FILE:-.env.test}"

usage() {
  cat <<'USAGE'
Usage: scripts/frontend-dev-aws.sh

Starts the local Next.js frontend on localhost:3001, pointed at the AWS dev
backend, Cognito app client, and Stripe publishable key.

Environment:
  TERRAFORM_DIR      Terraform dev env directory. Defaults to infra/envs/dev.
  DEV_BACKEND_URL    Fallback backend URL. Defaults to https://api-dev.condensedhealth.com.
  FRONTEND_ENV_FILE  Local frontend env file fallback. Defaults to apps/frontend/.env.local.
  TEST_ENV_FILE      Test env fallback for Stripe publishable key. Defaults to .env.test.
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

read_env_var() {
  local file="$1"
  local key="$2"

  if [[ ! -f "$file" ]]; then
    return 0
  fi

  awk -F= -v key="$key" '$1 == key {
    value = substr($0, length(key) + 2)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
    gsub(/^"/, "", value)
    gsub(/"$/, "", value)
    print value
    exit
  }' "$file"
}

terraform_output() {
  terraform -chdir="$terraform_dir" output -raw "$1" 2>/dev/null || true
}

backend_url="$(terraform_output backend_public_url)"
cognito_domain="$(terraform_output cognito_hosted_ui_domain)"
cognito_client_id="$(terraform_output cognito_frontend_client_id)"
cognito_region="$(terraform_output region)"

if [[ -z "$backend_url" || "$backend_url" == "null" ]]; then
  backend_url="$default_backend_url"
fi

if [[ -z "$cognito_domain" || "$cognito_domain" == "null" ]]; then
  cognito_domain="$(read_env_var "$frontend_env" NEXT_PUBLIC_COGNITO_DOMAIN)"
fi

if [[ -z "$cognito_client_id" || "$cognito_client_id" == "null" ]]; then
  cognito_client_id="$(read_env_var "$frontend_env" NEXT_PUBLIC_COGNITO_CLIENT_ID)"
fi

if [[ -z "$cognito_region" || "$cognito_region" == "null" ]]; then
  cognito_region="$(read_env_var "$frontend_env" NEXT_PUBLIC_COGNITO_REGION)"
fi

stripe_publishable_key="${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}"
if [[ -z "$stripe_publishable_key" ]]; then
  stripe_publishable_key="$(read_env_var "$frontend_env" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"
fi
if [[ -z "$stripe_publishable_key" ]]; then
  stripe_publishable_key="$(read_env_var "$test_env" NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"
fi

export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-$backend_url}"
export NEXT_PUBLIC_COGNITO_DOMAIN="${NEXT_PUBLIC_COGNITO_DOMAIN:-$cognito_domain}"
export NEXT_PUBLIC_COGNITO_CLIENT_ID="${NEXT_PUBLIC_COGNITO_CLIENT_ID:-$cognito_client_id}"
export NEXT_PUBLIC_COGNITO_REGION="${NEXT_PUBLIC_COGNITO_REGION:-${cognito_region:-us-east-2}}"
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-$stripe_publishable_key}"

echo "[frontend-dev-aws] NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
echo "[frontend-dev-aws] NEXT_PUBLIC_COGNITO_DOMAIN=$NEXT_PUBLIC_COGNITO_DOMAIN"
echo "[frontend-dev-aws] NEXT_PUBLIC_COGNITO_CLIENT_ID=$NEXT_PUBLIC_COGNITO_CLIENT_ID"
echo "[frontend-dev-aws] NEXT_PUBLIC_COGNITO_REGION=$NEXT_PUBLIC_COGNITO_REGION"
if [[ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]]; then
  echo "[frontend-dev-aws] warning: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is empty" >&2
fi

exec npm run frontend:dev
