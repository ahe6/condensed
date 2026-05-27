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
group_name="${COGNITO_ADMIN_GROUP:-admin}"

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
  echo "No Cognito user found for $email" >&2
  exit 1
fi

aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$user_pool_id" \
  --username "$username" \
  --group-name "$group_name" \
  --region "$region" \
  --profile "$profile"

echo "Added Cognito user $email ($username) to $group_name"
