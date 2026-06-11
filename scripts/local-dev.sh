#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

backend_url="${BACKEND_URL:-http://127.0.0.1:3000}"
frontend_url="${FRONTEND_URL:-http://localhost:3001}"
stripe_webhook_url="${STRIPE_WEBHOOK_URL:-http://127.0.0.1:3000/webhooks/stripe}"
log_dir="${LOG_DIR:-/tmp}"
backend_log="${BACKEND_LOG:-$log_dir/health-backend.log}"
frontend_log="${FRONTEND_LOG:-$log_dir/health-frontend.log}"
stripe_log="${STRIPE_LOG:-$log_dir/health-stripe-listen.log}"
start_stripe="${START_STRIPE:-auto}"
apply_migrations=1
restart=0
service_pids=()

usage() {
  cat <<'EOF'
Usage: scripts/local-dev.sh [options]

Starts the local development stack:
  - Docker Postgres
  - Prisma migrations
  - Fastify backend on 127.0.0.1:3000
  - Next.js frontend on localhost:3001
  - Stripe CLI webhook listener when available

Options:
  --restart          Stop existing backend/frontend/Stripe dev processes first.
  --no-stripe        Do not refresh or start the Stripe CLI listener.
  --require-stripe   Fail if the Stripe CLI listener cannot be started.
  --skip-migrations  Do not run local Prisma migrations.
  -h, --help         Show this help.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --restart)
      restart=1
      ;;
    --no-stripe)
      start_stripe=0
      ;;
    --require-stripe)
      start_stripe=1
      ;;
    --skip-migrations)
      apply_migrations=0
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
  shift
done

log() {
  printf '[local-dev] %s\n' "$*"
}

warn() {
  printf '[local-dev] warning: %s\n' "$*" >&2
}

cleanup_services() {
  if [ "${#service_pids[@]}" -eq 0 ]; then
    return 0
  fi

  log "Stopping local dev processes"
  kill "${service_pids[@]}" >/dev/null 2>&1 || true
}

trap 'cleanup_services; exit 130' INT
trap 'cleanup_services; exit 143' TERM

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

url_ready() {
  curl -fsS "$1" >/dev/null 2>&1
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local seconds="$3"
  local log_file="$4"

  for _ in $(seq 1 "$seconds"); do
    if url_ready "$url"; then
      log "$name is ready at $url"
      return 0
    fi
    sleep 1
  done

  echo "$name did not become ready at $url within ${seconds}s." >&2
  echo "Last log lines from $log_file:" >&2
  tail -n 80 "$log_file" >&2 || true
  exit 1
}

