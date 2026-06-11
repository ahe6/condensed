#!/usr/bin/env bash
set -euo pipefail

delete_cognito=0

usage() {
  cat <<'EOF'
Usage: scripts/reset-local-dev-user-auth.sh [--delete-cognito] <email>

Clears the local app DB users.externalAuthId value for one dev email.

Options:
  --delete-cognito  Also delete the matching Cognito user from the AWS dev user pool.

This does not delete local app rows such as orders, addresses, carts, or assessment submissions.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --delete-cognito)
      delete_cognito=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 2
fi

email="$1"

if [[ ! "$email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+$ ]]; then
  echo "Invalid email: $email" >&2
  exit 2
fi

RESET_EMAIL="$email" npm --workspace apps/backend run db:unlink-dev-user-auth

if [[ "$delete_cognito" == "1" ]]; then
  scripts/delete-cognito-user.sh "$email"
fi

cat <<EOF

Dev auth reset complete for $email.

Local app DB:
  - users.externalAuthId was cleared for this email when a local user row existed.
  - Local app data was left in place.

Cognito:
  - $(if [[ "$delete_cognito" == "1" ]]; then echo "Matching AWS dev Cognito user was deleted if it existed."; else echo "No Cognito user was deleted. Pass --delete-cognito to delete it too."; fi)

Next login with this email can relink the local app user to the current Cognito identity.
EOF
