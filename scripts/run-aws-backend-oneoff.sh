#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <command> [args...]" >&2
  exit 2
fi

profile="${AWS_PROFILE:-dev}"
region="${AWS_REGION:-us-east-2}"
terraform_dir="${TERRAFORM_DIR:-infra/envs/dev}"
container_name="${CONTAINER_NAME:-backend-migration}"
container_env_json="${CONTAINER_ENV_JSON:-[]}"

command_json="$(node -e 'console.log(JSON.stringify(process.argv.slice(1)))' "$@")"
cluster="$(terraform -chdir="$terraform_dir" output -raw ecs_cluster_name)"
task_definition="$(terraform -chdir="$terraform_dir" output -raw backend_migration_task_definition_arn)"
subnets="$(terraform -chdir="$terraform_dir" output -raw app_public_subnet_ids_csv)"
security_group="$(terraform -chdir="$terraform_dir" output -raw backend_security_group_id)"
overrides="{\"containerOverrides\":[{\"name\":\"$container_name\",\"command\":$command_json,\"environment\":$container_env_json}]}"

task_arn="$(
  aws ecs run-task \
    --cluster "$cluster" \
    --launch-type FARGATE \
    --task-definition "$task_definition" \
    --network-configuration "awsvpcConfiguration={subnets=[$subnets],securityGroups=[$security_group],assignPublicIp=ENABLED}" \
    --overrides "$overrides" \
    --region "$region" \
    --profile "$profile" \
    --query 'tasks[0].taskArn' \
    --output text
)"

if [[ -z "$task_arn" || "$task_arn" == "None" ]]; then
  echo "Failed to start ECS one-off task" >&2
  exit 1
fi

echo "Started ECS one-off task: $task_arn"
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

echo "ECS one-off task stopped: $reason"
echo "ECS one-off task exit code: $exit_code"

if [[ "$exit_code" == "None" || -z "$exit_code" ]]; then
  exit 1
fi

if [[ "$exit_code" != "0" ]]; then
  exit "$exit_code"
fi
