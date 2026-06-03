#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <email>" >&2
  exit 2
fi

email="$1"

if [[ ! "$email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+$ ]]; then
  echo "Invalid email: $email" >&2
  exit 2
fi

env_json="$(node -e 'console.log(JSON.stringify([{ name: "RESET_EMAIL", value: process.argv[1].toLowerCase() }]))' "$email")"

CONTAINER_ENV_JSON="$env_json" scripts/run-aws-backend-oneoff.sh \
  npm --workspace apps/backend run db:reset-dev-user

scripts/delete-cognito-user.sh "$email"
