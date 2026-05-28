#!/usr/bin/env bash
set -euo pipefail

profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"

cluster="$(terraform -chdir="$terraform_dir" output -raw ecs_cluster_name)"
task_definition="$(terraform -chdir="$terraform_dir" output orders_expiry_task_definition_arn | tr -d '"')"
subnets="$(terraform -chdir="$terraform_dir" output -raw app_public_subnet_ids_csv)"
security_group="$(terraform -chdir="$terraform_dir" output -raw backend_security_group_id)"

if [[ -z "$task_definition" || "$task_definition" == "null" ]]; then
  echo "orders_expiry_task_definition_arn is not available. Deploy with deploy_jobs_stack=true first." >&2
  exit 2
fi

task_arn="$(
  aws ecs run-task \
    --cluster "$cluster" \
    --launch-type FARGATE \
    --task-definition "$task_definition" \
    --network-configuration "awsvpcConfiguration={subnets=[$subnets],securityGroups=[$security_group],assignPublicIp=ENABLED}" \
    --region "$region" \
    --profile "$profile" \
    --query 'tasks[0].taskArn' \
    --output text
)"

if [[ -z "$task_arn" || "$task_arn" == "None" ]]; then
  echo "Failed to start orders expiry task" >&2
  exit 1
fi

echo "Started orders expiry task: $task_arn"
aws ecs wait tasks-stopped \
  --cluster "$cluster" \
  --tasks "$task_arn" \
  --region "$region" \
  --profile "$profile"

exit_code="$(
  aws ecs describe-tasks \
    --cluster "$cluster" \
    --tasks "$task_arn" \
    --region "$region" \
    --profile "$profile" \
    --query 'tasks[0].containers[0].exitCode' \
    --output text
)"

reason="$(
  aws ecs describe-tasks \
    --cluster "$cluster" \
    --tasks "$task_arn" \
    --region "$region" \
    --profile "$profile" \
    --query 'tasks[0].stoppedReason' \
    --output text
)"

echo "Orders expiry task stopped: $reason"
echo "Orders expiry exit code: $exit_code"

if [[ "$exit_code" == "None" || -z "$exit_code" ]]; then
  exit 1
fi

if [[ "$exit_code" != "0" ]]; then
  exit "$exit_code"
fi
