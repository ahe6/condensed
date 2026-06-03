#!/usr/bin/env bash
set -euo pipefail

seed_after_reset=0

case "${1:-}" in
  --yes)
    shift
    ;;
  *)
    echo "Usage: $0 --yes [--seed]" >&2
    echo "This resets AWS dev app data in RDS but leaves infrastructure running." >&2
    exit 2
    ;;
esac

case "${1:-}" in
  --seed)
    seed_after_reset=1
    shift
    ;;
  "")
    ;;
  *)
    echo "Unknown option: $1" >&2
    exit 2
    ;;
esac

if [[ $# -ne 0 ]]; then
  echo "Too many arguments" >&2
  exit 2
fi

env_json='[{"name":"CONFIRM_DEV_DATA_RESET","value":"health-dev"}]'

CONTAINER_ENV_JSON="$env_json" scripts/run-aws-backend-oneoff.sh \
  npm --workspace apps/backend run db:reset-dev-data

if [[ "$seed_after_reset" == "1" ]]; then
  scripts/seed-aws-dev-data.sh
fi
