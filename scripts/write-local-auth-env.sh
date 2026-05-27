#!/usr/bin/env bash
set -euo pipefail

terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"
backend_env="${BACKEND_ENV_FILE:-apps/backend/.env}"
frontend_env="${FRONTEND_ENV_FILE:-apps/frontend/.env.local}"
root_env="${ROOT_ENV_FILE:-.env}"

terraform_output() {
  terraform -chdir="$terraform_dir" output -raw "$1"
}

quote_env_value() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

ensure_env_file() {
  local target="$1"
  local example="$2"

  if [[ -f "$target" ]]; then
    return
  fi

  if [[ -f "$example" ]]; then
    cp "$example" "$target"
    return
  fi

  mkdir -p "$(dirname "$target")"
  touch "$target"
}

set_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  local quoted_value
  local tmp

  quoted_value="$(quote_env_value "$value")"
  tmp="$(mktemp)"

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

delete_env_var() {
  local file="$1"
  local key="$2"
  local tmp

  if [[ ! -f "$file" ]]; then
    return
  fi

  tmp="$(mktemp)"
  awk -v key="$key" '$0 !~ "^" key "=" { print }' "$file" > "$tmp"
  mv "$tmp" "$file"
}

read_env_var() {
  local file="$1"
  local key="$2"

  if [[ ! -f "$file" ]]; then
    return
  fi

  awk -F= -v key="$key" '$1 == key {
    value = substr($0, length(key) + 2)
    gsub(/^"/, "", value)
    gsub(/"$/, "", value)
    print value
    exit
  }' "$file"
}

cognito_issuer="$(terraform_output cognito_issuer)"
cognito_client_id="$(terraform_output cognito_frontend_client_id)"
cognito_domain="$(terraform_output cognito_hosted_ui_domain)"
cognito_region="$(terraform_output region)"
stripe_api_key="$(read_env_var "$root_env" "STRIPE_API_KEY")"
stripe_webhook_secret="$(read_env_var "$root_env" "STRIPE_WEBHOOK_SECRET")"
stripe_publishable_key="$(read_env_var "$root_env" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")"

if [[ -z "$cognito_issuer" || -z "$cognito_client_id" || -z "$cognito_domain" || -z "$cognito_region" ]]; then
  echo "Cognito Terraform outputs are missing. Run make dev-auth-apply first." >&2
  exit 1
fi

ensure_env_file "$backend_env" "apps/backend/.env.example"
ensure_env_file "$frontend_env" "apps/frontend/.env.example"

set_env_var "$backend_env" "COGNITO_ISSUER" "$cognito_issuer"
set_env_var "$backend_env" "COGNITO_CLIENT_ID" "$cognito_client_id"
if [[ -n "$stripe_api_key" ]]; then
  set_env_var "$backend_env" "STRIPE_API_KEY" "$stripe_api_key"
fi
if [[ -n "$stripe_webhook_secret" ]]; then
  set_env_var "$backend_env" "STRIPE_WEBHOOK_SECRET" "$stripe_webhook_secret"
fi

set_env_var "$frontend_env" "NEXT_PUBLIC_COGNITO_DOMAIN" "$cognito_domain"
set_env_var "$frontend_env" "NEXT_PUBLIC_COGNITO_CLIENT_ID" "$cognito_client_id"
set_env_var "$frontend_env" "NEXT_PUBLIC_COGNITO_REGION" "$cognito_region"
if [[ -n "$stripe_publishable_key" ]]; then
  set_env_var "$frontend_env" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$stripe_publishable_key"
fi
delete_env_var "$frontend_env" "NEXT_PUBLIC_COGNITO_REDIRECT_URI"
delete_env_var "$frontend_env" "NEXT_PUBLIC_COGNITO_LOGOUT_URI"

echo "Updated $backend_env"
echo "Updated $frontend_env"
