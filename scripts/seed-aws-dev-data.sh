#!/usr/bin/env bash
set -euo pipefail

scripts/run-aws-backend-oneoff.sh \
  npm --workspace apps/backend run db:seed-dev-data