wait_for_postgres() {
  for _ in $(seq 1 45); do
    if docker compose exec -T postgres pg_isready -U health_admin -d health >/dev/null 2>&1; then
      log "Postgres is ready"
      return 0
    fi
    sleep 1
  done

  echo "Postgres did not become ready within 45s." >&2
  docker compose ps >&2 || true
  exit 1
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  touch "$file"

  if grep -q "^${key}=" "$file"; then
    KEY="$key" VALUE="$value" perl -0pi -e 's/^\Q$ENV{KEY}\E=.*/$ENV{KEY}=$ENV{VALUE}/m' "$file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

stop_existing_processes() {
  log "Stopping existing local backend, frontend, and Stripe listener processes"
  pkill -f "tsx watch src/index.ts" >/dev/null 2>&1 || true
  pkill -f "next dev .*3001" >/dev/null 2>&1 || true
  pkill -f "stripe listen --forward-to ${stripe_webhook_url}" >/dev/null 2>&1 || true
}

start_background_service() {
  local name="$1"
  local ready_url="$2"
  local log_file="$3"
  shift 3

  if url_ready "$ready_url"; then
    log "$name is already running at $ready_url"
    return 0
  fi

  mkdir -p "$(dirname "$log_file")"
  : > "$log_file"
  log "Starting $name; logs: $log_file"
  "$@" > "$log_file" 2>&1 &
  local pid="$!"
  service_pids+=("$pid")
  log "$name pid $pid"
}

sync_stripe_secret() {
  if [ "$start_stripe" = "0" ]; then
    log "Skipping Stripe listener"
    return 0
  fi

  if ! command -v stripe >/dev/null 2>&1; then
    if [ "$start_stripe" = "1" ]; then
      echo "Stripe CLI is required but not installed." >&2
      exit 1
    fi

    warn "Stripe CLI not found; Stripe webhooks will not be forwarded"
    start_stripe=0
    return 0
  fi

  log "Refreshing local Stripe webhook signing secret"

  local secret
  if ! secret="$(stripe listen --forward-to "$stripe_webhook_url" --print-secret 2>/tmp/health-stripe-secret.log)"; then
    if [ "$start_stripe" = "1" ]; then
      cat /tmp/health-stripe-secret.log >&2 || true
      exit 1
    fi

    warn "Could not get Stripe webhook secret; run stripe login or use --no-stripe"
    start_stripe=0
    return 0
  fi

  if [ -z "$secret" ]; then
    if [ "$start_stripe" = "1" ]; then
      echo "Stripe CLI returned an empty webhook secret." >&2
      exit 1
    fi

    warn "Stripe CLI returned an empty webhook secret; skipping listener"
    start_stripe=0
    return 0
  fi

  set_env_value ".env" "STRIPE_WEBHOOK_SECRET" "$secret"
  set_env_value "apps/backend/.env" "STRIPE_WEBHOOK_SECRET" "$secret"
  log "Updated STRIPE_WEBHOOK_SECRET in .env and apps/backend/.env"
}

start_stripe_listener() {
  if [ "$start_stripe" = "0" ]; then
    return 0
  fi

  if pgrep -f "stripe listen --forward-to ${stripe_webhook_url}" >/dev/null 2>&1; then
    log "Stripe listener is already running"
    return 0
  fi

  mkdir -p "$(dirname "$stripe_log")"
  : > "$stripe_log"
  log "Starting Stripe listener; logs: $stripe_log"
  stripe listen --forward-to "$stripe_webhook_url" > "$stripe_log" 2>&1 &
  local pid="$!"
  service_pids+=("$pid")
  log "Stripe listener pid $pid"
  sleep 3

  if ! pgrep -f "stripe listen --forward-to ${stripe_webhook_url}" >/dev/null 2>&1; then
    if [ "$start_stripe" = "1" ]; then
      tail -n 80 "$stripe_log" >&2 || true
      exit 1
    fi

    warn "Stripe listener did not stay running"
    tail -n 40 "$stripe_log" >&2 || true
  fi
}

require_command docker
require_command npm
require_command curl

if [ "$restart" = "1" ]; then
  stop_existing_processes
fi

log "Starting Docker Postgres"
docker compose up -d postgres
wait_for_postgres

if [ ! -d node_modules ]; then
  log "Installing npm dependencies"
  npm install
fi

if [ "$apply_migrations" = "1" ]; then
  log "Applying local Prisma migrations"
  npm run db:deploy
fi

sync_stripe_secret

if url_ready "$backend_url/ready" && [ "$restart" != "1" ] && [ "$start_stripe" != "0" ]; then
  warn "Backend is already running; use make local-dev-restart if Stripe webhook signatures do not match."
fi

start_background_service "backend" "$backend_url/ready" "$backend_log" npm run backend:dev
wait_for_url "backend" "$backend_url/ready" 45 "$backend_log"

start_background_service "frontend" "$frontend_url" "$frontend_log" npm run frontend:dev
wait_for_url "frontend" "$frontend_url" 60 "$frontend_log"

start_stripe_listener

cat <<EOF

Local dev is running.

Backend:  $backend_url
Shop:     $frontend_url
Cart:     $frontend_url/cart
Admin:    $frontend_url/admin

Logs:
Backend:  $backend_log
Frontend: $frontend_log
Stripe:   $stripe_log

Stop app processes:
  pkill -f "tsx watch src/index.ts"
  pkill -f "next dev .*3001"
  pkill -f "stripe listen --forward-to ${stripe_webhook_url}"

Stop Postgres:
  docker compose stop postgres
EOF

if [ "${#service_pids[@]}" -gt 0 ]; then
  log "Local dev command is attached. Press Ctrl+C to stop backend, frontend, and Stripe listener."
  wait "${service_pids[@]}"
fi
