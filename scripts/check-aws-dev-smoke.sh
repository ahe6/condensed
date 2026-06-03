#!/usr/bin/env bash
set -euo pipefail

profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"
env_file="${STRIPE_ENV_FILE:-.env.test}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

pass() {
  echo "PASS: $*"
}

terraform_output() {
  terraform -chdir="$terraform_dir" output -raw "$1"
}

read_env_var() {
  local file="$1"
  local key="$2"

  [[ -f "$file" ]] || fail "Missing env file: $file"

  awk -F= -v key="$key" '$1 == key {
    value = substr($0, length(key) + 2)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
    gsub(/^"/, "", value)
    gsub(/"$/, "", value)
    print value
    exit
  }' "$file"
}

require_jq() {
  command -v jq >/dev/null || fail "jq is required"
}

require_jq

backend_url="$(terraform_output backend_public_url)"
frontend_url="$(terraform_output frontend_public_url)"
cluster="$(terraform_output ecs_cluster_name)"
user_pool_id="$(terraform_output cognito_user_pool_id)"
cognito_client_id="$(terraform_output cognito_frontend_client_id)"
stripe_api_key="$(read_env_var "$env_file" "STRIPE_API_KEY")"
stripe_webhook_endpoint_id="$(read_env_var "$env_file" "STRIPE_WEBHOOK_ENDPOINT_ID")"

[[ "$backend_url" == https://* ]] || fail "backend_public_url is not HTTPS: $backend_url"
[[ "$frontend_url" == https://* ]] || fail "frontend_public_url is not HTTPS: $frontend_url"
pass "Terraform public URLs are HTTPS"

[[ "$(curl -fsS "$backend_url/health" | jq -r '.ok')" == "true" ]] || fail "backend /health failed"
[[ "$(curl -fsS "$backend_url/ready" | jq -r '.ok')" == "true" ]] || fail "backend /ready failed"
pass "Backend health and readiness are OK"

frontend_status="$(curl -sS -o /dev/null -w '%{http_code}' "$frontend_url/cart")"
[[ "$frontend_status" == "200" ]] || fail "frontend /cart returned $frontend_status"
pass "Frontend /cart returns 200"

products_json="$(curl -fsS "$backend_url/products")"
dev_mug_count="$(jq '[.[] | select(.slug == "dev-mug" and .status == "ACTIVE")] | length' <<<"$products_json")"
dev_mug_inventory="$(jq '[.[] | select(.slug == "dev-mug") | .variants[] | select(.sku == "DEV-MUG-001") | .inventoryQuantity] | first // 0' <<<"$products_json")"
[[ "$dev_mug_count" == "1" ]] || fail "dev-mug active product not found"
[[ "$dev_mug_inventory" -gt 0 ]] || fail "DEV-MUG-001 inventory is not positive"
pass "Seeded dev catalog is available"

services_json="$(
  aws ecs describe-services \
    --cluster "$cluster" \
    --services "${cluster}-backend" "${cluster}-frontend" \
    --region "$region" \
    --profile "$profile" \
    --output json
)"

service_count="$(jq '.services | length' <<<"$services_json")"
[[ "$service_count" == "2" ]] || fail "Expected 2 ECS services, found $service_count"

jq -e '.services[] | select(.serviceName | endswith("-backend")) | select(.runningCount == .desiredCount and .pendingCount == 0 and (.deployments | length == 1) and .deployments[0].rolloutState == "COMPLETED")' <<<"$services_json" >/dev/null ||
  fail "Backend ECS service is not fully stable"
jq -e '.services[] | select(.serviceName | endswith("-frontend")) | select(.runningCount == .desiredCount and .pendingCount == 0 and (.deployments | length == 1) and .deployments[0].rolloutState == "COMPLETED")' <<<"$services_json" >/dev/null ||
  fail "Frontend ECS service is not fully stable"
pass "Backend and frontend ECS services are stable"

backend_task_definition="$(jq -r '.services[] | select(.serviceName | endswith("-backend")) | .taskDefinition' <<<"$services_json")"
backend_secrets="$(
  aws ecs describe-task-definition \
    --task-definition "$backend_task_definition" \
    --region "$region" \
    --profile "$profile" \
    --query 'taskDefinition.containerDefinitions[0].secrets[].name' \
    --output json
)"

jq -e 'index("DB_SECRET_JSON") and index("STRIPE_API_KEY") and index("STRIPE_WEBHOOK_SECRET")' <<<"$backend_secrets" >/dev/null ||
  fail "Backend task definition is missing required secrets"
pass "Backend ECS task has DB and Stripe secrets"

orders_secrets="$(
  aws ecs describe-task-definition \
    --task-definition "${cluster}-orders-expiry" \
    --region "$region" \
    --profile "$profile" \
    --query 'taskDefinition.containerDefinitions[0].secrets[].name' \
    --output json
)"

jq -e 'index("DB_SECRET_JSON") and index("STRIPE_API_KEY")' <<<"$orders_secrets" >/dev/null ||
  fail "Orders expiry task definition is missing required secrets"
pass "Orders expiry task has DB and Stripe API secrets"

cognito_client_json="$(
  aws cognito-idp describe-user-pool-client \
    --user-pool-id "$user_pool_id" \
    --client-id "$cognito_client_id" \
    --region "$region" \
    --profile "$profile" \
    --output json
)"

jq -e --arg url "${frontend_url}/auth/callback" '.UserPoolClient.CallbackURLs | index($url)' <<<"$cognito_client_json" >/dev/null ||
  fail "Cognito callback URL is missing deployed frontend callback"
jq -e --arg url "$frontend_url" '.UserPoolClient.LogoutURLs | index($url)' <<<"$cognito_client_json" >/dev/null ||
  fail "Cognito logout URL is missing deployed frontend URL"
pass "Cognito deployed callback/logout URLs are registered"

[[ -n "$stripe_api_key" ]] || fail "STRIPE_API_KEY is missing in $env_file"
[[ -n "$stripe_webhook_endpoint_id" ]] || fail "STRIPE_WEBHOOK_ENDPOINT_ID is missing in $env_file"

stripe_webhook_json="$(
  curl -fsS "https://api.stripe.com/v1/webhook_endpoints/${stripe_webhook_endpoint_id}" \
    -u "$stripe_api_key:"
)"

jq -e --arg url "${backend_url}/webhooks/stripe" '.status == "enabled" and .url == $url and (.enabled_events | index("checkout.session.completed"))' <<<"$stripe_webhook_json" >/dev/null ||
  fail "Stripe webhook endpoint is not enabled for deployed backend checkout events"
pass "Stripe webhook endpoint is enabled for deployed backend"

echo "AWS dev smoke wiring check passed."
