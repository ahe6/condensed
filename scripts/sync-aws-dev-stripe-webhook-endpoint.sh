#!/usr/bin/env bash
set -euo pipefail

env_file="${1:-.env.test}"
profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
webhook_url="${STRIPE_WEBHOOK_URL:-https://api-dev.condensedhealth.com/webhooks/stripe}"
webhook_secret_name="${STRIPE_WEBHOOK_SECRET_NAME:-health-dev-stripe-webhook-secret}"

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

stripe_api_key="$(read_env_var "$env_file" "STRIPE_API_KEY")"

if [[ -z "$stripe_api_key" ]]; then
  echo "Set STRIPE_API_KEY in $env_file" >&2
  exit 2
fi

existing_ids="$(
  curl -fsS -G https://api.stripe.com/v1/webhook_endpoints \
    -u "$stripe_api_key:" \
    --data-urlencode limit=100 |
    jq -r --arg url "$webhook_url" '.data[] | select(.url == $url) | .id'
)"

endpoint_json="$(
  curl -fsS https://api.stripe.com/v1/webhook_endpoints \
    -u "$stripe_api_key:" \
    -d "url=$webhook_url" \
    -d "description=health dev AWS backend" \
    -d "metadata[project]=health" \
    -d "metadata[environment]=dev" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=checkout.session.async_payment_succeeded" \
    -d "enabled_events[]=checkout.session.async_payment_failed" \
    -d "enabled_events[]=checkout.session.expired" \
    -d "enabled_events[]=charge.dispute.created" \
    -d "enabled_events[]=charge.dispute.updated" \
    -d "enabled_events[]=charge.dispute.closed"
)"

endpoint_id="$(jq -r '.id' <<<"$endpoint_json")"
webhook_secret="$(jq -r '.secret' <<<"$endpoint_json")"

if [[ -z "$endpoint_id" || "$endpoint_id" == "null" || -z "$webhook_secret" || "$webhook_secret" == "null" ]]; then
  echo "Failed to create Stripe webhook endpoint" >&2
  exit 1
fi

if aws secretsmanager describe-secret \
  --secret-id "$webhook_secret_name" \
  --region "$region" \
  --profile "$profile" >/dev/null 2>&1; then
  aws secretsmanager put-secret-value \
    --secret-id "$webhook_secret_name" \
    --secret-string "$webhook_secret" \
    --region "$region" \
    --profile "$profile" >/dev/null
else
  aws secretsmanager create-secret \
    --name "$webhook_secret_name" \
    --secret-string "$webhook_secret" \
    --region "$region" \
    --profile "$profile" >/dev/null
fi

while IFS= read -r old_endpoint_id; do
  if [[ -n "$old_endpoint_id" && "$old_endpoint_id" != "$endpoint_id" ]]; then
    curl -fsS -X DELETE "https://api.stripe.com/v1/webhook_endpoints/${old_endpoint_id}" \
      -u "$stripe_api_key:" >/dev/null
  fi
done <<<"$existing_ids"

set_env_var "$env_file" "STRIPE_WEBHOOK_SECRET" "$webhook_secret"
set_env_var "$env_file" "STRIPE_WEBHOOK_ENDPOINT_ID" "$endpoint_id"
set_env_var "apps/backend/.env" "STRIPE_WEBHOOK_SECRET" "$webhook_secret"

echo "Created Stripe webhook endpoint $endpoint_id"
echo "Forwarding Stripe test events to $webhook_url"
echo "Updated AWS Secrets Manager secret $webhook_secret_name"
echo "Updated $env_file and apps/backend/.env with the webhook signing secret"
