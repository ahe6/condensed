#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <email>" >&2
  exit 2
fi

email="$1"
profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"

user_pool_id="$(terraform -chdir="$terraform_dir" output -raw cognito_user_pool_id)"

username="$(
  aws cognito-idp list-users \
    --user-pool-id "$user_pool_id" \
    --filter "email = \"$email\"" \
    --region "$region" \
    --profile "$profile" \
    --query 'Users[0].Username' \
    --output text
)"

if [[ -z "$username" || "$username" == "None" ]]; then
  echo "No Cognito user found for $email"
  exit 0
fi

aws cognito-idp admin-delete-user \
  --user-pool-id "$user_pool_id" \
  --username "$username" \
  --region "$region" \
  --profile "$profile"

echo "Deleted Cognito user $email ($username)"
