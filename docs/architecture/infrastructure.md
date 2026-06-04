# Infrastructure

Infrastructure is managed with Terraform.

## Current State

The AWS dev stack is currently deployed under `health-dev`. It includes Cognito, VPC networking, private RDS Postgres, ECR, ECS, ALB-backed public backend and frontend services, and the scheduled Stripe Checkout reconciliation job.

Retained/bootstrap infrastructure:

- Terraform bootstrap state bucket. The bucket still uses the original legacy `tele-...` name because Terraform state storage was not migrated during the project rename.
- Local Terraform bootstrap state files

Active development database:

- Local Docker Postgres from `docker-compose.yml`
- AWS dev RDS Postgres for the deployed backend

Auth:

- Terraform has deployed a Cognito user pool, Hosted UI domain, and public frontend app client.
- Cognito is HIPAA eligible under the AWS HIPAA eligible services program, but the app still needs the right AWS BAA, configuration, logging, and operational controls for HIPAA use.
- See [Auth](auth.md) for login flow, local env setup, and admin access.

## AWS Account

```text
profile: dev
account: 173748329850
region: us-east-2
state bucket: tele-terraform-state-173748329850-us-east-2
dev state key: envs/dev/terraform.tfstate
```

Authenticate:

```sh
make aws-login
make aws-whoami
```

## Terraform Layout

```text
infra/bootstrap
  one-time S3 Terraform state bucket setup

infra/envs/dev
  Cognito auth plus optional VPC, subnets, RDS, ECR, ECS cluster,
  migration task, scheduled jobs, and public backend/frontend services
```

Common commands:

```sh
make fmt
make validate
make bootstrap-init
make bootstrap-plan
make bootstrap-apply
make dev-init
make dev-plan
make dev-auth-plan
make dev-jobs-plan
```

Apply Cognito only:

```sh
make dev-auth-apply
```

Apply full dev resources:

```sh
terraform -chdir=infra/envs/dev apply
```

Destroy dev resources:

```sh
terraform -chdir=infra/envs/dev destroy
```

## Dev Network

Terraform dev creates:

- VPC: `10.20.0.0/16`
- Private DB subnets: `10.20.10.0/24`, `10.20.11.0/24`
- Public app subnets: `10.20.20.0/24`, `10.20.21.0/24`
- Backend security group for workloads that need Postgres access
- Postgres security group
- Optional ALB security groups when public backend/frontend services are enabled

These resources are skipped when `deploy_app_stack=false`.

## RDS Postgres

Terraform provisions a private RDS Postgres database:

```text
identifier: health-dev-postgres
port: 5432
database: health
username: health_admin
instance: db.t4g.micro
storage: 20 GB gp3, autoscale up to 100 GB
encrypted: yes
publicly accessible: no
backups: 7 days
```

Security model:

- RDS allows inbound TCP `5432` from the backend security group.
- `allowed_postgres_cidr_blocks` is currently empty.
- The laptop cannot connect directly to RDS by default.
- The RDS master password is managed by AWS Secrets Manager.

Approximate RDS cost before credits: about `$14/month`.

RDS is skipped when `deploy_app_stack=false`.

## App AWS Resources

Terraform currently creates:

- ECR repository: `health-dev-backend`
- ECR repository: `health-dev-frontend`
- ECS cluster: `health-dev`
- CloudWatch log group: `/ecs/health-dev-backend`
- CloudWatch log group: `/ecs/health-dev-frontend`
- IAM roles for backend task execution and task runtime
- One-off ECS task definition for backend migrations
- ECS task definition and EventBridge Scheduler schedule for Stripe Checkout reconciliation
- ALB-backed ECS backend service when `backend_service_enabled=true`
- ALB-backed ECS frontend service when `frontend_service_enabled=true`

ECR repository URLs:

```text
173748329850.dkr.ecr.us-east-2.amazonaws.com/health-dev-backend
173748329850.dkr.ecr.us-east-2.amazonaws.com/health-dev-frontend
```

App AWS resources are skipped when `deploy_app_stack=false`.

## Scheduled Jobs

Scheduled jobs are controlled separately from the public backend/frontend services. They are currently enabled in AWS dev:

```hcl
deploy_jobs_stack        = true
orders_expiry_enabled    = true
backend_service_enabled  = true
frontend_service_enabled = true
```

