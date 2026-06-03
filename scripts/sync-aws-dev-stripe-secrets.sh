#!/usr/bin/env bash
set -euo pipefail

env_file="${1:-.env.test}"
profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"
frontend_env="${FRONTEND_ENV_FILE:-apps/frontend/.env.local}"
backend_env="${BACKEND_ENV_FILE:-apps/backend/.env}"

read_env_var() {
  local file="$1"
  local key="$2"

  if [[ ! -f "$file" ]]; then
    echo "Missing env file: $file" >&2
    exit 2
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

quote_env_value() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

set_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  local quoted_value
  local tmp

  quoted_value="$(quote_env_value "$value")"
  tmp="$(mktemp)"
  mkdir -p "$(dirname "$file")"

  if [[ -f "$file" ]]; then
    awk -v key="$key" -v line="${key}=${quoted_value}" '
      BEGIN { found = 0 }
      $0 ~ "^" key "=" {
        print line
        found = 1
        next
      }
      { print }
      END {
        if (!found) {
          print line
        }
      }
    ' "$file" > "$tmp"
  else
    printf '%s=%s\n' "$key" "$quoted_value" > "$tmp"
  fi

  mv "$tmp" "$file"
}

sync_secret() {
  local name="$1"
  local value="$2"
  local arn

  if aws secretsmanager describe-secret \
    --secret-id "$name" \
    --region "$region" \
    --profile "$profile" >/dev/null 2>&1; then
    aws secretsmanager put-secret-value \
      --secret-id "$name" \
      --secret-string "$value" \
      --region "$region" \
      --profile "$profile" >/dev/null
  else
    aws secretsmanager create-secret \
      --name "$name" \
      --secret-string "$value" \
      --region "$region" \
      --profile "$profile" >/dev/null
  fi

  arn="$(
    aws secretsmanager describe-secret \
      --secret-id "$name" \
      --region "$region" \
      --profile "$profile" \
      --query ARN \
      --output text
  )"

  printf '%s' "$arn"
}

set_tfvar() {
  local key="$1"
  local value="$2"
  local tfvars="${terraform_dir}/terraform.tfvars"
  local tmp

  tmp="$(mktemp)"

  if [[ -f "$tfvars" ]] && grep -qE "^[[:space:]]*${key}[[:space:]]*=" "$tfvars"; then
    awk -v key="$key" -v value="$value" '
      $0 ~ "^[[:space:]]*" key "[[:space:]]*=" {
        print key " = \"" value "\""
        next
      }
      { print }
    ' "$tfvars" > "$tmp"
  else
    if [[ -f "$tfvars" ]]; then
      cat "$tfvars" > "$tmp"
      printf '\n%s = "%s"\n' "$key" "$value" >> "$tmp"
    else
      printf '%s = "%s"\n' "$key" "$value" > "$tmp"
    fi
  fi

  mv "$tmp" "$tfvars"
}

stripe_api_key="$(read_env_var "$env_file" "STRIPE_API_KEY")"
stripe_webhook_secret="$(read_env_var "$env_file" "STRIPE_WEBHOOK_SECRET")"
stripe_publishable_key="$(read_env_var "$env_file" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")"

if [[ -z "$stripe_api_key" || -z "$stripe_webhook_secret" || -z "$stripe_publishable_key" ]]; then
  echo "Set STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in $env_file" >&2
  exit 2
fi

api_secret_name="health-dev-stripe-api-key"
webhook_secret_name="health-dev-stripe-webhook-secret"

api_secret_arn="$(sync_secret "$api_secret_name" "$stripe_api_key")"
webhook_secret_arn="$(sync_secret "$webhook_secret_name" "$stripe_webhook_secret")"

set_tfvar "stripe_api_key_secret_arn" "$api_secret_arn"
set_tfvar "stripe_webhook_secret_arn" "$webhook_secret_arn"
set_env_var "$frontend_env" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$stripe_publishable_key"
set_env_var "$backend_env" "STRIPE_API_KEY" "$stripe_api_key"
set_env_var "$backend_env" "STRIPE_WEBHOOK_SECRET" "$stripe_webhook_secret"

echo "Updated AWS Secrets Manager secrets:"
echo "- $api_secret_name"
echo "- $webhook_secret_name"
echo "Updated ${terraform_dir}/terraform.tfvars with Stripe secret ARNs"
echo "Updated $frontend_env and $backend_env from $env_file"