The jobs layer still requires `deploy_app_stack=true`, because the scheduled task runs in ECS and connects to private RDS from the dev VPC. It does not require public ALBs or long-running ECS services, even though those services are currently enabled for AWS dev.

When enabled, Terraform creates:

- ECS Fargate task definition: `health-dev-orders-expiry`
- IAM role that lets EventBridge Scheduler run that task
- EventBridge Scheduler schedule: `health-dev-orders-expiry`

The AWS scheduled task runs the compiled production script:

```sh
node apps/backend/dist/scripts/expire-unpaid-orders.js
```

Default schedule:

```hcl
orders_expiry_schedule_expression = "rate(15 minutes)"
orders_expiry_minutes             = 15
orders_expiry_batch_size          = 50
```

If unpaid orders use Stripe Checkout Sessions, set `stripe_api_key_secret_arn` to a Secrets Manager secret that contains the backend Stripe secret key. The scheduled task uses that key to retrieve stale open Checkout Sessions and mirror Stripe's state locally; it does not force-expire open Stripe sessions.

## Cognito

Terraform always creates Cognito resources, including in auth-only mode:

- Cognito user pool: `health-dev`
- Cognito Hosted UI domain using the AWS account ID for uniqueness
- Public app client for the Next.js frontend
- `admin` user group for backend admin access
- Link-based email confirmation for new signups
- OAuth authorization code flow with PKCE
- Local callback URLs:
  - `http://localhost:3001/auth/callback`
  - `http://127.0.0.1:3001/auth/callback`
- Optional deployed HTTPS callback URL derived from `frontend_domain`:
  - `https://<frontend_domain>/auth/callback`

Useful Terraform outputs:

- `cognito_user_pool_id`
- `cognito_frontend_client_id`
- `cognito_issuer`
- `cognito_hosted_ui_domain`

See [Auth](auth.md) for auth-only commands and local setup.

## Public Backend Service

The public backend service is controlled by:

```hcl
backend_service_enabled = true
```

When enabled, Terraform creates:

- Application Load Balancer
- HTTP listener on port `80`
- Optional HTTPS listener on port `443` when `backend_domain` and `validate_domain_certificates=true` are set
- Target group with `/health` health check
- ECS Fargate task definition
- ECS Fargate service
- Public HTTP/HTTPS security group rules

Preview service changes:

```sh
terraform -chdir=infra/envs/dev plan
```

Expected added cost when enabled: roughly `$20-30/month` before credits, mainly ALB plus one small Fargate task.

Useful outputs:

- `backend_public_url`
- `backend_load_balancer_dns_name`
- `backend_acm_validation_records`

## Public Frontend Service

The public frontend service is controlled by:

```hcl
frontend_service_enabled = true
```

When enabled, Terraform creates:

- ECR repository for frontend images
- CloudWatch log group
- Application Load Balancer
- HTTP listener on port `80`
- Optional HTTPS listener on port `443` when `frontend_domain` and `validate_domain_certificates=true` are set
- Target group with `/` health check
- ECS Fargate task definition
- ECS Fargate service
- Public HTTP/HTTPS security group rules

Useful outputs:

- `frontend_public_url`
- `frontend_load_balancer_dns_name`
- `frontend_acm_validation_records`

Custom domains are centralized with:

```hcl
frontend_domain              = "dev.condensedhealth.com"
backend_domain               = "api-dev.condensedhealth.com"
validate_domain_certificates = true
```

Current AWS dev HTTPS URLs are `https://dev.condensedhealth.com` and `https://api-dev.condensedhealth.com`.

When changing domains, set the new hostnames and temporarily use `validate_domain_certificates=false`. Terraform requests ACM certificates and outputs Cloudflare DNS validation CNAMEs. After those CNAMEs exist, set `validate_domain_certificates=true` and apply again to create HTTPS listeners and HTTP-to-HTTPS redirects.

The backend and frontend public services can be disabled independently with `backend_service_enabled=false` and `frontend_service_enabled=false`. This removes their ECS services and ALBs but keeps Cognito, RDS, ECR, and Terraform state.

## Runtime Platform

ECS task definitions use ARM64 Fargate because the local backend image is built on Apple Silicon by default.
